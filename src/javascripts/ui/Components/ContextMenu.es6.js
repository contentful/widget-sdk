import React from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';

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

  componentWillUnmount () {
    this.unbindCloseHandler();
  },

  bindCloseHandler () {
    document.body.addEventListener('click', this.close);
  },

  unbindCloseHandler () {
    document.body.removeEventListener('click', this.close);
  },

  toggle () {
    this.setState({isOpen: !this.state.isOpen}, () => {
      this.state.isOpen
        ? this.bindCloseHandler()
        : this.unbindCloseHandler();
    });
  },

  close (evt) {
    // return if the click is on the menu
    if (this.menuElement.contains(evt.target)) return;

    this.unbindCloseHandler();
    this.setState({isOpen: false});
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

export default ContextMenu;
