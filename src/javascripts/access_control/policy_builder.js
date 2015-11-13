'use strict';

angular.module('contentful').factory('PolicyBuilder', ['$injector', function ($injector) {

  var capitalize = $injector.get('stringUtils').capitalize;

  var PATH_WILDCARD  = '%';
  var PATH_SEPARATOR = '.';

  return {
    internal: {
      from: function (role) {
        return _.extend({
          id: dotty.get(role, 'sys.id', null),
          version: dotty.get(role, 'sys.version', null),
          name: role.name,
          description: role.description,
          entries: {allowed: [], denied: []},
          assets: {allowed: [], denied: []}
        }, _.clone(role.permissions, true) || {});
      }
    },
    external: {
      from: function (internal) {
        return {
          sys: _.pick(internal, ['id', 'version']),
          name: internal.name,
          description: internal.description,
          policies: toExternal(internal),
          permissions: _.pick(internal, ['contentModel', 'contentDelivery', 'settings'])
        };
      }
    }
  };

  function toExternal(internal) {
    return _(prepare(internal))
      .map(addBase)
      .map(addEntityTypeConstraint)
      .map(addScopeConstraint)
      .map(addContentTypeConstraint)
      .map(addPathConstraint)
      .pluck('result')
      .value();
  }

  function prepare(internal) {
    return _.union(
      prepareCollection(internal.entries.allowed, 'allow'),
      prepareCollection(internal.entries.denied, 'deny'),
      prepareCollection(internal.assets.allowed, 'allow'),
      prepareCollection(internal.assets.denied, 'deny')
    );
  }

  function prepareCollection(collection, effect) {
    return _.map(collection, function (source) {
      return {
        source: _.extend({ effect: effect }, source),
        result: {}
      };
    });
  }

  function addBase(pair) {
    pair.result.effect = pair.source.effect;
    pair.result.actions = [pair.source.action];
    pair.result.constraint = {};
    return pair;
  }

  function addEntityTypeConstraint(pair) {
    var entityName = capitalize(pair.source.entity);
    pushConstraint(pair, eq('sys.type', entityName));
    return pair;
  }

  function addScopeConstraint(pair) {
    if (pair.source.scope !== 'user') { return pair; }

    pushConstraint(pair, eq('sys.createdBy.sys.id', 'User.current()'));
    return pair;
  }

  function addContentTypeConstraint(pair) {
    var ct = pair.source.contentType;
    if (isAll(ct) || !_.isString(ct)) { return pair; }

    pushConstraint(pair, eq('sys.contentType.sys.id', ct));
    return pair;
  }

  function addPathConstraint(pair) {
    var source = pair.source;
    if (!hasProp(source, 'field') && !hasProp(source, 'locale')) { return pair; }

    var segments = ['fields', segment(source.field), segment(source.locale)];
    pushConstraint(pair, paths(segments));
    return pair;
  }

  function hasProp(source, prop) {
    return _.isString(source[prop]) && !isAll(source[prop]);
  }

  function segment(prop) {
    return isAll(prop) ? PATH_WILDCARD : prop;
  }

  function pushConstraint(pair, constraint) {
    pair.result.constraint.and = pair.result.constraint.and || [];
    pair.result.constraint.and.push(constraint);
  }

  function eq(prop, value) {
    return { equals: [{ doc: prop }, value ] };
  }

  function paths(segments) {
    return { paths: [{doc: segments.join(PATH_SEPARATOR)}] };
  }

  function isAll(value) {
    return value === 'all';
  }
}]);
