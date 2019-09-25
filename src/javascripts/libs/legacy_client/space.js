import _ from 'lodash';
import Entity from './entity';
import ContentType from './content_type';
import Entry from './entry';
import Asset from './asset';
import createResourceFactoryMethods from './resource_factory';
import PersistenceContext from './persistence_context';

const Space = function Space(data, persistenceContext) {
  persistenceContext.setupIdentityMap();
  this.persistenceContext = persistenceContext;
  this.data = data;
};

Space.prototype = Object.create(Entity.prototype);

Space.prototype.update = Space.prototype.save = Space.prototype.delete = function() {
  // Disable `update`, `save` and `delete` methods, use new CMA client instead
  throw new Error('Cannot update/save/delete a space');
};

Space.prototype.isOwner = function(user) {
  return user && this.data.organization.sys.createdBy.sys.id === user.sys.id;
};

Space.prototype.isAdmin = function(user) {
  const membership = this.data.spaceMember;
  return user && user.sys.id === membership.sys.user.sys.id && membership.admin === true;
};

Space.prototype.getOrganizationId = function() {
  return this.data.organization.sys.id;
};

/**
 * Returned object has the same interface as Space instances but
 * selected endpoint paths are scoped to the environment.
 *
 * Environment data is exposed as `space.environment`.
 */
Space.prototype.makeEnvironment = function(environmentId, shouldUseEnvEndpoint) {
  // We need a fresh persistence context with a separate identity map.
  // We do not scope the endpoint to `spaces/:sid/environemnts/:eid`.
  // Predicate function `shouldUseEnvEndpoint` will be used to determine
  // if a path should be directed to space or environments endpoints.
  const pctx = new PersistenceContext(this.endpoint());
  const space = new Space(this.data, pctx);

  // We need to overide the endpoint so environment-scoped
  // endpoints are used when applicable.
  space.endpoint = function() {
    const args = _.toArray(arguments);
    const endpoint = this.persistenceContext.endpoint();

    if (shouldUseEnvEndpoint(args)) {
      return endpoint.paths(['environments', environmentId].concat(args));
    } else {
      return endpoint.paths(args);
    }
  };

  return space;
};

Space.mixinFactoryMethods = function(target, path) {
  const factoryMethods = createResourceFactoryMethods(Space, path);
  _.extend(target, { newSpace: factoryMethods.new });
};

_.extend(Space.prototype, ContentType.factoryMethods, Entry.factoryMethods, Asset.factoryMethods);

export default Space;
