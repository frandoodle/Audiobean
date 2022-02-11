import React, {Component} from "react";
import * as Tone from "tone";
import "./Waveform.css";
import DoubleSlider from "./DoubleSlider";

type WaveformState = {
  hovering: boolean;
  hover: number;
  windowPosition: number;
  zoom: number;
}
type WaveformProps = {
  audioBuffer: Tone.ToneAudioBuffer;
  progress: number;
  duration: number;
  onSeek: Function;
  loopStart: number;
  loopEnd: number;
  loopStartChange: Function;
  loopEndChange: Function;
} 

class Waveform extends Component<WaveformProps, WaveformState>{

  waveformCanvasRef: React.RefObject<HTMLCanvasElement>;
  positionCanvasRef: React.RefObject<HTMLCanvasElement>;

  constructor(props: WaveformProps) {
    super(props);
    this.state = {
      hover: 0,
      hovering: false,
      zoom: 1,
      windowPosition: this.props.duration/2,
    }
    this.waveformCanvasRef = React.createRef();
    this.positionCanvasRef = React.createRef();
  }

  componentDidMount(){
    this.drawBuffer();
    const canvas = this.waveformCanvasRef.current;
    if(canvas){
      canvas.addEventListener('wheel', this.handleScroll, {passive: false});
    }
    window.onresize = ()=>{
      this.forceUpdate(); 
      this.drawBuffer();
    };
  }
  componentWillUnmount(){
    const canvas = this.waveformCanvasRef.current;
    if(canvas){
      canvas.removeEventListener('wheel', this.handleScroll);
    }
  }
  componentDidUpdate(prevProps: WaveformProps){
    if(prevProps.progress !== this.props.progress){
      if(this.isPositionInWindow(this.props.progress)){
        this.clear();
        this.drawPosition(this.props.progress, this.props.duration);
        if(this.state.hovering){
          this.drawPosition(this.state.hover);
        }
      }
    }
  }
  //trackValue: a number scaled relative to the track
  //return: a number clamped and scaled to the current window
  trackToWindow(trackValue: number): number{
    var windowSize = this.props.duration/this.state.zoom;
    var leftWindowPosition = this.state.windowPosition - windowSize/2;
    var rightWindowPosition = this.state.windowPosition + windowSize/2;
    if(trackValue < leftWindowPosition){
      trackValue = leftWindowPosition;
    } else if(rightWindowPosition<trackValue){
      trackValue = rightWindowPosition;
    }
    var offset = this.state.windowPosition - windowSize/2;
    var windowValue = trackValue - offset;
    return windowValue;
  }
  //trackValue: a number scaled relative to the track
  //return: true if visible in the current window false otherwise
  isPositionInWindow(trackValue: number): boolean{
    var windowSize = this.props.duration/this.state.zoom;
    var leftWindowPosition = this.state.windowPosition - windowSize/2;
    var rightWindowPosition = this.state.windowPosition + windowSize/2;
    var inWindow = leftWindowPosition < trackValue && trackValue < rightWindowPosition;
    return inWindow;
  }
  drawBuffer() {
    const canvas = this.waveformCanvasRef.current;
    if(canvas){
      var width = canvas.width;
      var height = canvas.height;
      var context = canvas.getContext('2d');
      var buffer = this.props.audioBuffer;
      if(context){
        context.clearRect(0, 0, width, height);
        var dataRaw = buffer.getChannelData( 0 );
        var windowPositionSample = (dataRaw.length/this.props.duration)*this.state.windowPosition;
        var sampleWindowSize = dataRaw.length/this.state.zoom;
        var leftSample = Math.floor(windowPositionSample - sampleWindowSize/2);
        var rightSample = Math.ceil(windowPositionSample + sampleWindowSize/2);
        var data = dataRaw.slice(leftSample, rightSample)
        var step = Math.ceil( data.length / width ); //step size is how many data items compress to a singel pixel 
        var amp = height / 2;
        for(var i=0; i < width; i++){ // for every pixel
          var min = 1.0;
          var max = -1.0;
          for (var j=0; j<step; j++) { //find min and max within step size
              var datum = data[(i*step)+j]; 
              if (datum < min)
                  min = datum;
              if (datum > max)
                  max = datum;
          }
          // void ctx.fillRect(x, y, width, height);
          context.fillRect(i,(1+min)*amp,1,Math.max(1,(max-min)*amp));
        }
        var increments = 20;
        var windowSize = this.props.duration/this.state.zoom;
        var step = windowSize/increments;
        var decimal = 1;
        if(step < 2){
          decimal = decimal*10;
        }
        if(step < 1){
          decimal = decimal*10;
        }
        var offset = this.state.windowPosition - windowSize/2;
        for(var i=0; i <= increments; i++){
          var num = Math.round((offset + step*i + Number.EPSILON) * decimal) / decimal;
          context.fillText(`${num}`, i*(width-30)/increments, 10);
        }
      }
    }
  }
  drawPosition(position: number, ratio?: number){
    const canvas = this.positionCanvasRef.current;
    if(canvas){
      var scale = 1;
      if(ratio){
        scale = canvas.width / ratio;
      }
      var x = (position*scale - canvas.getBoundingClientRect().left);
      var y = 0;
      var w = 1;
      var h = canvas.height;
      const ctx = canvas.getContext('2d');
      if(ctx){
        ctx.fillRect(x, y, w, h);
      }
    }
  }
  clear(){
    const canvas = this.positionCanvasRef.current;
    if(canvas){
      const ctx = canvas.getContext('2d')
      if(ctx){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }
  handleScroll = (e: WheelEvent) => {
    e.preventDefault();
    //check max zoom
    var zoomScale = 50
    var newZoom = this.state.zoom - e.deltaY/50;
    if(newZoom < 1) newZoom = 1;
    if(newZoom > 100) newZoom = 100; 
    if(newZoom !== this.state.zoom){
      const canvas = this.positionCanvasRef.current;
      if(canvas){
        //get position of zoom in buffer
        var windowSize = this.props.duration/this.state.zoom;
        var normalizedScrollPosition = this.state.hover/canvas.width;
        var scrollPositionInBuffer = (this.state.windowPosition - windowSize/2) + normalizedScrollPosition*windowSize;
        //get new windowPosition
        var normalizedDistanceToCenter = 0.5 - normalizedScrollPosition;
        var newWindowSize = this.props.duration/newZoom;
        var newWindowPosition = scrollPositionInBuffer + normalizedDistanceToCenter*newWindowSize;
        //check we have not run out of buffer on either side
        var leftWindowPosition = newWindowPosition - newWindowSize/2;
        var rightWindowPosition = newWindowPosition + newWindowSize/2;
        if(leftWindowPosition < 0){
          newWindowPosition -= leftWindowPosition; 
        } else if(this.props.duration < rightWindowPosition){
          newWindowPosition -= rightWindowPosition - this.props.duration;
        }
        this.setState({
          windowPosition: newWindowPosition,
          zoom: newZoom,

        }, this.drawBuffer)
        if(leftWindowPosition > this.props.progress || this.props.progress > rightWindowPosition){
          this.clear();
          if(this.state.hovering){
            this.drawPosition(this.state.hover);
        }
      }
      }
    }
  }
  waveformHover = (e: React.MouseEvent<HTMLCanvasElement>) => {
    this.clear();
    this.drawPosition(e.clientX);
    if(this.isPositionInWindow(this.props.progress)){
      this.drawPosition(this.props.progress, this.props.duration);
    }
    this.setState({
      hover: e.clientX,
      hovering: true,
    })
  }
  waveformExit = (e: React.MouseEvent<HTMLCanvasElement>) => {    
    this.clear();
    if(this.isPositionInWindow(this.props.progress)){
      this.drawPosition(this.props.progress, this.props.duration);
    }
    this.setState({
      hover: 0,
      hovering: true,
    })
  }
  waveformClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = this.positionCanvasRef.current;
    if(canvas){
      var normalizedPosition = e.clientX/canvas.width;
      var windowSize = this.props.duration/this.state.zoom;
      var leftWindowPosition = this.state.windowPosition - windowSize/2;
      var position = normalizedPosition*windowSize + leftWindowPosition;
      this.props.onSeek(position);
      }
  }
  //input is normalized 
  loopStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    var value = Number(e.target.value);
    var windowSize = this.props.duration/this.state.zoom;
    var offset = this.state.windowPosition - windowSize/2;
    this.props.loopStartChange(offset + value*windowSize);
  }
  //input is normalized
  loopEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    var value = Number(e.target.value);
    var windowSize = this.props.duration/this.state.zoom;
    var offset = this.state.windowPosition - windowSize/2;
    this.props.loopEndChange(offset + value*windowSize);
  }

  render(){
    var windowSize = this.props.duration/this.state.zoom;
    var leftSliderPosition = this.trackToWindow(this.props.loopStart)/windowSize;
    var rightSliderPosition = this.trackToWindow(this.props.loopEnd)/windowSize;
    const canvas = this.positionCanvasRef.current;
    var canvasWidth = 0;
    if(canvas){
      canvasWidth = canvas.width;
    }
    
    return(
      <div className="Waveform">
        <div className="DoubleSliderContainer">
          <DoubleSlider
            left={leftSliderPosition}
            right={rightSliderPosition}
            leftChange={this.loopStartChange}
            rightChange={this.loopEndChange}
          />
        </div>
        <div style={{position: 'relative', height: "200px"}}>
          <canvas onMouseMove={this.waveformHover} onMouseLeave={this.waveformExit} onClick={this.waveformClick} ref={this.waveformCanvasRef}
           height="200" width={window.innerWidth} style={{zIndex: 1}}></canvas>
          <canvas ref={this.positionCanvasRef}
           height="200" width={window.innerWidth} style={{zIndex: 0}}></canvas>
        </div>
      </div>
    );
  }
}
export default Waveform;