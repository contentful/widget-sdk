'use strict';

angular.module('contentful').constant('PolicyBuilder/CONFIG', {
  ALL_FIELDS: '__cf_internal_all_fields__',
  ALL_LOCALES: '__cf_internal_all_locales__',
  ALL_CTS: '__cf_internal_all_cts__',
  NO_CTS: '__cf_internal_no_cts__',
  PATH_WILDCARD: '%',
  PATH_SEPARATOR: '.'
});

angular.module('contentful').factory('PolicyBuilder', ['require', require => ({
  toInternal: require('PolicyBuilder/toInternal'),
  toExternal: require('PolicyBuilder/toExternal'),
  removeOutdatedRules: require('PolicyBuilder/removeOutdatedRules')
})]);

angular.module('contentful').factory('PolicyBuilder/defaultRule', ['require', require => {

  var random  = require('random');
  var ALL_CTS = require('PolicyBuilder/CONFIG').ALL_CTS;

  var DEFAULT_RULE = {
    action: 'all',
    scope: 'any',
    locale: null
  };

  var DEFAULT_ENTRY_RULE = {
    contentType: ALL_CTS,
    field: null
  };

  return {
    getDefaultRuleFor: getDefaultRuleFor,
    getDefaultRuleGetterFor: getDefaultRuleGetterFor
  };

  function getDefaultRuleGetterFor(entity) {
    return () => getDefaultRuleFor(entity);
  }

  function getDefaultRuleFor(entity) {
    entity = entity.toLowerCase();
    var meta = { id: random.id(), entity: entity };
    var base = _.extend(meta, DEFAULT_RULE);

    if (entity === 'entry') {
      return _.extend(base, DEFAULT_ENTRY_RULE);
    } else {
      return base;
    }
  }
}]);

angular.module('contentful').factory('PolicyBuilder/toInternal', ['require', require => {

  var CONFIG            = require('PolicyBuilder/CONFIG');
  var getDefaultRuleFor = require('PolicyBuilder/defaultRule').getDefaultRuleFor;

  return function toInternal(external) {
    return _.extend({
      id: _.get(external, 'sys.id', null),
      version: _.get(external, 'sys.version', null),
      name: external.name,
      description: external.description
    }, (_.cloneDeep(external.permissions) || {}), translatePolicies(external));
  };

  function translatePolicies(external) {
    var policyString = '[]';
    try {
      policyString = JSON.stringify(external.policies);
    } catch (e) {}

    var extension = {
      entries: {allowed: [], denied: []},
      assets: {allowed: [], denied: []},
      policyString: policyString,
      uiCompatible: true
    };

    _(prepare(external))
      .map(extendPolicyWithRule)
      .forEach(prepareExtension);

    return extension;

    function prepareExtension(p) {
      if (!p.action || !p.entityCollection || !p.effectCollection || !p.rule) {
        extension.uiCompatible = false;
      } else {
        var rule = _.extend(p.rule, { action: p.action });
        extension[p.entityCollection][p.effectCollection].push(rule);
      }
    }
  }

  function prepare(external) {
    return _.map(external.policies, policy => ({
      action: extractAction(policy),
      effectCollection: {allow: 'allowed', deny: 'denied'}[policy.effect],
      constraints: extractConstraints(policy)
    }));
  }

  function extendPolicyWithRule(policy) {
    var rule = createRule(policy);

    return _.extend(policy, {
      rule: rule,
      entityCollection: {entry: 'entries', asset: 'assets'}[(rule || {}).entity]
    });
  }

  function extractAction(policy) {
    var as = policy.actions;
    var glued = ['publish', 'unpublish', 'archive', 'unarchive'];

    if (as === 'all') {
      return 'all';
    } else if (isArrayOfLength(1) && !_.includes(glued, as[0])) {
      return as[0];
    } else if (isArrayOfLength(2) && containsBoth(...glued.slice(0, 2))) {
      return 'publish';
    } else if (isArrayOfLength(2) && containsBoth(...glued.slice(2, 4))) {
      return 'archive';
    }

    return null;

    function isArrayOfLength(n)   { return _.isArray(as) && as.length === n;           }
    function containsBoth(s1, s2) { return as.indexOf(s1) > -1 && as.indexOf(s2) > -1; }
  }

  function extractConstraints(policy) {
    if (_.isArray(policy.constraint)) {
      return policy.constraint;
    } else if (_.isObject(policy.constraint) && _.isArray(policy.constraint.and)) {
      return policy.constraint.and;
    }
  }

  function createRule(policy) {
    // 1. find entity type
    var entityConstraint = findEntityConstraint(policy.constraints);

    // 1a. no value - abort
    if (!entityConstraint.value) { return; }

    // 1b. create default rule for entity type
    var rule = getDefaultRuleFor(entityConstraint.value);
    var rest = _.clone(policy.constraints);
    rest.splice(entityConstraint.index, 1);

    // 2. find content type
    var ctConstraint = findContentTypeConstraint(rest);
    if (ctConstraint.value) {
      rule.contentType = ctConstraint.value;
      rest.splice(ctConstraint.index, 1);
    }

    // 3. find matching entity ID
    var idConstraint = findIdConstraint(rest);
    if (idConstraint.value) {
      rule.contentType = CONFIG.NO_CTS;
      rule.entityId = idConstraint.value;
      rest.splice(idConstraint.index, 1);
    }

    // 4. find scope
    var scopeConstraint = findScopeConstraint(rest);
    if (scopeConstraint.value) {
      rule.scope = _.isString(scopeConstraint.value) ? 'user' : 'any';
      rest.splice(scopeConstraint.index, 1);
    }

    // 5. find path
    var pathConstraint = findPathConstraint(rest);
    if (pathConstraint.value) {
      rule.isPath = true;
      rule.field = fieldPathSegment(pathConstraint.value[1]);
      rule.locale = localePathSegment(pathConstraint.value[2]);
      rest.splice(pathConstraint.index, 1);
    }

    // return rule only when all constraints were parsed
    if (rest.length < 1) { return rule; }
  }

  function findEntityConstraint(cs) {
    return searchResult(cs, _.findIndex(cs, c => docEq(c, 'sys.type') && _.includes(['Entry', 'Asset'], c.equals[1])));
  }

  function findContentTypeConstraint(cs) {
    return searchResult(cs, _.findIndex(cs, c => docEq(c, 'sys.contentType.sys.id') && _.isString(c.equals[1])));
  }

  function findIdConstraint(cs) {
    return searchResult(cs, _.findIndex(cs, c => docEq(c, 'sys.id') && _.isString(c.equals[1])));
  }

  function findScopeConstraint(cs) {
    return searchResult(cs, _.findIndex(cs, c => docEq(c, 'sys.createdBy.sys.id') && _.isString(c.equals[1])));
  }

  function findPathConstraint(cs) {
    var index = _.findIndex(cs, c => _.isArray(c.paths) && _.isObject(c.paths[0]) && _.isString(c.paths[0].doc));

    return {
      index: index,
      value: index > -1 ? cs[index].paths[0].doc.split(CONFIG.PATH_SEPARATOR) : null
    };
  }

  function docEq(c, val) {
    return _.isArray(c.equals) && _.isObject(c.equals[0]) && c.equals[0].doc === val;
  }

  function searchResult(cs, index) {
    return {
      index: index,
      value: index > -1 ? cs[index].equals[1] : null
    };
  }

  function fieldPathSegment(segment) {
    return pathSegment(segment, CONFIG.ALL_FIELDS);
  }

  function localePathSegment(segment) {
    return pathSegment(segment, CONFIG.ALL_LOCALES);
  }

  function pathSegment(segment, allValue) {
    return segment === CONFIG.PATH_WILDCARD ? allValue : segment;
  }
}]);

