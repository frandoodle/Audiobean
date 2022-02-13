import React, {Component} from "react";
import * as Tone from 'tone'
import "./App.css";
import Waveform from "./Waveform"
import SingleSlider from "./SingleSlider"
import Checkbox from "./Checkbox"
import Textbox from "./Textbox"
import filepath from "./dire.mp3";
import play from "./play.png";
import pause from "./pause.png";

type AppState = {
  started: boolean;
  playing: boolean;
  granular: boolean;
  lastTime: number;
  progress: number;
  maxDuration: number;
  loopStart: number;
  loopEnd: number;
  volume: number;
  speed: number;
  semitone: number;
}
type AppProps = {
} 

class App extends Component<AppProps, AppState>{
  pitchShift: Tone.PitchShift;
  player: Tone.Player;
  grainPlayer: Tone.GrainPlayer;
  gainNode: Tone.Gain;

  constructor(props: AppProps) {
    super(props);
    this.state = {
      started: false,
      playing: false,
      granular: false,
      lastTime: 0,
      progress: 0,
      maxDuration: 0,
      loopStart: 0,
      loopEnd: 0,
      volume: 1,
      speed: 1,
      semitone: 0,
    };
  }

  componentDidMount(){
    Tone.start();
    this.gainNode = new Tone.Gain(this.state.volume).toDestination();
    this.player = new Tone.Player(filepath, () => {
      this.pitchShift = new Tone.PitchShift();
      this.player.connect(this.pitchShift).connect(this.gainNode);
      this.player.sync().start(0);
      this.setState({maxDuration: this.player.buffer.duration, loopEnd: this.player.buffer.duration});
      Tone.Transport.setLoopPoints(0,this.player.buffer.duration);
    });
    this.grainPlayer = new Tone.GrainPlayer(filepath, () => {
      this.grainPlayer.sync().start(0);
      this.grainPlayer.mute = true;
      this.grainPlayer.connect(this.gainNode);
    });
    Tone.Transport.loop = true;
    Tone.Transport.on('loop', () => {
      Tone.Transport.loopEnd = this.state.loopEnd / this.state.speed;
      Tone.Transport.loopStart = this.state.loopStart / this.state.speed;
      if(this.state.speed !== 1){
        this.player.restart(Tone.immediate(),this.state.loopStart); //fixes bizarre playbackRate issue in Tonejs
      }
      this.setState({
        progress: 0,
        lastTime: 0
      })
    })
  }

