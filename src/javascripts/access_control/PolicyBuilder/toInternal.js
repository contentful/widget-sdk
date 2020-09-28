import _ from 'lodash';
import { PolicyBuilderConfig } from './PolicyBuilderConfig';
import { DefaultRule } from './DefaultRule';

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
    uiCompatible: true,
    metadataTagRuleExists: false, // TODO: remove this flag when the new web ui for metadata tag rules is implemented
  };

  _(prepare(external)).map(extendPolicyWithRule).forEach(prepareExtension);

  return extension;

  function prepareExtension(p) {
    if (!p.action || !p.entityCollection || !p.effectCollection || !p.rule) {
      extension.uiCompatible = false;
    } else {
      const rule = _.extend(p.rule, { action: p.action });
      extension[p.entityCollection][p.effectCollection].push(rule);

      // TODO: remove this flag when the new web ui for metadata tag rules is implemented
      if (rule.metadataTagRulesExist) {
        extension.metadataTagRuleExists = true;
      }
    }
  }
}

function prepare(external) {
  return _.map(external.policies, (policy) => ({
    action: extractAction(policy),
    effectCollection: { allow: 'allowed', deny: 'denied' }[policy.effect],
    constraints: extractConstraints(policy),
  }));
}

function extendPolicyWithRule(policy) {
  const rule = createRule(policy);

  return _.extend(policy, {
    rule,
    entityCollection: { entry: 'entries', asset: 'assets' }[(rule || {}).entity],
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
    return Array.isArray(as) && as.length === n;
  }
  function containsBoth(s1, s2) {
    return as.indexOf(s1) > -1 && as.indexOf(s2) > -1;
  }
}

function extractConstraints(policy) {
  if (Array.isArray(policy.constraint)) {
    return policy.constraint;
  } else if (_.isObject(policy.constraint) && Array.isArray(policy.constraint.and)) {
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
    rule.entityId = idConstraint.value;
    rule.scope = 'entityId';
    rest.splice(idConstraint.index, 1);
  }

  // 4. find matching metadata tag id
  const metadataTagIdConstraint = findMetadataTagConstraint(rest, 'metadata.tags.sys.id');
  if (metadataTagIdConstraint.value) {
    rule.metadataTagRulesExist = true;
    rule.metadataTagId = metadataTagIdConstraint.value; // value can be a list of tag ids or tag types
    rule.scope = 'metadataTagId';
    rest.splice(metadataTagIdConstraint.index, 1);
  }

  // 5. find matching metadata tag type
  const metadataTagTypeConstraint = findMetadataTagConstraint(rest, 'metadata.tags.sys.tagType');
  if (metadataTagTypeConstraint.value) {
    rule.metadataTagRulesExist = true;
    rule.metadataTagType = metadataTagTypeConstraint.value; // value can be a list of tag ids or tag types
    rule.scope = 'metadataTagType';
    rest.splice(metadataTagTypeConstraint.index, 1);
  }

  // 6. find scope
  const userConstraint = findUserConstraint(rest);
  if (userConstraint.value) {
    rule.scope = _.isString(userConstraint.value) ? 'user' : 'any';
    rest.splice(userConstraint.index, 1);
  }

  // 7. find path
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
    _.findIndex(cs, (c) => docEq(c, 'sys.type') && _.includes(['Entry', 'Asset'], c.equals[1]))
  );
}

function findAssetConstraint(cs) {
  return searchResult(
    cs,
    cs.findIndex((c) => docEq(c, 'sys.type') && _.includes(['Asset'], c.equals[1]))
  );
}

function findEntryConstraint(cs) {
  return searchResult(
    cs,
    cs.findIndex((c) => docEq(c, 'sys.type') && _.includes(['Entry'], c.equals[1]))
  );
}

function findContentTypeConstraint(cs) {
  return searchResult(
    cs,
    cs.findIndex((c) => docEq(c, 'sys.contentType.sys.id') && _.isString(c.equals[1]))
  );
}

function findIdConstraint(cs) {
  return searchResult(
    cs,
    cs.findIndex((c) => docEq(c, 'sys.id') && _.isString(c.equals[1]))
  );
}

function findMetadataTagConstraint(cs, doc) {
  return searchResultCollection(
    cs,
    cs.findIndex((c) => {
      // support more constraint types
      const constraint = c.in || c.all || c.equals;
      return docMatch(constraint, doc) && Array.isArray(constraint[1]);
    })
  );
}

function findUserConstraint(cs) {
  return searchResult(
    cs,
    cs.findIndex((c) => docEq(c, 'sys.createdBy.sys.id') && _.isString(c.equals[1]))
  );
}

function findPathConstraint(cs) {
  const index = cs.findIndex(
    (c) => Array.isArray(c.paths) && _.isObject(c.paths[0]) && _.isString(c.paths[0].doc)
  );

  return {
    index,
    value: index > -1 ? cs[index].paths[0].doc.split(PolicyBuilderConfig.PATH_SEPARATOR) : null,
  };
}

function docEq(c, val) {
  return Array.isArray(c.equals) && _.isObject(c.equals[0]) && c.equals[0].doc === val;
}

function docMatch(constraint, val) {
  return Array.isArray(constraint) && _.isObject(constraint[0]) && constraint[0].doc === val;
}

function searchResult(cs, index) {
  return {
    index,
    value: index > -1 ? cs[index].equals[1] : null,
  };
}

function searchResultCollection(cs, index) {
  let value = null;

  if (index > -1) {
    // support more constraint types
    value = (cs[index].in || cs[index].all || cs[index].equals)[1];
  }

  return {
    index,
    value,
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

export function findEntryIds(external) {
  return external
    .filter((policy) => findEntryConstraint(extractConstraints(policy)).index !== -1)
    .map(extractConstraints)
    .reduce((acc, val) => acc.concat(val), [])
    .filter((constraint) => constraint.equals && constraint.equals[0].doc === 'sys.id')
    .map((constraint) => constraint.equals[1]);
}

export function findAssetIds(external) {
  return external
    .filter((policy) => findAssetConstraint(extractConstraints(policy)).index !== -1)
    .map(extractConstraints)
    .reduce((acc, val) => acc.concat(val), [])
    .filter((constraint) => constraint.equals && constraint.equals[0].doc === 'sys.id')
    .map((constraint) => constraint.equals[1]);
}

export function toInternal(external) {
  return _.extend(
    {
      id: _.get(external, 'sys.id', null),
      version: _.get(external, 'sys.version', null),
      name: external.name,
      description: external.description,
    },
    _.cloneDeep(external.permissions) || {},
    translatePolicies(external)
  );
}
