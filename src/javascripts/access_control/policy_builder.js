'use strict';

angular.module('contentful').factory('PolicyBuilder', ['$injector', function ($injector) {
  return {
    toInternal: $injector.get('PolicyBuilder/toInternal'),
    toExternal: $injector.get('PolicyBuilder/toExternal')
  };
}]);

angular.module('contentful').factory('PolicyBuilder/defaultRule', ['$injector', function ($injector) {

  var random = $injector.get('random');

  var DEFAULT_RULE = {
    action: 'read',
    scope: 'any',
    locale: null
  };

  var DEFAULT_ENTRY_RULE = {
    contentType: 'all',
    field: null
  };

  return {
    getDefaultRuleFor: getDefaultRuleFor,
    getDefaultRuleGetterFor: getDefaultRuleGetterFor
  };

  function getDefaultRuleGetterFor(entity) {
    return function () {
      return getDefaultRuleFor(entity);
    };
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

angular.module('contentful').factory('PolicyBuilder/toInternal', ['$injector', function ($injector) {

  var getDefaultRuleFor = $injector.get('PolicyBuilder/defaultRule').getDefaultRuleFor;

  return function toInternal(external) {
    return _.extend({
      id: dotty.get(external, 'sys.id', null),
      version: dotty.get(external, 'sys.version', null),
      name: external.name,
      description: external.description
    }, (_.clone(external.permissions, true) || {}), translatePolicies(external));
  };

  function translatePolicies(external) {
    var extension = {
      entries: {allowed: [], denied: []},
      assets: {allowed: [], denied: []},
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
    return _.map(external.policies, function (policy) {
      return {
        action: extractAction(policy),
        effectCollection: {allow: 'allowed', deny: 'denied'}[policy.effect],
        constraints: extractConstraints(policy)
      };
    });
  }

  function extendPolicyWithRule(policy) {
    var rule = createRule(policy);

    return _.extend(policy, {
      rule: rule,
      entityCollection: {entry: 'entries', asset: 'assets'}[(rule || {}).entity]
    });
  }

  function extractAction(policy) {
    if (policy.actions === 'all') {
      return 'all';
    } else if (_.isArray(policy.actions) && policy.actions.length === 1) {
      return policy.actions[0];
    }
  }

  function extractConstraints(policy) {
    if (_.isArray(policy.constraint)) {
      return policy.constraint;
    } else if (_.isObject(policy.constraint) && _.isArray(policy.constraint.and)) {
      return policy.constraint.and;
    }
  }

  function createRule(policy) {
    var entityConstraint = findEntityConstraint(policy.constraints);
    if (!entityConstraint.value) { return; }

    var rule = getDefaultRuleFor(entityConstraint.value);
    var rest = _.clone(policy.constraints);
    rest.splice(entityConstraint.index, 1);

    var ctConstraint = findContentTypeConstraint(rest);
    console.log(ctConstraint, rule);
    if (ctConstraint.value) {
      rule.contentType = ctConstraint.value;
    }
    rest.splice(ctConstraint.index, 1);
    console.log(rest);

    if (rest.length < 1) {
      return rule;
    }
  }

  function findEntityConstraint(cs) {
    var index = _.findIndex(cs, function (c) {
      return (
        _.isArray(c.equals) &&
        _.isObject(c.equals[0]) &&
        c.equals[0].doc === 'sys.type' &&
        _.contains(['Entry', 'Asset'], c.equals[1])
      );
    });

    return {
      index: index,
      value: index > -1 ? cs[index].equals[1] : null
    };
  }

  function findContentTypeConstraint(cs) {
    var index = _.findIndex(cs, function (c) {
      return (
        _.isArray(c.equals) &&
        _.isObject(c.equals[0]) &&
        c.equals[0].doc === 'sys.contentType.sys.id' &&
        _.isString(c.equals[1])
      );
    });

    return {
      index: index,
      value: index > -1 ? cs[index].equals[1] : null
    };
  }
}]);

angular.module('contentful').factory('PolicyBuilder/toExternal', ['$injector', function ($injector) {

  var capitalize = $injector.get('stringUtils').capitalize;

  var PATH_WILDCARD  = '%';
  var PATH_SEPARATOR = '.';

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
    pair.result.actions = pair.source.action === 'all' ? 'all' : [pair.source.action];
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
