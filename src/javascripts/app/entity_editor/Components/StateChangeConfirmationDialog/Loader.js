import React from 'react';

class Loader extends React.Component {
  static displayName = 'Loader';

  render() {
    return (
      <div data-test-id="loader" className="state-change-confirmation-dialog__loading-wrapper">
        <div className="loading" />
      </div>
    );
  }
}

export default Loader;
