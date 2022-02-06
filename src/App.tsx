import React, {Component} from "react";
import "./App.css";
import filepath from "./dire.mp3";

type AppState = {
  started: boolean;
  playing: boolean;
  volume: number;
  speed: number;
  cent: number;
  semitone: number;
}
type AppProps = {
} 

class App extends Component<AppProps, AppState>{
  audioContext: AudioContext;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  source: AudioBufferSourceNode;
  gainNode: GainNode;

  constructor(props: AppProps) {
    super(props);
    this.state = {
      started: false, 
      playing: false,
      volume: 1,
      speed: 1,
      cent: 0,
      semitone: 0,
    };
    this.canvasRef = React.createRef();
  }

  componentDidMount(){
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.setupSample()
      .then((audioBuffer) => {
        this.source = this.audioContext.createBufferSource();
        this.source.buffer = audioBuffer;
        this.source.playbackRate.value = this.state.speed;
        this.gainNode = this.audioContext.createGain();
        this.source.connect(this.gainNode).connect(this.audioContext.destination);
        this.source.loop = true;
        const canvas = this.canvasRef.current;
        if(canvas){
          this.drawBuffer(canvas.width, canvas.height, canvas.getContext('2d'), audioBuffer);
        }
  });
  }

  drawBuffer(width:number, height:number, context:CanvasRenderingContext2D | null, buffer:AudioBuffer) {
    if(context){
      var data = buffer.getChannelData( 0 );
      var step = Math.ceil( data.length / width );
      var amp = height / 2;
      for(var i=0; i < width; i++){
          var min = 1.0;
          var max = -1.0;
          for (var j=0; j<step; j++) {
              var datum = data[(i*step)+j]; 
              if (datum < min)
                  min = datum;
              if (datum > max)
                  max = datum;
          }
          context.fillRect(i,(1+min)*amp,1,Math.max(1,(max-min)*amp));
      }
    }
  }

  playClickHandler = (e: React.SyntheticEvent) => {
    if(this.state.started === false){
      this.source.start(0);
      this.setState({
        started: true
      })
    }
    if(this.state.playing === false){
      this.audioContext.resume();
      this.setState({
        playing: true
      })
    }else if(this.state.playing === true){
      this.audioContext.suspend();
      this.setState({
        playing: false
      })
    }
  }

  volumeChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      volume: Number(e.target.value)
    })
    this.gainNode.gain.value = Number(e.target.value);
  }

  speedChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      speed: Number(e.target.value)
    })
    this.source.playbackRate.value = Number(e.target.value);
  }
  semitoneChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      semitone: Number(e.target.value)
    })
    this.source.detune.value = this.state.semitone + this.state.cent;
  }
  centChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      cent: Number(e.target.value)
    })
    this.source.detune.value = this.state.semitone + this.state.cent;
  }

  async setupSample() {
      const response = await fetch(filepath);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      return audioBuffer;
  }

  render(){
    return(
      <div className="App">
        {/*<audio src={dire} ref={this.audioElementRef}></audio>*/}
        <button onClick={this.playClickHandler}>
          <span>Play/Pause</span>
        </button>
        <label>{this.state.volume}</label>
        <input type="range" min="0" max="2" value={this.state.volume} step="0.01" onChange={this.volumeChangeHandler} />
        <label>{this.state.speed}</label>
        <input type="range" min="0" max="2" value={this.state.speed} step="0.01" onChange={this.speedChangeHandler} />
        <label>{this.state.semitone}</label>
        <input type="range" min="-9600" max="9600" value={this.state.semitone} step="100" onChange={this.semitoneChangeHandler} />
        <label>{this.state.cent}</label>
        <input type="range" min="-100" max="100" value={this.state.cent} step="1" onChange={this.centChangeHandler} />
        <canvas ref={this.canvasRef} width="1536" height="200"></canvas>
      </div>
    );
  }
}
export default App;