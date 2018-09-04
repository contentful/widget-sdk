import React from 'react';
import PropTypes from 'prop-types';

class TextInput extends React.Component {
  static propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func
  };

  static defaultProps = {
    onChange() {},
    onFocus() {},
    onBlur() {}
  };

  state = {
    isFocused: false,
    currentValue: this.props.value
  };

  handleChange = e => {
    this.setState({ currentValue: e.target.value });
    this.props.onChange(e);
  };

  handleFocus = e => {
    this.setState({ isFocused: true });
    this.props.onFocus(e);
  };

  handleBlur = e => {
    this.setState({ isFocused: false });
    this.props.onBlur(e);
  };

  UNSAFE_componentWillReceiveProps = nextProps => {
    if (!this.state.isFocused) {
      this.setState({ currentValue: nextProps.value });
    }
  };

  render() {
    return (
      <input
        {...this.props}
        onChange={this.handleChange}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
        value={this.state.currentValue}
      />
    );
  }
}

export default TextInput;
