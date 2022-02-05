import React, { Component} from "react";
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
  audioElement: HTMLMediaElement | null;
  audioElementRef: React.RefObject<HTMLMediaElement>;
  source: AudioBufferSourceNode;
  gainNode: GainNode;
  track: MediaElementAudioSourceNode;

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
    this.audioElementRef = React.createRef();
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
  });
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
      </div>
    );
  }
}
export default App;