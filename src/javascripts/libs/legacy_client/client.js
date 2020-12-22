import PersistenceContext from './persistence_context';
import Space from './space';
import Request from './request';
import mixinChildResourceMethods from './child_resources';

/**
 * @deprecated
 * This client uses `X-Contentful-Skip-Transformation` for CMA requests which exposes internal IDs, something we
 * generally want to avoid in the web app now. Use {data/APIClient} instead e.g. via `spaceContext.cma` or
 * `sdk.space` wherever possible.
 */
const Client = function Client(adapter) {
  const baseRequest = new Request(adapter);
  this.persistenceContext = new PersistenceContext(baseRequest);
};

Client.prototype = {
  endpoint: function (...args) {
    return this.persistenceContext.endpoint().paths(args);
  },
};

mixinChildResourceMethods(Client.prototype);
Space.mixinFactoryMethods(Client.prototype, 'spaces');

export default Client;
