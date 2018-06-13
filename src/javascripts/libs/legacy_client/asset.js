'use strict';

var Entity = require('./entity');
var mixinPublishable = require('./publishable');
var mixinArchivable = require('./archivable');
var createResourceFactoryMethods = require('./resource_factory');

var Asset = function Asset (data, persistenceContext) {
  Entity.call(this, data, persistenceContext);
};

Asset.prototype = Object.create(Entity.prototype);
mixinPublishable(Asset.prototype);
mixinArchivable(Asset.prototype);

Asset.prototype.process = function (version, localeCode) {
  return this.endpoint('files', localeCode, 'process')
    .headers({'X-Contentful-Version': version})
    .put();
};


var factoryMethods = createResourceFactoryMethods(Asset, 'assets');
Asset.factoryMethods = {
  getAsset: factoryMethods.getById,
  getAssets: factoryMethods.getByQuery,
  createAsset: factoryMethods.create
};

module.exports = Asset;