angular.module('contentful').factory('PolicyBuilder/toExternal', ['require', require => {

  var capitalize = require('stringUtils').capitalize;
  var CONFIG     = require('PolicyBuilder/CONFIG');

  return function toExternal(internal) {
    return {
      sys: _.pick(internal, ['id', 'version']),
      name: internal.name,
      description: internal.description,
      policies: translatePolicies(internal),
      permissions: _.pick(internal, ['contentModel', 'contentDelivery', 'settings'])
    };
  };

  function translatePolicies(internal) {
    if (!internal.uiCompatible) {
      try {
        return JSON.parse(internal.policyString);
      } catch (e) {
        return null;
      }
    }

    return _(prepare(internal))
      .map(addBase)
      .map(addEntityTypeConstraint)
      .map(addScopeConstraint)
      .map(addContentTypeConstraint)
      .map(addPathConstraint)
      .map('result')
      .value();
  }

  function prepare(internal) {
    return _.union(
      prepareCollection(_.get(internal, 'entries.allowed', []), 'entry', 'allow'),
      prepareCollection(_.get(internal, 'entries.denied',  []), 'entry', 'deny'),
      prepareCollection(_.get(internal, 'assets.allowed',  []), 'asset', 'allow'),
      prepareCollection(_.get(internal, 'assets.denied',   []), 'asset', 'deny')
    );
  }

  function prepareCollection(collection, entity, effect) {
    return _.map(collection, source => ({
      source: _.extend({ effect: effect, entity: entity }, source),
      result: {}
    }));
  }

  function addBase(pair) {
    pair.result.effect = pair.source.effect;
    pair.result.constraint = {};

    var a = pair.source.action;
    if (a === 'all') {
      pair.result.actions = 'all';
    } else if (a === 'publish' || a === 'archive') {
      pair.result.actions = [a, 'un' + a];
    } else {
      pair.result.actions = [a];
    }

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
    if (ct === CONFIG.ALL_CTS || !_.isString(ct)) { return pair; }

    pushConstraint(pair, eq('sys.contentType.sys.id', ct));
    return pair;
  }

  function addPathConstraint(pair) {
    var source = pair.source;

    if (pair.source.entity === 'asset') {
      if (!_.isString(source.locale)) { return pair; }
    } else {
      if (!_.isString(source.field) || !_.isString(source.locale)) { return pair; }
    }

    var segments = ['fields', fieldSegment(source.field), localeSegment(source.locale)];
    pushConstraint(pair, paths(segments));
    return pair;
  }

  function fieldSegment(prop) {
    return segment(prop, CONFIG.ALL_FIELDS);
  }

  function localeSegment(prop) {
    return segment(prop, CONFIG.ALL_LOCALES);
  }

  function segment(prop, allValue) {
    return (prop === allValue || !prop) ? CONFIG.PATH_WILDCARD : prop;
  }

  function pushConstraint(pair, constraint) {
    pair.result.constraint.and = pair.result.constraint.and || [];
    pair.result.constraint.and.push(constraint);
  }

  function eq(prop, value) {
    return { equals: [{ doc: prop }, value ] };
  }

  function paths(segments) {
    return { paths: [{doc: segments.join(CONFIG.PATH_SEPARATOR)}] };
  }
}]);
