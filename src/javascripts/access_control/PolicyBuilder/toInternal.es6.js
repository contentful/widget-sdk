import _ from 'lodash';
import { PolicyBuilderConfig } from './PolicyBuilderConfig.es6';
import { DefaultRule } from './DefaultRule.es6';

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
  const rule = DefaultRule.getDefaultRuleFor(entityConstraint.value);
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
    rule.contentType = PolicyBuilderConfig.NO_CTS;
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
    value: index > -1 ? cs[index].paths[0].doc.split(PolicyBuilderConfig.PATH_SEPARATOR) : null
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
  return pathSegment(segment, PolicyBuilderConfig.ALL_FIELDS);
}

function localePathSegment(segment) {
  return pathSegment(segment, PolicyBuilderConfig.ALL_LOCALES);
}

function pathSegment(segment, allValue) {
  return segment === PolicyBuilderConfig.PATH_WILDCARD ? allValue : segment;
}

export function toInternal(external) {
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
}
