import { PolicyBuilderConfig } from './PolicyBuilderConfig';
import { extend } from 'lodash';
import * as random from 'utils/Random';

const DEFAULT_RULE = {
  action: 'all',
  scope: 'any',
  locale: null
};

const DEFAULT_ENTRY_RULE = {
  contentType: PolicyBuilderConfig.ALL_CTS,
  field: null
};

function getDefaultRuleGetterFor(entity) {
  return () => getDefaultRuleFor(entity);
}

function getDefaultRuleFor(entity) {
  entity = entity.toLowerCase();
  const meta = { id: random.id(), entity };
  const base = extend(meta, DEFAULT_RULE);

  if (entity === 'entry') {
    return extend(base, DEFAULT_ENTRY_RULE);
  } else {
    return base;
  }
}

export const DefaultRule = {
  getDefaultRuleFor,
  getDefaultRuleGetterFor
};
