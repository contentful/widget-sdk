'use strict';

const Entity = require('./entity');
const mixinPublishable = require('./publishable');
const mixinArchivable = require('./archivable');
const createResourceFactoryMethods = require('./resource_factory');

const Asset = function Asset(data, persistenceContext) {
  Entity.call(this, data, persistenceContext);
};

Asset.prototype = Object.create(Entity.prototype);
mixinPublishable(Asset.prototype);
mixinArchivable(Asset.prototype);

Asset.prototype.process = function(version, localeCode) {
  return this.endpoint('files', localeCode, 'process')
    .headers({ 'X-Contentful-Version': version })
    .put();
};

const factoryMethods = createResourceFactoryMethods(Asset, 'assets');
Asset.factoryMethods = {
  getAsset: factoryMethods.getById,
  getAssets: factoryMethods.getByQuery,
  createAsset: factoryMethods.create
};

module.exports = Asset;
