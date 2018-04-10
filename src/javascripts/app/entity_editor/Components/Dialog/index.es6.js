import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';

const Dialog = createReactClass({
  propTypes: {
    testId: PropTypes.string,
    children: PropTypes.node
  },
  render () {
    return (
      <div className="modal-dialog" data-test-id={this.props.testId}>
        {this.props.children}
      </div>
    );
  }
});

const Header = createReactClass({
  propTypes: {
    children: PropTypes.node
  },
  render () {
    return (
      <header className="modal-dialog__header" data-test-id="header">
        <h1>{this.props.children}</h1>
      </header>
    );
  }
});

const Body = createReactClass({
  propTypes: {
    children: PropTypes.node
  },
  render () {
    return (
      <div className="modal-dialog__content">
        <div className="modal-dalog__richtext" data-test-id="content">
          {this.props.children}
        </div>
      </div>
    );
  }
});

const Controls = createReactClass({
  propTypes: {
    children: PropTypes.node
  },
  render () {
    return (
      <div className="modal-dialog__controls" data-test-id="controls">
        {this.props.children}
      </div>
    );
  }
});

Dialog.Header = Header;
Dialog.Body = Body;
Dialog.Controls = Controls;

export default Dialog;
