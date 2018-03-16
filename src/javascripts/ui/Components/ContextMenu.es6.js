import React from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import enhanceWithClickOutside from 'libs/react-click-outside';

const ContextMenu = createReactClass({
  propTypes: {
    items: PropTypes.array.isRequired
  },

  getInitialState () {
    return {
      isOpen: false,
      isDisabled: !(this.props.items && this.props.items.length)
    };
  },

  handleClickOutside () {
    this.setState({
      isOpen: false
    });
  },

  toggle () {
    this.setState({isOpen: !this.state.isOpen});
  },

  render () {
    const {isOpen, isDisabled} = this.state;
    return (
      <div
        style={{marginLeft: '10px', position: 'relative'}}
        ref={menu => { this.menuElement = menu; }}
      >
        <button
          disabled={isDisabled}
          className="btn-inline btn-actions-nav"
          onClick={this.toggle}
        >•••</button>

        { isOpen
        ? <div
            className="context-menu x--arrow-up x--arrow-right"
            style={{
              right: '-25px',
              top: '30px'
            }}
          >
            <ul className="context-menu__items">
              {this.props.items.map(item => (
                <li key={item.label}>
                  <button
                    onClick={() => { item.action(); }}
                  >{item.label}</button>
                </li>
              ))}
            </ul>
          </div>
        : '' }
      </div>
    );
  }
});

export default enhanceWithClickOutside(ContextMenu);
