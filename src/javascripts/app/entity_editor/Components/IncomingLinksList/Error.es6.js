import React from 'react';
import createReactClass from 'create-react-class';

const Error = createReactClass({
  displayName: 'Error',
  render() {
    return (
      <div data-test-id="error">
        <p>
          {'There seems to be a problem looking up entries that link to this entry. '}
          {'If the problem persists, please '}
          <a href="https://www.contentful.com/support/" target="_blank" rel="noopener noreferrer">
            contact support
          </a>
          .
        </p>
      </div>
    );
  }
});

export default Error;
