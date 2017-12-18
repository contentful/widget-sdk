'use strict';

var _ = require('lodash-node/modern');
var Entity = require('./entity');
var createResourceFactoryMethods = require('./resource_factory');

var ApiKey = function ApiKey (data, persistenceContext) {
  Entity.call(this, data, persistenceContext);
};

ApiKey.prototype = Object.create(Entity.prototype);

ApiKey.prototype.getName = function () {
  return this.data.name;
};

ApiKey.prototype.serialize = function () {
  return _.omit(this.data, 'accessToken', 'policies', 'preview_api_key');
};

ApiKey.prototype.regenerateAccessToken = function () {
  var self = this;
  return this.endpoint('regenerate_access_token')
    .rejectEmpty().get()
    .then(function (response) {
      self.update(response);
      return response;
    });
};

var baseFactoryMethods = createResourceFactoryMethods(ApiKey, 'api_keys');
ApiKey.factoryMethods = {
  getDeliveryApiKeys: baseFactoryMethods.getByQuery,
  getDeliveryApiKey: baseFactoryMethods.getById,
  createDeliveryApiKey: baseFactoryMethods.create,
  newDeliveryApiKey: baseFactoryMethods.new
};

module.exports = ApiKey;
