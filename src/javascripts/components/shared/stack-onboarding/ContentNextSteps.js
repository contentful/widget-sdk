import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

const moduleName = 'ms-content-creator-next-steps';

angular.module('contentful')
  .factory(moduleName, ['require', _require => {
    return createReactClass({
      render () {
        return <h1>Content creator next steps</h1>;
      }
    });
  }]);

export {
  moduleName as name
};
