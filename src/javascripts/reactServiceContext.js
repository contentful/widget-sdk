/**
 * @description This module exposes all angular services to react components.
 * These react components don't have to exist in angular world, however – they
 * are decoupled. In react world, you just import default export from this file
 * (this file has nothing to do with angular, so webpack can build a bundle),
 * and use it as a HoC for your component.
 *
 * In order to make it work, you have to mount your components on a tree with
 * a correct context, which is set up using <Provider>. However, you don't need
 * to do it manually, since <react-component /> directive does it for you
 * automatically, and there is no reason to render it outside of angular world.
 *
 * This approach allows to write JS code which has 0 explicit dependencies on angular.
 * There are implicit dependencies, but they are immediately visible, and allow you
 * to benefit from webpack (separate tests and code splitting) without any issues from
 * current angular setup process.
 */

import React from 'react';
import PropTypes from 'prop-types';

export const { Provider, Consumer } = React.createContext({});

export const MockedProvider = ({ services, children }) => (
  <Provider
    value={{
      get: name => {
        return services[name] ? services[name] : undefined;
      }
    }}>
    {children}
  </Provider>
);
MockedProvider.propTypes = {
  services: PropTypes.object.isRequired,
  children: PropTypes.any
};

/**
 * @description function to create HoC to provide angular services to react
 * components. This can be used outside of angular world as long as you mount
 * your components using <react-component> directive.
 *
 * You can also import <Consumer /> directly, but this function is used as HoC,
 * so you have services as props, and also it resolves all dependencies automatically
 * (otherwise you have to call `services.get('service_to_get'))` manually.
 *
 * @example
 *
 * ServicesConsumer('$state', 'spaceContext)(MyComponent);
 * ServicesConsumer('$state', {
 *   from: 'services/TokenStore.es6',
 *   as: 'tokenStore'
 * })(MyComponent);
 *
 * @param  {...string|Object} selectedServices – list of services you want to pick
 * @returns {function(Component: React.Component): React.Component} – function to
 * create a react component which passes selected services as props to provided component.
 */
export default function ServicesConsumerHOC(...selectedServices) {
  return Component => {
    const ServicesConsumer = props => {
      return (
        <Consumer>
          {services => {
            // return only selected services
            // the reason to do so – we have better visibility what we depend on
            // so we can analyze it and know what to refactor
            let pickedServices = {};
            if (services) {
              pickedServices = selectedServices.reduce((acc, serviceConfig) => {
                if (typeof serviceConfig === 'string') {
                  acc[serviceConfig] = services.get(serviceConfig);
                } else {
                  acc[serviceConfig.as] = services.get(serviceConfig.from);
                }
                return acc;
              }, {});
            }
            return <Component {...props} $services={pickedServices} />;
          }}
        </Consumer>
      );
    };

    ServicesConsumer.displayName = 'ServicesConsumer';

    return ServicesConsumer;
  };
}
