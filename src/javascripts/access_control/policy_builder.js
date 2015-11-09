'use strict';

angular.module('contentful').factory('PolicyBuilder', ['$injector', function ($injector) {

  var capitalize = $injector.get('stringUtils').capitalize;

  var PATH_WILDCARD  = '*';
  var PATH_SEPARATOR = '.';

  return {
    internal: { from: _.constant({}) },
    external: {
      from: function (settings) {
        return {
          roleExtension: {
            policies: toExternal(settings)
          }
        };
      }
    }
  };

  function toExternal (settings) {
    return _(prepare(settings))
      .map(addBase)
      .map(addEntityTypeConstraint)
      .map(addScopeConstraint)
      .map(addContentTypeConstraint)
      .map(addPathConstraint)
      .pluck('result')
      .value();
  }

  function prepare(settings) {
    return _.union(
      prepareCollection(settings.entries.allowed, 'allow'),
      prepareCollection(settings.entries.denied, 'deny'),
      prepareCollection(settings.assets.allowed, 'allow'),
      prepareCollection(settings.assets.denied, 'deny')
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
    return { paths: [segments.join(PATH_SEPARATOR)] };
  }

  function isAll(value) {
    return value === 'all';
  }
}]);
