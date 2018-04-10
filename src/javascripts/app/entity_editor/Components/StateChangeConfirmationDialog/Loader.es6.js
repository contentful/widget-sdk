import { createElement as h } from 'react';
import createReactClass from 'create-react-class';

const Loader = createReactClass({
  displayName: 'Loader',
  render () {
    return h(
      'div',
      {
        'data-test-id': 'loader',
        className: 'state-change-confirmation-dialog__loading-wrapper'
      },
      h('div', { className: 'loading' })
    );
  }
});

export default Loader;
