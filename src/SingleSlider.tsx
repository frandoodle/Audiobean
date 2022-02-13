import React, {Component} from "react";
import * as Tone from "tone";
import "./SingleSlider.css";

type SingleSliderState = {
  textboxValue: number | undefined;
}
type SingleSliderProps = {
  name: string;
  value: number;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  min: number;
  max: number;
  step: number;
} 

class SingleSlider extends Component<SingleSliderProps, SingleSliderState>{

  constructor(props: SingleSliderProps) {
    super(props);
    this.state = {
      textboxValue: props.value
    }
  }

  componentDidUpdate(prevProps: SingleSliderProps) {
    if(prevProps.value !== this.props.value){
      this.setState({
        textboxValue: this.props.value
      })
    }
  }

  handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(e.target.value === ""){
      this.setState({
        textboxValue: undefined
      })
    }else{
      this.setState({
        textboxValue: Number(e.target.value)
      })
    }
  }

  onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if(this.state.textboxValue === undefined){
      this.setState({
        textboxValue: this.props.value
      });
      return;
    }
    if(this.state.textboxValue < this.props.min){
      e.target.value = this.props.min+"";

    }else if(this.props.max < this.state.textboxValue){
      e.target.value = this.props.max+"";
    }
    this.props.onChange(e);
  }

  render(){
    return(
      <div  className="SingleSlider">
        <div className="boxInput">
          <label>{this.props.name}</label>
          <input 
            type="number"
            value={this.state.textboxValue ?? ''}
            onChange={this.handleTextChange}
            onBlur={this.onBlur}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.keyCode === 13 && (e.target as HTMLElement).blur()}
          />
        </div>
        <input
          type="range"
          min={this.props.min}
          max={this.props.max}
          value={this.props.value}
          step={this.props.step}
          onChange={this.props.onChange}
        />
      </div>
    );
  }
}
export default SingleSlider;