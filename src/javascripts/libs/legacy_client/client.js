import PersistenceContext from './persistence_context';
import Space from './space';
import Request from './request';
import mixinChildResourceMethods from './child_resources';
import assetContentType from './asset_content_type';

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

export { assetContentType };

export default Client;
