import React from 'react';
import createReactClass from 'create-react-class';

const moduleName = 'data-flow-onboarding';

angular.module('contentful')
.factory(moduleName, [function () {
  const DataFlow = createReactClass({
    render () {
      return (
        <div>
          {'data flow is tricky, so it will be done later'}
        </div>
      );
    }
  });

  return DataFlow;
}]);

export const name = moduleName;
