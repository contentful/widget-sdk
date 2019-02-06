import _ from 'lodash';
import { PolicyBuilderConfig } from './PolicyBuilderConfig.es6';
import { capitalize } from 'utils/StringUtils.es6';

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
  if (ct === PolicyBuilderConfig.ALL_CTS || !_.isString(ct)) {
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
  return segment(prop, PolicyBuilderConfig.ALL_FIELDS);
}

function localeSegment(prop) {
  return segment(prop, PolicyBuilderConfig.ALL_LOCALES);
}

function segment(prop, allValue) {
  return prop === allValue || !prop ? PolicyBuilderConfig.PATH_WILDCARD : prop;
}

function pushConstraint(pair, constraint) {
  pair.result.constraint.and = pair.result.constraint.and || [];
  pair.result.constraint.and.push(constraint);
}

function eq(prop, value) {
  return { equals: [{ doc: prop }, value] };
}

function paths(segments) {
  return { paths: [{ doc: segments.join(PolicyBuilderConfig.PATH_SEPARATOR) }] };
}

export function toExternal(internal) {
  return {
    sys: _.pick(internal, ['id', 'version']),
    name: internal.name,
    description: internal.description,
    policies: translatePolicies(internal),
    permissions: _.pick(internal, ['contentModel', 'contentDelivery', 'settings', 'environments'])
  };
}
