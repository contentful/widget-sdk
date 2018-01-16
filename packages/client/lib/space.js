'use strict';

var Entity = require('./entity');
var ContentType = require('./content_type');
var Entry = require('./entry');
var Asset = require('./asset');
var _ = require('lodash');
var createResourceFactoryMethods = require('./resource_factory');

var Space = function Space (data, persistenceContext) {
  persistenceContext.setupIdentityMap();
  this.persistenceContext = persistenceContext;
  this.data = data;
};

Space.prototype = Object.create(Entity.prototype);

Space.prototype.update = Space.prototype.save = Space.prototype.delete = function () {
  // Disable `update`, `save` and `delete` methods, use new CMA client instead
  throw new Error('Cannot update/save/delete a space');
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
  _.extend(target, {newSpace: factoryMethods.new});
};

_.extend(Space.prototype,
  ContentType.factoryMethods,
  Entry.factoryMethods,
  Asset.factoryMethods
);

module.exports = Space;
