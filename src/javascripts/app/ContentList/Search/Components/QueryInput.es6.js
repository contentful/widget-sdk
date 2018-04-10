import { createElement as h } from 'react';
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
    value: PropTypes.string,
    onKeyDown: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired
  },
  getInitialState () {
    return {
      value: this.props.value
    };
  },
  componentDidUpdate () {
    if (this.props.isFocused) {
      this.inputRef.focus();
    }
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
      placeholder,
      autoFocus,
      onKeyDown
    } = this.props;
    const { value } = this.state;

    // Replacing spaces with `|` to make the width of the shadow element equal
    // the width of the input.
    const shadowValue = (this.state.value || placeholder || '').replace(/\s/g, '|');

    // TODO: extract shadow-resize and reuse in TextValueInput
    return h(
      'fieldset',
      {
        className: 'search-next__query-input-fieldset'
      },
      h('input', {
        className: 'input-reset search-next__query-input',
        'data-test-id': 'queryInput',
        ref: (input) => { this.inputRef = input; },
        autoFocus,
        value,
        onKeyDown,
        onChange: this.handleChange,
        placeholder
      }),
      h(
        'span',
        {
          className: 'search__input-spacer'
        },
        shadowValue
      )
    );
  }
});

export default QueryInput;
