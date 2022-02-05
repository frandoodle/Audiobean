import React, { Component} from "react";
import "./App.css";
import dire from "./dire.mp3";

type AppState = {
  playing: boolean;
  volume: number;
}
type AppProps = {
} 

class App extends Component<AppProps, AppState>{
  audioContext: AudioContext;
  audioElement: HTMLMediaElement | null;
  audioElementRef: React.RefObject<HTMLMediaElement>;
  gainNode: GainNode;
  track: MediaElementAudioSourceNode;

  constructor(props: AppProps) {
    super(props);
    this.state = {
      playing: false,
      volume: 1,
    };
    this.audioElementRef = React.createRef();
    // this.playClickHandler = this.playClickHandler.bind(this);
  }

  componentDidMount(){
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContext();
    this.audioElement = this.audioElementRef.current;
    if(this.audioElement){
      this.track = this.audioContext.createMediaElementSource(this.audioElement);
    }
    this.gainNode = this.audioContext.createGain();
    this.track.connect(this.gainNode).connect(this.audioContext.destination);
  }

  playClickHandler = (e: React.SyntheticEvent) => {
    if(this.state.playing === false && this.audioElement){
      console.log("playing");
      this.audioElement.play();
      this.setState({
        playing: true
      })
    }else if(this.state.playing === true && this.audioElement){
      console.log("notplaying");
      this.audioElement.pause();
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

  // const volumeControl = document.querySelector('#volume');

  // volumeControl.addEventListener('input', function() {
  //     gainNode.gain.value = this.value;
  // }, false);

  render(){
    return(
      <div className="App">
        <audio src={dire} ref={this.audioElementRef}></audio>
        <button onClick={this.playClickHandler}>
          <span>Play/Pause</span>
        </button>
        <label>{this.state.volume}</label>
        <input type="range" min="0" max="2" value={this.state.volume} step="0.01" onChange={this.volumeChangeHandler}></input>

        {/*<audio
          controls
          src={dire}>
              Your browser does not support the
              <code>audio</code> element.
        </audio>*/}
      </div>
    );
  }
}
export default App;