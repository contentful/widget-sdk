import React from 'react';
import createReactClass from 'create-react-class';

const Loader = createReactClass({
  displayName: 'Loader',
  render() {
    return (
      <div data-test-id="loader" className="state-change-confirmation-dialog__loading-wrapper">
        <div className="loading" />
      </div>
    );
  }
});

export default Loader;
