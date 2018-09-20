/**
 * @description This is an angular module to pass all angular services
 * into react components. These components can be defined outside of
 * angular application, and just use context as a bridge for legacy API.
 *
 * This provider is used automatically every time you use `<react-component />`.
 * Ideally you should mount all react components with this directive, so that
 * you can mount any pure react component and use angular services inside
 * without knowing about angular app.
 */

import React from 'react';
import PropTypes from 'prop-types';

// this is `require` from webpack. `reactServiceContext` has to be
// consumed as a JS module, without angular dependency, so we can
// build non-angular apps
const { Provider } = require('./reactServiceContext');

angular.module('contentful').factory('ServicesProvider', [
  'require',
  function(require) {
    // we expose `require` functionality, so all registered
    // angular modules can be called. Using this approach, we
    // don't have to register all modules manually.
    const services = {
      get(name) {
        try {
          return require(name);
        } catch (err) {
          // eslint-disable-next-line
          console.error(
            `You're trying to provide non-existing "${name}" module via ServicesConsumer. Check the place where you wrap component for typos.`
          );
          throw err;
        }
      }
    };
    const ProviderWrapper = props => <Provider value={services}>{props.children}</Provider>;

    ProviderWrapper.propTypes = {
      children: PropTypes.node
    };

    return ProviderWrapper;
  }
]);
