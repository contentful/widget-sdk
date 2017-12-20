import { noop } from 'lodash';
import { createElement as h } from 'libs/react';
import PropTypes from 'libs/prop-types';
import createReactClass from 'create-react-class';


/**
 * Renders text input in filter pill
 */
const TextValueInput = createReactClass({
  getDefaultProps () {
    return {
      onChange: noop,
      onKeyDown: noop,
      onClick: noop
    };
  },
  getInitialState () {
    return {
      value: this.props.value
    };
  },
  componentWillReceiveProps (nextProps) {
    this.setState(() => ({
      value: nextProps.value
    }));
  },
  handleChange (e) {
    const { target: { value } } = e;
    this.props.onChange(value);
    this.setState(() => ({
      value
    }));
  },
  render () {
    const {
      testId,
      inputRef,
      onKeyDown,
      onClick
    } = this.props;
    const { value } = this.state;
    // In order to make the input field, we mirror the value of the input
    // in a span that pushes the parent div to grow.
    const shadowValue = value || '';

    return h('fieldset',
      { className: 'search__input-text' },
      h('input', {
        className: 'input-reset search__input',
        'data-test-id': testId,
        value: value !== null ? value : '',
        ref: inputRef,
        onChange: this.handleChange,
        onKeyDown,
        onClick,
        tabIndex: '0'
      }),
      h('span', { className: 'search__input-spacer' }, [
        shadowValue.replace(/\s/g, '|')
      ])
    );
  }
});

TextValueInput.propTypes = {
  testId: PropTypes.any,
  inputRef: PropTypes.func,
  onKeyDown: PropTypes.func,
  onChange: PropTypes.func,
  onClick: PropTypes.func
};

export default TextValueInput;
