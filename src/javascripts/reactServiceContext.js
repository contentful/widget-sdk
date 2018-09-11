/**
 * @description This module exposes all angular modules to react components.
 *
 * It has two parts – consumer which is not angular specific, and provider,
 * which is angular-specific, since it injects all angular services.
 *
 * The goal is to be able to write react component without any dependency on
 * angular altogether.
 *
 */

import React from 'react';
import PropTypes from 'prop-types';

const { Provider, Consumer } = React.createContext({});

/**
 * @description function to create HoC to provide angular services to react
 * components. This can be used outside of angular world as long as you mount
 * your components using <react-component> directive.
 *
 * Also, please note that this is a regular function in regular .js file, so
 * you can import it using normal webpack's import/export functionality.
 *
 * @param  {...string} selectedServices – list of services you want to pick
 */
export default function ServicesConsumer(...selectedServices) {
  return Component => {
    return props => {
      return (
        <Consumer>
          {services => {
            // return only selected services
            // the reason to do so – we have better visibility what we depend on
            const pickedServices = selectedServices.reduce((acc, serviceName) => {
              acc[serviceName] = services[serviceName];
              return acc;
            }, {});
            return <Component {...props} $services={pickedServices} />;
          }}
        </Consumer>
      );
    };
  };
}

angular.module('contentful').factory('ServicesProvider', [
  'require',
  function(require) {
    // all services which we expose to the react components are here
    // if you need another one, just get it using angular `require`,
    // and add to the object
    const services = {
      $state: require('$state'),
      spaceContext: require('spaceContext'),
      slideInNavigator: require('navigation/SlideInNavigator'),
      thumbnailHelpers: require('ui/cf/thumbnailHelpers.es6')
    };
    const ProviderWrapper = props => <Provider value={services}>{props.children}</Provider>;

    ProviderWrapper.propTypes = {
      children: PropTypes.node
    };

    return ProviderWrapper;
  }
]);
