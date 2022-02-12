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
  maxZoom: number;
  zoomScale: number; //higher means slower zooming
  numberOfTicks: number;

  constructor(props: WaveformProps) {
    super(props);
    this.state = {
      hover: 0,
      hovering: false,
      zoom: 1,
      windowPosition: this.props.duration/2,
    }
    this.maxZoom = 100;
    this.zoomScale = 50;
    this.numberOfTicks = 20;
    this.waveformCanvasRef = React.createRef();
    this.positionCanvasRef = React.createRef();
  }

  componentDidMount(){
    this.drawBuffer();
    this.drawPositionCanvas();
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
    this.drawPositionCanvas();
  }
  //utility for avoiding this boilerplate
  getCanvasWidth(): number{
    const canvas = this.waveformCanvasRef.current;
    if(canvas){
      return canvas.width;
    }else{
      return 1;
    }
  }
  //trackValue: a number scaled relative to the track
  //return: a number clamped and normalized to the current window
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
    return windowValue/windowSize;
  }

  //trackValue: a number scaled relative to the track
  //return: returns true if visible in the current window false otherwise
  isPositionInWindow(trackValue: number): boolean{
    var windowSize = this.props.duration/this.state.zoom;
    var leftWindowPosition = this.state.windowPosition - windowSize/2;
    var rightWindowPosition = this.state.windowPosition + windowSize/2;
    return leftWindowPosition < trackValue && trackValue < rightWindowPosition;
  }

  //normalWindowValue: a normalized number scaled relative to the window
  //return: a number scaled to the track
  normalWindowToTrack(normalWindowValue: number): number{
    var windowSize = this.props.duration/this.state.zoom;
    var leftWindowPosition = this.state.windowPosition - windowSize/2;
    var position = normalWindowValue*windowSize + leftWindowPosition;
    return position;
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

  drawPositionCanvas(){
    const canvas = this.positionCanvasRef.current;
    if(canvas){
      const ctx = canvas.getContext('2d');
      if(ctx){
        this.clear();
        ctx.fillStyle = 'rgba(100,100,100,0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if(this.isPositionInWindow(this.props.loopStart)){
          var loopStartPosition = this.trackToWindow(this.props.loopStart)*canvas.width;
          ctx.fillStyle = 'rgba(255,255,255,1.0)';
          ctx.fillRect(0, 0, loopStartPosition, canvas.height);
        }
        if(this.isPositionInWindow(this.props.loopEnd)){
          var loopEndPosition = this.trackToWindow(this.props.loopEnd)*canvas.width;
          ctx.fillStyle = 'rgba(255,255,255,1.0)';
          ctx.fillRect(loopEndPosition, 0, canvas.width-loopEndPosition, canvas.height);
        }
        if(this.isPositionInWindow(this.props.progress)){
          var windowPosition = this.trackToWindow(this.props.progress);
          ctx.fillStyle = 'rgba(0,0,0,1.0)';
          ctx.fillRect(windowPosition*canvas.width, 0, 1, canvas.height);
        }
        if(this.state.hovering){
          ctx.fillStyle = 'rgba(0,0,0,0.8)';
          ctx.fillRect(this.state.hover, 0, 1, canvas.height);
        }
      }
    }
  }

  drawBuffer() {
    const canvas = this.waveformCanvasRef.current;
    if(canvas){
      var width = canvas.width;
      var height = canvas.height;
      var ctx = canvas.getContext('2d');
      var buffer = this.props.audioBuffer;
      if(ctx){
        ctx.clearRect(0, 0, width, height);
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
          ctx.fillRect(i,(1+min)*amp,1,Math.max(1,(max-min)*amp));
        }
        var windowSize = this.props.duration/this.state.zoom;
        var step = windowSize/this.numberOfTicks;
        var decimal = 1;
        if(step < 2){
          decimal = decimal*10;
        }
        if(step < 1){
          decimal = decimal*10;
        }
        var offset = this.state.windowPosition - windowSize/2;
        for(var i=0; i <= this.numberOfTicks; i++){
          var num = Math.round((offset + step*i + Number.EPSILON) * decimal) / decimal;
          ctx.fillText(`${num}`, i*(width-30)/this.numberOfTicks, 10);
        }
      }
    }
  }
  handleScroll = (e: WheelEvent) => {
    e.preventDefault();
    //clamp zoom
    var newZoom = this.state.zoom - e.deltaY/this.zoomScale;
    if(newZoom < 1) newZoom = 1;
    if(newZoom > this.maxZoom) newZoom = this.maxZoom; 
    if(newZoom === this.state.zoom) return;
    //get position of zoom in buffer
    var windowSize = this.props.duration/this.state.zoom;
    var normalizedScrollPosition = this.state.hover/this.getCanvasWidth();
    var leftWindowPosition = this.state.windowPosition - windowSize/2
    var scrollPositionInBuffer = leftWindowPosition + normalizedScrollPosition*windowSize;
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
  }
  waveformHover = (e: React.MouseEvent<HTMLCanvasElement>) => {
    this.setState({
      hover: e.clientX-10,
      hovering: true,
    })
  }
  waveformExit = (e: React.MouseEvent<HTMLCanvasElement>) => {    
    this.setState({
      hover: 0,
      hovering: false,
    })
  }
  waveformClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    var normalizedPosition = (e.clientX-10)/this.getCanvasWidth();
    this.props.onSeek(this.normalWindowToTrack(normalizedPosition));
  }
  //input is normalized window value
  loopStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    var positionInTransport = this.normalWindowToTrack(Number(e.target.value));
    this.props.loopStartChange(positionInTransport);
  }
  //input is normalized window value
  loopEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    var positionInTransport = this.normalWindowToTrack(Number(e.target.value));
    this.props.loopEndChange(positionInTransport);
  }

  render(){
    return(
      <div className="Waveform" style={{width: window.innerWidth-20}}>
        <DoubleSlider
          left={this.trackToWindow(this.props.loopStart)}
          right={this.trackToWindow(this.props.loopEnd)}
          leftChange={this.loopStartChange}
          rightChange={this.loopEndChange}
        />
        <div style={{position: 'relative', height: "200px"}}>
          <canvas onMouseMove={this.waveformHover} onMouseLeave={this.waveformExit} onClick={this.waveformClick} ref={this.waveformCanvasRef}
           height="200" width={window.innerWidth-20} style={{zIndex: 1}}></canvas>
          <canvas ref={this.positionCanvasRef}
           height="200" width={window.innerWidth-20} style={{zIndex: 0}}></canvas>
        </div>
      </div>
    );
  }
}
export default Waveform;