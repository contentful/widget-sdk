/* eslint "rulesdir/restrict-inline-styles": "warn" */
import React from 'react';
import PropTypes from 'prop-types';
import enhanceWithClickOutside from 'react-click-outside';

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
    isDisabled: PropTypes.bool
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
      isDisabled: manuallyDisabled,
      style: userStyles,
      buttonProps,
      ...otherProps
    } = this.props;
    const { isOpen } = this.state;

    const isDisabled = manuallyDisabled || !(items && items.length);

    const styles = { ...(userStyles || {}), marginLeft: '10px', position: 'relative' };

    return (
      <div
        style={styles}
        ref={menu => {
          this.menuElement = menu;
        }}
        {...otherProps}>
        <button
          disabled={isDisabled}
          className="btn-inline btn-actions-nav"
          onClick={this.toggle}
          {...buttonProps}>
          •••
        </button>

        {isOpen ? (
          <div
            className="context-menu x--arrow-up x--arrow-right"
            style={{
              right: '-25px',
              top: '30px'
            }}>
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
