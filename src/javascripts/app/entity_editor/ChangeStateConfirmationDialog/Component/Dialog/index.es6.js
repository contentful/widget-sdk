import { createElement as h } from 'libs/react';
import createReactClass from 'create-react-class';

const Dialog = createReactClass({
  displayName: 'Dialog',
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
  displayName: 'Header',
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
  displayName: 'Body',
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
  displayName: 'Controls',
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

Dialog.propTypes = {};
Dialog.Header = Header;
Dialog.Body = Body;
Dialog.Controls = Controls;

export default Dialog;
