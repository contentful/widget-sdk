import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';

/**
 * Renders query input in search widget
 */
const QueryInput = createReactClass({
  propTypes: {
    placeholder: PropTypes.string,
    autoFocus: PropTypes.bool,
    isFocused: PropTypes.bool,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    value: PropTypes.string,
    onKeyDown: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired
  },
  getInitialState() {
    return {
      value: this.props.value
    };
  },
  componentDidUpdate() {
    if (this.props.isFocused) {
      this.inputRef.focus();
    }
  },
  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState(() => ({
      value: nextProps.value
    }));
  },
  handleChange(e) {
    const {
      target: { value }
    } = e;
    this.props.onChange(value);
    this.setState(() => ({
      value
    }));
  },
  render() {
    const { placeholder, autoFocus, onKeyDown, onFocus, onBlur } = this.props;
    const { value } = this.state;

    // Replacing spaces with `|` to make the width of the shadow element equal
    // the width of the input.
    const shadowValue = (this.state.value || placeholder || '').replace(/\s/g, '|');

    // TODO: extract shadow-resize and reuse in TextValueInput
    return (
      <fieldset className="search-next__query-input-fieldset">
        <input
          className="input-reset search-next__query-input"
          data-test-id="queryInput"
          ref={input => {
            this.inputRef = input;
          }}
          onFocus={onFocus}
          onBlur={onBlur}
          autoFocus={autoFocus}
          value={value}
          onKeyDown={onKeyDown}
          onChange={this.handleChange}
          placeholder={placeholder}
        />
        <span className="search__input-spacer">{shadowValue}</span>
      </fieldset>
    );
  }
});

export default QueryInput;
