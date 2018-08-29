import { createElement as h } from 'react';
import createReactClass from 'create-react-class';

const Error = createReactClass({
  displayName: 'Error',
  render() {
    return h(
      'div',
      {
        'data-test-id': 'error'
      },
      h(
        'p',
        null,
        'There seems to be a problem looking up entries that link to this entry. ',
        'If the problem persists, please ',
        h(
          'a',
          {
            href: 'https://www.contentful.com/support/',
            target: '_blank',
            rel: 'noopener'
          },
          'contact support'
        ),
        '.'
      )
    );
  }
});

export default Error;
