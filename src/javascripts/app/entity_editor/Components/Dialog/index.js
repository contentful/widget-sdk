import React from 'react';
import PropTypes from 'prop-types';

class Dialog extends React.Component {
  style = {};

  static sizes = {
    small: '400px',
    medium: '600px',
    large: '750px',
  };

  static propTypes = {
    testId: PropTypes.string,
    children: PropTypes.node,
    size: PropTypes.oneOf(Object.keys(Dialog.sizes)),
    className: PropTypes.string,
  };

  constructor(props) {
    super(props);

    this.style.width = Dialog.sizes[this.props.size];
  }

  render() {
    const className = `${this.props.className || ''} modal-dialog`;
    return (
      <div className={className} data-test-id={this.props.testId} style={this.style}>
        {this.props.children}
      </div>
    );
  }
}

class Header extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    onCloseButtonClicked: PropTypes.func,
  };

  render() {
    return (
      <header className="modal-dialog__header" data-test-id="header">
        <h1>{this.props.children}</h1>
        {this.props.onCloseButtonClicked && (
          <button className="modal-dialog__close" onClick={this.props.onCloseButtonClicked} />
        )}
      </header>
    );
  }
}

class Body extends React.Component {
  static propTypes = {
    children: PropTypes.node,
  };

  render() {
    return (
      <div className="modal-dialog__content">
        <div className="modal-dalog__richtext" data-test-id="content">
          {this.props.children}
        </div>
      </div>
    );
  }
}

class Controls extends React.Component {
  static propTypes = {
    children: PropTypes.node,
  };

  render() {
    return (
      <div className="modal-dialog__controls" data-test-id="controls">
        {this.props.children}
      </div>
    );
  }
}

Dialog.Header = Header;
Dialog.Body = Body;
Dialog.Controls = Controls;

export default Dialog;