  playClickHandler = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if(this.state.started === false){
      await Tone.loaded()
      document.addEventListener('keydown', (e:KeyboardEvent) => {
      e.keyCode === 32 && this.playClickHandler();
      })
      document.addEventListener('keyup', (e:KeyboardEvent) => {
        e.keyCode === 32 && e.preventDefault();
      })
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
      if(this.state.speed !== 1 && this.state.progress < this.state.loopEnd){
        this.player.mute=true;
        this.grainPlayer.mute=true;
        Tone.Transport.scheduleOnce( () => {
          this.player.restart(Tone.immediate(),this.state.progress);
          this.grainPlayer.mute=!this.state.granular;
          this.player.mute=this.state.granular;
        }, Tone.Transport.seconds+0.01);
      }
      this.setState({
        playing: true,
      })
    }else if(this.state.playing === true){
      Tone.Transport.pause();
      this.setState({
        playing: false,
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
    var newSpeed = Number(e.target.value);
    this.setState({
      speed: newSpeed
    })
    this.player.playbackRate = newSpeed;
    this.grainPlayer.playbackRate = newSpeed;
    this.pitchShift.pitch = -Math.log2(newSpeed)*12 + this.state.semitone; //maintain the original pitch after changing the playback speed.
    var remainingTime = this.state.loopEnd - this.state.progress;
    Tone.Transport.loopEnd = Tone.Transport.seconds + remainingTime / newSpeed;
    Tone.Transport.loopStart = this.state.loopStart / this.state.speed;
  }
  semitoneChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    var newSemitone = Number(e.target.value);
    this.setState({
      semitone: newSemitone
    })
    this.grainPlayer.detune = newSemitone*100;
    this.pitchShift.pitch = newSemitone + -Math.log2(this.state.speed)*12;
  }
  playbackChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    var newGranular = e.target.checked;
    this.setState({
      granular: newGranular
    })
    this.grainPlayer.mute=!newGranular;
    this.player.mute=newGranular;
  }
  loopStartChange = (value:number) => {
    var newLoopStart = value;
    if(0 <= newLoopStart && newLoopStart < this.state.loopEnd){
      this.setState({
        loopStart: newLoopStart
      })
      Tone.Transport.loopStart = newLoopStart / this.state.speed;
    }
  }
  loopEndChange = (value:number) => {
    var newLoopEnd = value;
    if(this.state.loopStart < newLoopEnd && newLoopEnd <= this.state.maxDuration){
      this.setState({
        loopEnd: newLoopEnd
      })
      var remainingTime = this.state.loopEnd - this.state.progress;
      Tone.Transport.loopEnd = Tone.Transport.seconds + remainingTime / this.state.speed;
    }
  }
  updateProgress() {
    var newProgress = Tone.Transport.seconds;
    if(newProgress !== this.state.lastTime){
      var adjustedProgress = this.state.progress + (newProgress - this.state.lastTime)*this.state.speed;
      this.setState({
        progress: adjustedProgress,
        lastTime: newProgress,
      })
    }
    requestAnimationFrame(this.updateProgress.bind(this));
  }
  seek = (position: number) => {
    var transportPosition = position / this.state.speed;
    Tone.Transport.seconds = transportPosition;
    if(this.state.playing){
      this.player.restart(Tone.immediate(),position); //fixes bizarre playbackRate issue in Tonejs
    }
    Tone.Transport.loopEnd = this.state.loopEnd / this.state.speed;
    this.setState({
      progress: position,
      lastTime: transportPosition,
    })
  }
  onLoad = (url: string) => {
    console.log(url);
  }
  render(){

    return(
      <div className="App" 
           onDragStart={(e:React.MouseEvent<Element>)=>{e.preventDefault()}}
           onDrop={(e:React.MouseEvent<Element>)=>{e.preventDefault()}}
      >
        <div className="controlbar">
          <Textbox
            placeholder="YouTube url"
            buttonText="load"
            handleClick={this.onLoad}
          />
          <button onClick={this.playClickHandler}>
            {this.state.playing ? <img src={pause} alt="pause"/> : <img src={play} alt="play"/>}
          </button>
          <Checkbox
            name="granular"
            value={this.state.granular}
            onChange={this.playbackChangeHandler}
          />
          <SingleSlider
            name="volume"
            value={this.state.volume}
            onChange={this.volumeChangeHandler}
            min={0}
            max={2}
            step={0.01}
          />
          <SingleSlider
            name="speed"
            value={this.state.speed}
            onChange={this.speedChangeHandler}
            min={0.25}
            max={2}
            step={0.01}
          />
          <SingleSlider
            name="transpose"
            value={this.state.semitone}
            onChange={this.semitoneChangeHandler}
            min={-12}
            max={12}
            step={1}
          />
        </div>
        <div className="waveformContainer">
          {this.player && this.player.buffer ?
            <Waveform audioBuffer={this.player.buffer}
                      progress={this.state.progress}
                      duration={this.state.maxDuration}
                      onSeek={this.seek}
                      loopStart={this.state.loopStart}
                      loopStartChange={this.loopStartChange}
                      loopEnd={this.state.loopEnd}
                      loopEndChange={this.loopEndChange}/> :
            <span>"Loading"</span>}
        </div>
      </div>
    );
  }
}
export default App;