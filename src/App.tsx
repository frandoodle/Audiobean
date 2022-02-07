import React, {Component} from "react";
import * as Tone from 'tone'
import "./App.css";
import Waveform from "./Waveform"
import filepath from "./dire.mp3";

type AppState = {
  started: boolean;
  playing: boolean;
  granular: boolean;
  lastTime: number;
  progress: number;
  volume: number;
  speed: number;
  cent: number;
  semitone: number;
}
type AppProps = {
} 

class App extends Component<AppProps, AppState>{
  pitchShift: Tone.PitchShift;
  player: Tone.Player;
  grainPlayer: Tone.GrainPlayer;

  constructor(props: AppProps) {
    super(props);
    this.state = {
      started: false, 
      playing: false,
      granular: false,
      lastTime: 0,
      progress: 0,
      volume: 1,
      speed: 1,
      cent: 0,
      semitone: 0,
    };
  }

  async componentDidMount(){
    await Tone.start()
    this.player = new Tone.Player(filepath, () => {
      this.pitchShift = new Tone.PitchShift().toDestination();
      this.player.connect(this.pitchShift);
      this.player.sync().start(0);
      Tone.Transport.setLoopPoints(0,this.player.buffer.duration);
      Tone.Transport.loop = true;
      Tone.Transport.on('loop', () => {
        Tone.Transport.loopEnd = this.player.buffer.duration / this.state.speed
        this.setState({
          progress: 0,
          lastTime: 0
        })
      })
    });
    this.grainPlayer = new Tone.GrainPlayer(filepath, () => {
      this.grainPlayer.sync().start(0);
      this.grainPlayer.mute = true;
      this.grainPlayer.toDestination();
    });
  }

  playClickHandler = async (e: React.SyntheticEvent) => {
    if(this.state.started === false){
      await Tone.loaded()
      var ctx = Tone.getContext();
      if(ctx){
        ctx.resume();
        this.updateProgress();
        this.setState({
        started: true
        })
      }
      
    }
    if(this.state.playing === false){
      Tone.Transport.start();
      this.setState({
        playing: true
      })
    }else if(this.state.playing === true){
      Tone.Transport.pause();
      this.setState({
        playing: false
      })
    }
  }

  resetClickHandler = (e: React.SyntheticEvent) => {
    Tone.Transport.seconds = 20;
  }

  // volumeChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   this.setState({
  //     volume: Number(e.target.value)
  //   })
  //   this.gainNode.gain.value = Number(e.target.value);
  // }

  speedChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    var newSpeed = Number(e.target.value);
    this.setState({
      speed: newSpeed
    })
    this.player.playbackRate = newSpeed;
    this.grainPlayer.playbackRate = newSpeed;
    this.pitchShift.pitch = -Math.log2(newSpeed)*12 + this.state.semitone; //maintain the original pitch after changing the playback speed.
    Tone.Transport.loopEnd = Tone.Transport.seconds + (this.player.buffer.duration - this.state.progress) / newSpeed;
  }
  semitoneChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    var newSemitone = Number(e.target.value);
    this.setState({
      semitone: newSemitone
    })
    this.grainPlayer.detune = newSemitone*100 + -Math.log2(this.state.speed)*1200;
    this.pitchShift.pitch = newSemitone + -Math.log2(this.state.speed)*12;
  }
  // centChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   this.setState({
  //     cent: Number(e.target.value)
  //   })
  //   this.source.detune.value = this.state.semitone + this.state.cent;
  // }
  playbackChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    var newGranular = e.target.checked;
    this.setState({
      granular: newGranular
    })
    this.grainPlayer.mute=!newGranular;
    this.player.mute=newGranular;
  }
  updateProgress() {
    var newProgress = Tone.Transport.seconds;
    if(newProgress !== this.state.lastTime){
      var adjustedProgress = this.state.progress + (newProgress - this.state.lastTime)*this.state.speed;
      this.setState({
        progress: adjustedProgress,
        lastTime: newProgress
      })
    }
    requestAnimationFrame(this.updateProgress.bind(this));
  }
  seek = (position: number) => {
    var transportPosition = position / this.state.speed;
    Tone.Transport.seconds = transportPosition;
    Tone.Transport.loopEnd = this.player.buffer.duration / this.state.speed;
    this.setState({
      progress: position,
      lastTime: transportPosition,
    })
  }

  render(){

    return(
      <div className="App">
        <button onClick={this.playClickHandler}>
          <span>Play/Pause</span>
        </button>
        <button onClick={this.resetClickHandler}>
          <span>Reset to ? seconds</span>
        </button>
        <label>{this.state.granular ? "granular" : "audio"}</label>
        <input type="checkbox" checked={this.state.granular} onChange={this.playbackChangeHandler} />
        {/*<label>{this.state.volume}</label>
        <input type="range" min="0" max="2" value={this.state.volume} step="0.01" onChange={this.volumeChangeHandler} />*/}
        <label>{this.state.speed}</label>
        <input type="range" min="0" max="8" value={this.state.speed} step="0.01" onChange={this.speedChangeHandler} />
        <label>{this.state.semitone}</label>
        <input type="range" min="-12" max="12" value={this.state.semitone} step="1" onChange={this.semitoneChangeHandler} />
        {/*<label>{this.state.cent}</label>*/}
        {/*<input type="range" min="-100" max="100" value={this.state.cent} step="1" onChange={this.centChangeHandler} />*/}
        {this.player && this.player.buffer ?
          <Waveform audioBuffer={this.player.buffer}
                    progress={this.state.progress}
                    duration={this.player.buffer.duration}
                    onSeek={this.seek}/> :
          <span>"Loading"</span>}
        {/*<div>{this.player ? this.player.buffer.duration: 0}</div>
        <div>{Tone.Transport.loopEnd}</div>
        <div>{this.state.progress}</div>
        <div>{Tone.Transport.seconds}</div>*/}
      </div>
    );
  }
}
export default App;