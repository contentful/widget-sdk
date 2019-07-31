/* eslint "rulesdir/restrict-inline-styles": "warn" */
import React from 'react';
import PropTypes from 'prop-types';
import enhanceWithClickOutside from 'react-click-outside';
import { css } from 'emotion';

const emotionStyles = {
  contextMenu: css({
    right: '-25px',
    top: '30px'
  })
};

class ContextMenu extends React.Component {
  static propTypes = {
    items: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        disabled: PropTypes.bool,
        action: PropTypes.func,
        otherProps: PropTypes.shape()
      })
    ),
    buttonProps: PropTypes.shape(),
    style: PropTypes.object,
    isDisabled: PropTypes.bool,
    testId: PropTypes.string
  };

  state = {
    isOpen: false
  };

  handleClickOutside = () => {
    this.setState({
      isOpen: false
    });
  };

  toggle = () => {
    this.setState({ isOpen: !this.state.isOpen });
  };

  render() {
    const {
      items,
      isDisabled: explicitlyDisabled,
      style: userStyles,
      buttonProps,
      testId,
      ...otherProps
    } = this.props;
    const { isOpen } = this.state;

    const isDisabled = explicitlyDisabled || !(items && items.length);

    const styles = { ...(userStyles || {}), marginLeft: '10px', position: 'relative' };

    return (
      <div
        style={styles}
        ref={menu => {
          this.menuElement = menu;
        }}
        data-test-id={testId}
        {...otherProps}>
        <button
          disabled={isDisabled}
          onClick={this.toggle}
          {...buttonProps}
          className={`btn-inline btn-actions-nav${
            buttonProps.className ? ` ${buttonProps.className}` : ''
          }`}>
          •••
        </button>

        {isOpen ? (
          <div className={`context-menu x--arrow-up x--arrow-right ${emotionStyles.contextMenu}`}>
            <ul className="context-menu__items">
              {items.map(item => {
                const disabled = Boolean(item.disabled);

                return (
                  <li
                    onClick={() => {
                      !disabled && item.action();
                    }}
                    disabled={disabled}
                    key={item.label}>
                    <button {...item.otherProps}>{item.label}</button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          ''
        )}
      </div>
    );
  }
}

export default enhanceWithClickOutside(ContextMenu);
