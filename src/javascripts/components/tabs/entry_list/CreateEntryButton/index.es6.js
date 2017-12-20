import { asReact } from 'ui/Framework/DOMRenderer';
import { createElement as h } from 'libs/react';
import enhanceWithClickOutside from 'libs/react-click-outside';
import PropTypes from 'libs/prop-types';
import createReactClass from 'create-react-class';
import Menu from './Menu';
import DropDownIcon from 'svg/dd-arrow-down';

export const modes = {
  NORMAL: 'normal',
  LARGE: 'large'
};

const CreateEntryButton = createReactClass({
  getDefaultProps () {
    return {
      suggestedContentTypeId: null,
      mode: modes.NORMAL,
      position: 'bottom'
    };
  },
  getInitialState () {
    return {
      isOpen: false
    };
  },
  handleClick () {
    this.setState({
      isOpen: !this.state.isOpen
    });

    if (this.props.contentTypes.length === 1) {
      this.props.onSelect(this.props.contentTypes[0].sys.id);
    }
  },
  handleSelect (item) {
    this.setState({
      isOpen: false
    });
    this.props.onSelect(item.sys.id);
  },
  handleClickOutside () {
    this.setState({
      isOpen: false
    });
  },
  render () {
    const {
      contentTypes,
      suggestedContentTypeId,
      mode,
      position,
      text
    } = this.props;
    const withSingleCT = contentTypes && contentTypes.length === 1;

    return h(
      'div',
      { style: { position: 'relative' } },
      h(Button, {
        onClick: this.handleClick,
        mode,
        text,
        withSingleCT
      }),
      !withSingleCT && this.state.isOpen && h(Menu, {
        position,
        contentTypes,
        suggestedContentTypeId,
        onSelect: this.handleSelect
      })
    );
  }
});

CreateEntryButton.propTypes = {
  contentTypes: PropTypes.array.isRequired,
  suggestedContentTypeId: PropTypes.string,
  mode: PropTypes.string,
  position: PropTypes.string,
  text: PropTypes.string.isRequired
};

export default enhanceWithClickOutside(CreateEntryButton);

export function Button ({ onClick, mode, text, withSingleCT }) {
  const className = mode === modes.LARGE ? 'x--block' : '';

  return h(
    'button',
    { className: `btn-action u-truncate ${className}`, onClick },
    h('cf-icon', { class: 'btn-icon inverted', name: 'plus' }),
    text,
    !withSingleCT && h('cf-icon', { class: 'btn-dropdown-icon', name: 'dd-arrow-down' }, asReact(DropDownIcon))
  );
}
