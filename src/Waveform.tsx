import React, {Component} from "react";
import * as Tone from "tone";
import "./Waveform.css";
import filepath from "./dire.mp3";

type WaveformState = {
  hovering: boolean;
  hover: number;
}
type WaveformProps = {
  audioBuffer: Tone.ToneAudioBuffer;
  progress: number;
  duration: number;
  onSeek: Function;
} 

class Waveform extends Component<WaveformProps, WaveformState>{

  waveformCanvasRef: React.RefObject<HTMLCanvasElement>;
  positionCanvasRef: React.RefObject<HTMLCanvasElement>;

  constructor(props: WaveformProps) {
    super(props);
    this.state = {
      hover: 0,
      hovering: false,
    }
    this.waveformCanvasRef = React.createRef();
    this.positionCanvasRef = React.createRef();
  }

  componentDidMount(){
    const canvas = this.waveformCanvasRef.current;
    if(canvas){
      this.drawBuffer(canvas.width, canvas.height, canvas.getContext('2d'), this.props.audioBuffer);
    }
  }
  componentDidUpdate(prevProps: WaveformProps){
    if(prevProps.progress !== this.props.progress){
      this.clear();
      this.drawPosition(this.props.progress, this.props.duration);
      if(this.state.hovering){
        this.drawPosition(this.state.hover);
      }
    }
  }
  drawBuffer(width:number, height:number, context:CanvasRenderingContext2D | null, buffer:Tone.ToneAudioBuffer) {
    if(context){
      var data = buffer.getChannelData( 0 );
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
  waveformHover = (e: React.MouseEvent<HTMLCanvasElement>) => {
    this.clear();
    this.drawPosition(e.clientX);
    this.drawPosition(this.props.progress, this.props.duration);
    this.setState({
      hover: e.clientX,
      hovering: true,
    })
  }
  waveformExit = (e: React.MouseEvent<HTMLCanvasElement>) => {    
    this.clear();
    this.drawPosition(this.props.progress, this.props.duration);
    this.setState({
      hover: 0,
      hovering: true,
    })
  }
  waveformClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = this.positionCanvasRef.current;
    if(canvas){
      var scale = this.props.duration/canvas.width;
      var position = e.clientX*scale;
      this.props.onSeek(position);
      }
  }

  render(){
    return(
      <div className="Waveform">
        <div style={{position: 'relative', height: "200px"}}>
          <canvas onMouseMove={this.waveformHover} onMouseLeave={this.waveformExit} onClick={this.waveformClick} ref={this.waveformCanvasRef}
          width="1536" height="200" style={{position: 'absolute', left: 0, top: 0, zIndex: 1,}}></canvas>
          <canvas ref={this.positionCanvasRef}
          width="1536" height="200" style={{position: 'absolute', left: 0, top: 0, zIndex: 0,}}></canvas>
        </div>
        {/*<div>
          {this.state.cursor}
        </div>*/}
      </div>
    );
  }
}
export default Waveform