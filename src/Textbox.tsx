import React, {Component} from "react";
import "./Textbox.css";

type TextboxState = {
  textboxValue: string;
}
type TextboxProps = {
  placeholder: string;
  buttonText: string;
  handleClick: Function;
} 

class Textbox extends Component<TextboxProps, TextboxState>{

  constructor(props: TextboxProps) {
    super(props);
    this.state = {
      textboxValue: ""
    }
  }
  onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      textboxValue: e.target.value
    })
  }
  onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      this.props.handleClick(this.state.textboxValue)
  }
  render(){
    return(
      <label className="Textbox">
        <input type="text" placeholder={`   ${this.props.placeholder}`} onChange={this.onChange} />
        <button onClick={this.onClick}>
          {this.props.buttonText}
        </button>
      </label>
    );
  }
}
export default Textbox;