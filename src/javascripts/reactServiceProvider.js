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
import { Provider } from './reactServiceContext';

angular.module('contentful').factory('ServicesProvider', [
  '$injector',
  function($injector) {
    // we expose `$injector.get` functionality, so all registered
    // angular modules can be called. Using this approach, we
    // don't have to register all modules manually.
    const services = {
      get(name) {
        try {
          return $injector.get(name);
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
