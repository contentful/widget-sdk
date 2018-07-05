import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import createReactClass from 'create-react-class';
import enhanceWithClickOutside from 'react-click-outside';
import cn from 'classnames';
import Menu from './Menu';
import { Icon, TextLink } from '@contentful/ui-component-library';
import { getStoreResource, resourceMaximumLimitReached } from 'utils/ResourceUtils';

export const Size = {
  Normal: 'normal',
  Large: 'large'
};

export const Style = {
  Button: 'button',
  Link: 'link'
};

const CreateEntryButton = createReactClass({
  propTypes: {
    resources: PropTypes.object.isRequired,
    space: PropTypes.object.isRequired,
    contentTypes: PropTypes.array.isRequired,
    suggestedContentTypeId: PropTypes.string,
    onSelect: PropTypes.func.isRequired,
    size: PropTypes.oneOf([Size.Large, Size.Normal]),
    style: PropTypes.oneOf([Style.Button, Style.Link]),
    text: PropTypes.string
  },
  getDefaultProps () {
    return {
      mode: Size.Normal,
      style: Style.Button
    };
  },
  getInitialState () {
    return {
      isOpen: false,
      isHandlingOnSelect: false
    };
  },
  handleClick () {
    if (this.props.contentTypes.length === 1) {
      const onlyItem = this.props.contentTypes[0];
      this.handleSelect(onlyItem);
    } else {
      this.setState({
        isOpen: !this.state.isOpen
      });
    }
  },
  handleSelect (item) {
    this.setState({
      isOpen: false
    });
    const selectHandlerReturnValue = this.props.onSelect(item.sys.id);
    if (isPromise(selectHandlerReturnValue)) {
      const setIsHandlingOnSelect =
        (value) => this.setState({ isHandlingOnSelect: value });
      setIsHandlingOnSelect(true);
      selectHandlerReturnValue.then(
        () => setIsHandlingOnSelect(false),
        () => setIsHandlingOnSelect(false)
      );
    }
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
  getCtaText () {
    const { contentTypes, text } = this.props;
    return (
      text || `Add ${contentTypes.length === 1 ? contentTypes[0].name : 'entry'}`
    );
  },
  renderButton () {
    const { contentTypes, size, resources, space } = this.props;
    const spaceId = space.sys.id;

    const storeResource = getStoreResource(resources, spaceId, 'record');
    let limitReached = false;

    if (storeResource && storeResource.resource) {
      limitReached = resourceMaximumLimitReached(storeResource.resource);
    }

    const className = cn('btn-action', 'u-truncate', {
      'x--block': size === Size.Large
    });

    return (
      <button
        className={className}
        onClick={this.handleClick}
        data-test-id="cta"
        disabled={limitReached}
      >
        {this.getCtaText()}
        {contentTypes.length > 1 && (
          <Icon
            icon="ChevronDown"
            size="small"
            color="white"
            data-test-id="dropdown-icon"
            extraClassNames="btn-dropdown-icon"
          />
        )}
      </button>
    );
  },
  renderLink () {
    const { contentTypes } = this.props;
    const isIdle = this.state.isHandlingOnSelect;
    const linkProps = {
      onClick: this.handleClick,
      disabled: isIdle,
      icon: isIdle ? null : 'Plus'
    };
    return (
      <div>
        {isIdle &&
          <div className="create-entry-button__handling-select-spinner"
            data-test-id="spinner"
          />
        }
        <TextLink {...linkProps} data-test-id="cta">
          {this.getCtaText()}
          {contentTypes.length > 1 && (
            <Icon
              data-test-id="dropdown-icon"
              icon="ChevronDown"
              color="secondary"
              extraClassNames="btn-dropdown-icon"
            />
          )}
        </TextLink>
      </div>
    );
  },
  renderMenu () {
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
  },
  render () {
    const { size } = this.props;
    return (
      <div
        style={{ position: 'relative' }}
        className={cn({
          'x--block': size === Size.Large
        })}
        data-test-id="create-entry"
      >
        {this.props.style === Style.Button
          ? this.renderButton()
          : this.renderLink()}
        {this.renderMenu()}
      </div>
    );
  }
});

const mapStateToProps = state => {
  return {
    resources: state.recordsResourceUsage.resources
  };
};

function isPromise (value) {
  return value && typeof value.then === 'function';
}

export default enhanceWithClickOutside(connect(mapStateToProps)(CreateEntryButton));
