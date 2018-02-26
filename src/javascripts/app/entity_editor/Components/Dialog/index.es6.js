import { createElement as h } from 'libs/react';
import PropTypes from 'libs/prop-types';
import createReactClass from 'create-react-class';

const Dialog = createReactClass({
  propTypes: {
    testId: PropTypes.string,
    children: PropTypes.node
  },
  render () {
    return h(
      'div',
      {
        className: 'modal-dialog',
        'data-test-id': this.props.testId
      },
      this.props.children
    );
  }
});

const Header = createReactClass({
  propTypes: {
    children: PropTypes.node
  },
  render () {
    return h(
      'header',
      {
        className: 'modal-dialog__header',
        'data-test-id': 'header'
      },
      h('h1', {}, this.props.children)
    );
  }
});

const Body = createReactClass({
  propTypes: {
    children: PropTypes.node
  },
  render () {
    return h(
      'div',
      { className: 'modal-dialog__content' },
      h(
        'div',
        {
          className: 'modal-dialog__richtext',
          'data-test-id': 'content'
        },
        this.props.children
      )
    );
  }
});

const Controls = createReactClass({
  propTypes: {
    children: PropTypes.node
  },
  render () {
    return h(
      'div',
      {
        className: 'modal-dialog__controls',
        'data-test-id': 'controls'
      },
      this.props.children
    );
  }
});

Dialog.Header = Header;
Dialog.Body = Body;
Dialog.Controls = Controls;

export default Dialog;
