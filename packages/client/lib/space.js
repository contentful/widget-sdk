'use strict';

var Entity = require('./entity');
var ContentType = require('./content_type');
var Entry = require('./entry');
var Asset = require('./asset');
var _ = require('lodash');
var createResourceFactoryMethods = require('./resource_factory');
var PersistenceContext = require('./persistence_context');

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

Space.prototype.getOrganizationId = function () {
  return this.data.organization.sys.id;
};

/**
 * Returned object has the same interface as Space instances but
 * selected endpoint paths are scoped to the environment.
 *
 * Environment data is exposed as `space.environment`.
 */
Space.prototype.makeEnvironment = function (environmentId, shouldUseEnvEndpoint) {
  // We need a fresh persistence context with a separate identity map.
  // We do not scope the endpoint to `spaces/:sid/environemnts/:eid`.
  // Predicate function `shouldUseEnvEndpoint` will be used to determine
  // if a path should be directed to space or environments endpoints.
  var pctx = new PersistenceContext(this.endpoint());
  var space = new Space(this.data, pctx);

  // Construct environment data.
  space.environment = {sys: {id: environmentId, space: space}};

  // We need to overide the endpoint so environment-scoped
  // endpoints are used when applicable.
  space.endpoint = function () {
    var args = _.toArray(arguments);
    var endpoint = this.persistenceContext.endpoint();

    if (shouldUseEnvEndpoint(args)) {
      return endpoint.paths(['environments', environmentId].concat(args));
    } else {
      return endpoint.paths(args);
    }
  };

  return space;
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
