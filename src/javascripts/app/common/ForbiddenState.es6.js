import React from 'react';

export default class ForbiddenState extends React.Component {
  render() {
    return (
      <div>
        <h2 className="workbench-forbidden__over-headline">Access forbidden (403)</h2>
        <p className="workbench-forbidden__headline">You don’t have access to this page.</p>
        <p className="workbench-forbidden__message">
          Contact the administrator of this space to get access.
        </p>
      </div>
    );
  }
}
