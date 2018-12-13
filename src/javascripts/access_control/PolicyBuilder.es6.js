import { registerConstant, registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';
import * as random from 'utils/Random.es6';
import { capitalize } from 'utils/StringUtils.es6';

registerConstant('PolicyBuilder/CONFIG', {
  ALL_FIELDS: '__cf_internal_all_fields__',
  ALL_LOCALES: '__cf_internal_all_locales__',
  ALL_CTS: '__cf_internal_all_cts__',
  NO_CTS: '__cf_internal_no_cts__',
  PATH_WILDCARD: '%',
  PATH_SEPARATOR: '.'
});

registerFactory('PolicyBuilder', [
  'PolicyBuilder/toInternal',
  'PolicyBuilder/toExternal',
  'PolicyBuilder/removeOutdatedRules',
  (toInternal, toExternal, removeOutdatedRules) => {
    return {
      toInternal,
      toExternal,
      removeOutdatedRules
    };
  }
]);

registerFactory('PolicyBuilder/defaultRule', [
  'PolicyBuilder/CONFIG',
  PolicyBuilderConfig => {
    const { ALL_CTS } = PolicyBuilderConfig;

    const DEFAULT_RULE = {
      action: 'all',
      scope: 'any',
      locale: null
    };

    const DEFAULT_ENTRY_RULE = {
      contentType: ALL_CTS,
      field: null
    };

    return {
      getDefaultRuleFor,
      getDefaultRuleGetterFor
    };

    function getDefaultRuleGetterFor(entity) {
      return () => getDefaultRuleFor(entity);
    }

    function getDefaultRuleFor(entity) {
      entity = entity.toLowerCase();
      const meta = { id: random.id(), entity };
      const base = _.extend(meta, DEFAULT_RULE);

      if (entity === 'entry') {
        return _.extend(base, DEFAULT_ENTRY_RULE);
      } else {
        return base;
      }
    }
  }
]);

registerFactory('PolicyBuilder/toInternal', [
  'PolicyBuilder/CONFIG',
  'PolicyBuilder/defaultRule',
  (CONFIG, DefaultRule) => {
    const { getDefaultRuleFor } = DefaultRule;

    return function toInternal(external) {
      return _.extend(
        {
          id: _.get(external, 'sys.id', null),
          version: _.get(external, 'sys.version', null),
          name: external.name,
          description: external.description
        },
        _.cloneDeep(external.permissions) || {},
        translatePolicies(external)
      );
    };

    function translatePolicies(external) {
      let policyString = '[]';
      try {
        policyString = JSON.stringify(external.policies);
      } catch (e) {
        // ignore
      }

      const extension = {
        entries: { allowed: [], denied: [] },
        assets: { allowed: [], denied: [] },
        policyString,
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
          const rule = _.extend(p.rule, { action: p.action });
          extension[p.entityCollection][p.effectCollection].push(rule);
        }
      }
    }

    function prepare(external) {
      return _.map(external.policies, policy => ({
        action: extractAction(policy),
        effectCollection: { allow: 'allowed', deny: 'denied' }[policy.effect],
        constraints: extractConstraints(policy)
      }));
    }

    function extendPolicyWithRule(policy) {
      const rule = createRule(policy);

      return _.extend(policy, {
        rule,
        entityCollection: { entry: 'entries', asset: 'assets' }[(rule || {}).entity]
      });
    }

    function extractAction(policy) {
      const as = policy.actions;
      const glued = ['publish', 'unpublish', 'archive', 'unarchive'];

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

      function isArrayOfLength(n) {
        return _.isArray(as) && as.length === n;
      }
      function containsBoth(s1, s2) {
        return as.indexOf(s1) > -1 && as.indexOf(s2) > -1;
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
      // 1. find entity type
      const entityConstraint = findEntityConstraint(policy.constraints);

      // 1a. no value - abort
      if (!entityConstraint.value) {
        return;
      }

      // 1b. create default rule for entity type
      const rule = getDefaultRuleFor(entityConstraint.value);
      const rest = _.clone(policy.constraints);
      rest.splice(entityConstraint.index, 1);

      // 2. find content type
      const ctConstraint = findContentTypeConstraint(rest);
      if (ctConstraint.value) {
        rule.contentType = ctConstraint.value;
        rest.splice(ctConstraint.index, 1);
      }

      // 3. find matching entity ID
      const idConstraint = findIdConstraint(rest);
      if (idConstraint.value) {
        rule.contentType = CONFIG.NO_CTS;
        rule.entityId = idConstraint.value;
        rest.splice(idConstraint.index, 1);
      }

      // 4. find scope
      const scopeConstraint = findScopeConstraint(rest);
      if (scopeConstraint.value) {
        rule.scope = _.isString(scopeConstraint.value) ? 'user' : 'any';
        rest.splice(scopeConstraint.index, 1);
      }

      // 5. find path
      const pathConstraint = findPathConstraint(rest);
      if (pathConstraint.value) {
        rule.isPath = true;
        rule.field = fieldPathSegment(pathConstraint.value[1]);
        rule.locale = localePathSegment(pathConstraint.value[2]);
        rest.splice(pathConstraint.index, 1);
      }

      // return rule only when all constraints were parsed
      if (rest.length < 1) {
        return rule;
      }
    }

    function findEntityConstraint(cs) {
      return searchResult(
        cs,
        _.findIndex(cs, c => docEq(c, 'sys.type') && _.includes(['Entry', 'Asset'], c.equals[1]))
      );
    }

    function findContentTypeConstraint(cs) {
      return searchResult(
        cs,
        _.findIndex(cs, c => docEq(c, 'sys.contentType.sys.id') && _.isString(c.equals[1]))
      );
    }

    function findIdConstraint(cs) {
      return searchResult(cs, _.findIndex(cs, c => docEq(c, 'sys.id') && _.isString(c.equals[1])));
    }

    function findScopeConstraint(cs) {
      return searchResult(
        cs,
        _.findIndex(cs, c => docEq(c, 'sys.createdBy.sys.id') && _.isString(c.equals[1]))
      );
    }

    function findPathConstraint(cs) {
      const index = _.findIndex(
        cs,
        c => _.isArray(c.paths) && _.isObject(c.paths[0]) && _.isString(c.paths[0].doc)
      );

      return {
        index,
        value: index > -1 ? cs[index].paths[0].doc.split(CONFIG.PATH_SEPARATOR) : null
      };
    }

    function docEq(c, val) {
      return _.isArray(c.equals) && _.isObject(c.equals[0]) && c.equals[0].doc === val;
    }

    function searchResult(cs, index) {
      return {
        index,
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
  }
]);

registerFactory('PolicyBuilder/toExternal', [
  'PolicyBuilder/CONFIG',
  CONFIG => {
    return function toExternal(internal) {
      return {
        sys: _.pick(internal, ['id', 'version']),
        name: internal.name,
        description: internal.description,
        policies: translatePolicies(internal),
        permissions: _.pick(internal, [
          'contentModel',
          'contentDelivery',
          'settings',
          'environments'
        ])
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
        prepareCollection(_.get(internal, 'entries.denied', []), 'entry', 'deny'),
        prepareCollection(_.get(internal, 'assets.allowed', []), 'asset', 'allow'),
        prepareCollection(_.get(internal, 'assets.denied', []), 'asset', 'deny')
      );
    }

    function prepareCollection(collection, entity, effect) {
      return _.map(collection, source => ({
        source: _.extend({ effect, entity }, source),
        result: {}
      }));
    }

    function addBase(pair) {
      pair.result.effect = pair.source.effect;
      pair.result.constraint = {};

      const a = pair.source.action;
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
      const entityName = capitalize(pair.source.entity);
      pushConstraint(pair, eq('sys.type', entityName));
      return pair;
    }

    function addScopeConstraint(pair) {
      if (pair.source.scope !== 'user') {
        return pair;
      }

      pushConstraint(pair, eq('sys.createdBy.sys.id', 'User.current()'));
      return pair;
    }

    function addContentTypeConstraint(pair) {
      const ct = pair.source.contentType;
      if (ct === CONFIG.ALL_CTS || !_.isString(ct)) {
        return pair;
      }

      pushConstraint(pair, eq('sys.contentType.sys.id', ct));
      return pair;
    }

    function addPathConstraint(pair) {
      const source = pair.source;

      if (pair.source.entity === 'asset') {
        if (!_.isString(source.locale)) {
          return pair;
        }
      } else {
        if (!_.isString(source.field) || !_.isString(source.locale)) {
          return pair;
        }
      }

      const segments = ['fields', fieldSegment(source.field), localeSegment(source.locale)];
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
      return prop === allValue || !prop ? CONFIG.PATH_WILDCARD : prop;
    }

    function pushConstraint(pair, constraint) {
      pair.result.constraint.and = pair.result.constraint.and || [];
      pair.result.constraint.and.push(constraint);
    }

    function eq(prop, value) {
      return { equals: [{ doc: prop }, value] };
    }

    function paths(segments) {
      return { paths: [{ doc: segments.join(CONFIG.PATH_SEPARATOR) }] };
    }
  }
]);

registerFactory('PolicyBuilder/removeOutdatedRules', [
  'PolicyBuilder/CONFIG',
  CONFIG => {
    const PATHS = ['entries.allowed', 'entries.denied', 'assets.allowed', 'assets.denied'];

    return function removeOutdatedRules(internal, contentTypes, locales) {
      const filtered = filterPolicies(internal);

      if (countPolicies(internal) !== countPolicies(filtered)) {
        _.extend(internal, filtered);
        return true;
      }

      return false;

      function filterPolicies(internal) {
        return _.transform(
          PATHS,
          (acc, path) => {
            const collection = _.get(internal, path, []);
            const filtered = filterPolicyCollection(collection);
            _.set(acc, path, filtered);
          },
          {}
        );
      }

      function countPolicies(wrapper) {
        return _.reduce(PATHS, (acc, path) => acc + _.get(wrapper, path, []).length, 0);
      }

      function filterPolicyCollection(collection) {
        return _.filter(
          collection,
          p => !isMissingContentType(p) && !isMissingField(p) && !isMissingLocale(p)
        );
      }

      function isMissingContentType(p) {
        return isSpecific(p.contentType, CONFIG.ALL_CTS) && !hasContentType(p.contentType);
      }

      function isMissingField(p) {
        return (
          !!p.isPath && isSpecific(p.field, CONFIG.ALL_FIELDS) && !hasField(p.contentType, p.field)
        );
      }

      function isMissingLocale(p) {
        return !!p.isPath && isSpecific(p.locale, CONFIG.ALL_LOCALES) && !hasLocale(p.locale);
      }

      function isSpecific(value, allValue) {
        return _.isString(value) && value !== allValue;
      }

      function hasContentType(ctId) {
        return _.isObject(findCt(ctId));
      }

      function hasField(ctId, fieldId) {
        const ct = findCt(ctId);
        const fields = _.get(ct, 'fields', []);
        const field = _.find(fields, { apiName: fieldId }) || _.find(fields, { id: fieldId });
        return _.isObject(field);
      }

      function hasLocale(localeCode) {
        return _.isObject(_.find(locales, { code: localeCode }));
      }

      function findCt(ctId) {
        return _.find(contentTypes, { sys: { id: ctId } });
      }
    };
  }
]);
