import React, {Component} from "react";
import * as Tone from 'tone'
import axios from 'axios';
import "./App.css";
import Waveform from "./Waveform"
import SingleSlider from "./SingleSlider"
import Checkbox from "./Checkbox"
import Textbox from "./Textbox"
import filepath from "./dire.mp3";
import play from "./play.png";
import pause from "./pause.png";



type AppState = {
  loaded: boolean;
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
  url: string;
  title: string;
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
      loaded: false,
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
      url:'https://www.youtube.com/watch?v=txaUET-sYr8',
      title:''
    };
  }

  componentDidMount(){
    Tone.start();
    this.gainNode = new Tone.Gain(this.state.volume).toDestination();
    this.pitchShift = new Tone.PitchShift().connect(this.gainNode);
    this.loadSong();
  }
  async loadSong(){
    Tone.Transport.seconds = 0;
    if(this.player && this.grainPlayer){
      this.player.dispose();
      this.grainPlayer.dispose();
    }
    this.setState({
      playing: false,
      loaded: false,
      lastTime: 0,
      progress: 0,
      loopStart: 0,
      speed: 1,
      semitone: 0,
    })
    this.player = new Tone.Player(`http://localhost:3006/?url=${this.state.url}`, () => {
      this.player.connect(this.pitchShift);
      this.player.sync().start(0);
      this.setState({maxDuration: this.player.buffer.duration, loopEnd: this.player.buffer.duration});
      Tone.Transport.setLoopPoints(0,this.player.buffer.duration);
    });
    this.grainPlayer = new Tone.GrainPlayer(`http://localhost:3006/?url=${this.state.url}`, () => {
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
    axios.get(`http://localhost:3006/title/?url=${this.state.url}`)
    .then((res)=> {
      if(res.status === 200){
        this.setState({
          title: res.data,
        })
      } else if (res.status === 400){
        this.setState({
          title: res.data,
        })
      }
    }).catch(err => {
      console.log(err);
    })
    await Tone.loaded();
    this.setState({
        loaded: true,
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
    if(url !== this.state.url){
      console.log(url);
      this.setState({
        url: url
      }, this.loadSong)
    }
  }
  render(){

    return(
      <div className="App" 
           onDragStart={(e:React.MouseEvent<Element>)=>{e.preventDefault()}}
           onDrop={(e:React.MouseEvent<Element>)=>{e.preventDefault()}}
      >
        <div className="title">
          <h1>AudioBean</h1>
          <Textbox
            placeholder="YouTube url"
            buttonText="load"
            handleClick={this.onLoad}
          />
          <div>{this.state.title}</div>
          {/*<input
            type="file"
            accept="audio/mp3"
          />*/}
        </div>
        { this.state.loaded ?
        <div className="controlbar">
              <button onClick={this.playClickHandler}>
                {this.state.playing ? <img src={pause} alt="pause"/> : <img src={play} alt="play"/>}
              </button>
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
              <Checkbox
                name="granular"
                value={this.state.granular}
                onChange={this.playbackChangeHandler}
              />
        </div>
        :
        <div className="controlbar"></div>
        }
        { this.state.loaded ?
        <div className="waveformContainer">
            <Waveform audioBuffer={this.player.buffer}
                      progress={this.state.progress}
                      duration={this.state.maxDuration}
                      onSeek={this.seek}
                      loopStart={this.state.loopStart}
                      loopStartChange={this.loopStartChange}
                      loopEnd={this.state.loopEnd}
                      loopEndChange={this.loopEndChange}/>
        </div>
        :
        <div className="waveformContainer">
        LOADING...
        </div>
        }
        <div className="info">
          <div className="credit">
            AudioBean is a work-in-progress song learning tool created by Jude Sidloski. The demo song is Dire Dire Docks.
          </div>
          <br/>
          <b>Instructions:</b>
          <div className="instructions">
            <b>Wait for waveform to appear before touching controls.</b><br/>
            <br/>
            <b>Zoom:</b> Scroll your mouse wheel while your cursor is hovering over the waveform.<br/>
            <br/>
            <b>Loop:</b> Adjust the start and end of the loop by dragging the edge of either side of the black bar directly above the waveform.<br/>
            <br/>
            <b>Granular:</b> Switches playback method to granular synthesis. Try this setting if the audio is too distorted from detuning.<br/>
            <br/>
          </div>
          <b>Todo:</b>
          <div className="todo">
            File upload & youtube to mp3<br/>
            Mobile <br/>
            Testing on browsers other than chrome<br/>
            Loading state/styling<br/>  
          </div>
        </div>
      </div>
    );
  }
}
export default App;