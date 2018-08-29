import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import enhanceWithClickOutside from 'react-click-outside';

const ContextMenu = createReactClass({
  propTypes: {
    items: PropTypes.array.isRequired,
    otherProps: PropTypes.object,
    style: PropTypes.object
  },

  getInitialState() {
    return {
      isOpen: false,
      isDisabled: !(this.props.items && this.props.items.length)
    };
  },

  handleClickOutside() {
    this.setState({
      isOpen: false
    });
  },

  toggle() {
    this.setState({ isOpen: !this.state.isOpen });
  },

  render() {
    const { isOpen, isDisabled } = this.state;
    const { items, style: userStyles, ...otherProps } = this.props;

    const styles = { ...(userStyles || {}), marginLeft: '10px', position: 'relative' };

    return (
      <div
        style={styles}
        ref={menu => {
          this.menuElement = menu;
        }}
        {...otherProps}>
        <button disabled={isDisabled} className="btn-inline btn-actions-nav" onClick={this.toggle}>
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
});

export default enhanceWithClickOutside(ContextMenu);
