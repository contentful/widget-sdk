import React from 'react';
import PropTypes from 'prop-types';
import { noop } from 'lodash';

/**
 * Renders text input in filter pill
 */
class TextValueInput extends React.Component {
  static propTypes = {
    testId: PropTypes.any,
    inputRef: PropTypes.func,
    value: PropTypes.string,
    onKeyDown: PropTypes.func,
    onChange: PropTypes.func,
    onClick: PropTypes.func
  };

  static defaultProps = {
    onChange: noop,
    onKeyDown: noop,
    onClick: noop
  };

  state = {
    value: this.props.value
  };

  UNSAFE_componentWillReceiveProps = nextProps => {
    this.setState(() => ({
      value: nextProps.value
    }));
  };

  handleChange = e => {
    const {
      target: { value }
    } = e;
    this.props.onChange(value);
    this.setState(() => ({
      value
    }));
  };

  render() {
    const { testId, inputRef, onKeyDown, onClick } = this.props;
    const { value } = this.state;
    // In order to make the input field, we mirror the value of the input
    // in a span that pushes the parent div to grow.
    const shadowValue = value || '';

    return (
      <fieldset className="search__input-text">
        <input
          className="input-reset search__input"
          data-test-id={testId}
          value={value !== null ? value : ''}
          ref={inputRef}
          onChange={this.handleChange}
          onKeyDown={onKeyDown}
          onClick={onClick}
          tabIndex="0"
        />
        <span className="search__input-spacer">{shadowValue.replace(/\s/g, '|')}</span>
      </fieldset>
    );
  }
}

export default TextValueInput;
