import React, {Component} from "react";
import "./Checkbox.css";

type CheckboxState = {
}
type CheckboxProps = {
  name: string;
  value: boolean;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
} 

class Checkbox extends Component<CheckboxProps, CheckboxState>{

  constructor(props: CheckboxProps) {
    super(props);
  }
  render(){
    return(
      <label className="Checkbox">
          {this.props.name}
          <input type="checkbox" checked={this.props.value} onChange={this.props.onChange} />
          <span className="checkmark"></span>
      </label>
    );
  }
}
export default Checkbox;