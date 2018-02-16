/* eslint-disable react/prop-types */
// TODO: add prop-types
import { asReact } from 'ui/Framework/DOMRenderer';
import React from 'libs/react';
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
  propTypes: {
    contentTypes: PropTypes.array.isRequired,
    suggestedContentTypeId: PropTypes.string,
    onSelect: PropTypes.func.isRequired,
    mode: PropTypes.string,
    text: PropTypes.string.isRequired
  },
  getDefaultProps () {
    return {
      suggestedContentTypeId: null,
      mode: modes.NORMAL
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
  handleClose () {
    this.setState({
      isOpen: false
    });
  },
  handleClickOutside () {
    this.setState({
      isOpen: false
    });
  },
  render () {
    const { contentTypes, suggestedContentTypeId, mode, text } = this.props;
    const withSingleCT = contentTypes && contentTypes.length === 1;

    return (
      <div
        style={{ position: 'relative' }}
        className={mode === modes.LARGE ? 'x--block' : ''}
      >
        <Button
          onClick={this.handleClick}
          mode={mode}
          text={text}
          withSingleCT
        />
        {!withSingleCT &&
          this.state.isOpen && (
            <Menu
              contentTypes={contentTypes}
              suggestedContentTypeId={suggestedContentTypeId}
              onSelect={this.handleSelect}
              onClose={this.handleClose}
            />
          )}
      </div>
    );
  }
});

export default enhanceWithClickOutside(CreateEntryButton);

export function Button ({ onClick, mode, text, withSingleCT }) {
  const className = mode === modes.LARGE ? 'x--block' : '';

  return (
    <button className={`btn-action u-truncate ${className}`} onClick={onClick}>
      <cf-icon class="btn-icon inverted" name="plus" />
      {text}
      {!withSingleCT &&
        <cf-icon class="btn-dropdown-icon" name="dd-arrow-down">
          {asReact(DropDownIcon)}
        </cf-icon>}
    </button>
  );
}
