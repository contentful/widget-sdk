import React from 'react';
import createReactClass from 'create-react-class';
// import PropTypes from 'prop-types';

const moduleName = 'ms-dev-next-steps';

angular.module('contentful')
  .factory(moduleName, ['require', _require => {
    return createReactClass({
      render () {
        return <h1>Dev next steps</h1>;
      }
    });
  }]);

export const name = moduleName;
