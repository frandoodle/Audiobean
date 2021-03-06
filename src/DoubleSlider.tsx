import React, {Component} from "react";
import * as Tone from "tone";
import "./DoubleSlider.css";

type DoubleSliderState = {
}
type DoubleSliderProps = {
  left: number;
  right: number;
  leftChange: React.ChangeEventHandler<HTMLInputElement>;
  rightChange: React.ChangeEventHandler<HTMLInputElement>;
} 

class DoubleSlider extends Component<DoubleSliderProps, DoubleSliderState>{

  constructor(props: DoubleSliderProps) {
    super(props);
  }

  render(){
    return(
      <div  className="DoubleSlider">
          <input
            className="slider left"
            type="range"
            min={0}
            max={1}
            value={this.props.left}
            step="0.001"
            onChange={this.props.leftChange}
          />
          <input
            className="slider right"
            type="range"
            min={0}
            max={1}
            value={this.props.right}
            step="0.001"
            onChange={this.props.rightChange}
          />
      </div>
    );
  }
}
export default DoubleSlider;