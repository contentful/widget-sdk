/* eslint "rulesdir/restrict-inline-styles": "warn" */
import React from 'react';
import PropTypes from 'prop-types';
import enhanceWithClickOutside from 'react-click-outside';
import cn from 'classnames';
import Menu from './Menu/index.es6';
import { Icon, TextLink } from '@contentful/forma-36-react-components';

export const Size = {
  Normal: 'normal',
  Large: 'large'
};

export const Style = {
  Button: 'button',
  Link: 'link'
};

class CreateEntryButton extends React.Component {
  static propTypes = {
    contentTypes: PropTypes.array.isRequired,
    suggestedContentTypeId: PropTypes.string,
    onSelect: PropTypes.func.isRequired,
    size: PropTypes.oneOf([Size.Large, Size.Normal]),
    style: PropTypes.oneOf([Style.Button, Style.Link]),
    disabled: PropTypes.bool,
    hasPlusIcon: PropTypes.bool,
    text: PropTypes.string,
    testId: PropTypes.string
  };

  static defaultProps = {
    mode: Size.Normal,
    style: Style.Button,
    hasPlusIcon: true,
    disabled: false,
    testId: 'create-entry'
  };

  state = {
    isOpen: false,
    isHandlingOnSelect: false
  };

  handleClick = () => {
    if (this.props.contentTypes.length === 1) {
      const onlyItem = this.props.contentTypes[0];
      this.handleSelect(onlyItem);
    } else {
      this.setState({
        isOpen: !this.state.isOpen
      });
    }
  };

  handleSelect = item => {
    this.setState({
      isOpen: false
    });
    const selectHandlerReturnValue = this.props.onSelect(item.sys.id);

    // TODO: Convert to controllable component.
    if (isPromise(selectHandlerReturnValue)) {
      const setIsHandlingOnSelect = value => this.setState({ isHandlingOnSelect: value });
      setIsHandlingOnSelect(true);
      selectHandlerReturnValue.then(
        () => setIsHandlingOnSelect(false),
        () => setIsHandlingOnSelect(false)
      );
    }
  };

  handleClose = () => {
    this.setState({
      isOpen: false
    });
  };

  handleClickOutside = () => {
    this.setState({
      isOpen: false
    });
  };

  getCtaText = () => {
    const { contentTypes, text } = this.props;
    return text || `Add ${contentTypes.length === 1 ? contentTypes[0].name : 'entry'}`;
  };

  renderButton = () => {
    const { contentTypes, size, disabled } = this.props;

    const className = cn('btn-action', 'u-truncate', {
      'x--block': size === Size.Large
    });

    return (
      <button
        className={className}
        onClick={this.handleClick}
        data-test-id="cta"
        disabled={disabled}>
        {this.getCtaText()}
        {contentTypes.length > 1 && (
          <Icon
            icon="ChevronDown"
            size="small"
            color="white"
            data-test-id="dropdown-icon"
            className="btn-dropdown-icon"
          />
        )}
      </button>
    );
  };

  renderLink = () => {
    const { contentTypes, hasPlusIcon } = this.props;
    const isIdle = this.state.isHandlingOnSelect;
    const linkProps = {
      onClick: this.handleClick,
      disabled: isIdle,
      icon: isIdle || !hasPlusIcon ? null : 'Plus'
    };
    return (
      <React.Fragment>
        {isIdle && (
          <span className="create-entry-button__handling-select-spinner" data-test-id="spinner" />
        )}
        <TextLink {...linkProps} testId="cta">
          {this.getCtaText()}
          {contentTypes.length > 1 && (
            <Icon
              data-test-id="dropdown-icon"
              icon="ChevronDown"
              color="secondary"
              className="btn-dropdown-icon"
            />
          )}
        </TextLink>
      </React.Fragment>
    );
  };

  renderMenu = () => {
    const { contentTypes, suggestedContentTypeId } = this.props;
    const { isOpen } = this.state;

    if (contentTypes.length > 1 && isOpen) {
      return (
        <Menu
          contentTypes={contentTypes}
          suggestedContentTypeId={suggestedContentTypeId}
          onSelect={this.handleSelect}
          onClose={this.handleClose}
        />
      );
    } else {
      return null;
    }
  };

  render() {
    const { size, testId } = this.props;

    return (
      <span
        style={{ position: 'relative' }}
        className={cn({
          'x--block': size === Size.Large
        })}
        data-test-id={testId}>
        {this.props.style === Style.Button ? this.renderButton() : this.renderLink()}
        {this.renderMenu()}
      </span>
    );
  }
}

function isPromise(value) {
  return value && typeof value.then === 'function';
}

export default enhanceWithClickOutside(CreateEntryButton);