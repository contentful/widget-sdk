'use strict';

var ApiKey = require('./api_key');
var createResourceFactoryMethods = require('./resource_factory');

var PreviewApiKey = function PreviewApiKey (data, persistenceContext) {
  ApiKey.call(this, data, persistenceContext);
};

PreviewApiKey.prototype = Object.create(ApiKey.prototype);

var baseFactoryMethods = createResourceFactoryMethods(PreviewApiKey, 'preview_api_keys');
PreviewApiKey.factoryMethods = {
  getPreviewApiKeys: baseFactoryMethods.getByQuery,
  getPreviewApiKey: baseFactoryMethods.getById,
  createPreviewApiKey: baseFactoryMethods.create,
  newPreviewApiKey: baseFactoryMethods.new
};

module.exports = PreviewApiKey;
