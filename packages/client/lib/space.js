'use strict';

var Entity = require('./entity');
var ContentType = require('./content_type');
var EditingInterface = require('./editing_interface');
var Entry = require('./entry');
var Asset = require('./asset');
var Locale = require('./locale');
var _ = require('lodash');
var createResourceFactoryMethods = require('./resource_factory');

var Space = function Space (data, persistenceContext) {
  persistenceContext.setupIdentityMap();
  Entity.call(this, data, persistenceContext);
};

Space.prototype = Object.create(Entity.prototype);

Space.prototype.getPrivateLocales = function () {
  return _.filter(this.data.locales, function (locale) {
    return locale.contentManagementApi;
  });
};

Space.prototype.isOwner = function (user) {
  return user && this.data.organization.sys.createdBy.sys.id === user.sys.id;
};

Space.prototype.isAdmin = function (user) {
  var membership = this.data.spaceMembership;
  return user && user.sys.id === membership.user.sys.id && membership.admin === true;
};

Space.prototype.isHibernated = function () {
  return _.some(this.data.enforcements, function (enforcement) {
    return enforcement.reason === 'hibernated';
  });
};

Space.prototype.getOrganizationId = function () {
  return this.data.organization.sys.id;
};

Space.mixinFactoryMethods = function (target, path) {
  var factoryMethods = createResourceFactoryMethods(Space, path);
  _.extend(target, {
    getSpace: factoryMethods.getById,
    getSpaces: factoryMethods.getByQuery,
    newSpace: factoryMethods.new,
    createSpace: function (data, organizationId) {
      return this.newSpace(data).save({
        'X-Contentful-Organization': organizationId
      });
    }
  });
};

_.extend(Space.prototype,
  ContentType.factoryMethods,
  EditingInterface.spaceMethods,
  Entry.factoryMethods,
  Asset.factoryMethods,
  Locale.factoryMethods
);

module.exports = Space;
