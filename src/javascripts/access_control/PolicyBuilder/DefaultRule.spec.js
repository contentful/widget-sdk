import _ from 'lodash';
import { DefaultRule } from './DefaultRule.es6';
import { PolicyBuilderConfig } from './PolicyBuilderConfig.es6';

describe('Policy Builder, default rule', () => {
  it('getting default rule for entry', () => {
    const rule = DefaultRule.getDefaultRuleFor('entry');
    expect(_.isString(rule.id)).toBe(true);
    expect(rule.contentType).toBe(PolicyBuilderConfig.ALL_CTS);
    expect(rule.action).toBe('all');
    expect(rule.scope).toBe('any');
    expect(rule.field).toBeNull();
    expect(rule.locale).toBeNull();
  });

  it('getting default rule for asset', () => {
    const rule = DefaultRule.getDefaultRuleFor('asset');
    expect(_.isString(rule.id)).toBe(true);
    expect(rule.contentType).toBeUndefined();
    expect(rule.action).toBe('all');
    expect(rule.scope).toBe('any');
    expect(rule.field).toBeUndefined();
    expect(rule.locale).toBeNull();
  });

  it('creates getter for default entry rule', () => {
    const getRule = DefaultRule.getDefaultRuleGetterFor('entry');
    expect(_.isFunction(getRule)).toBe(true);
    expect(_.isObject(getRule())).toBe(true);
    expect(getRule().contentType).toBe(PolicyBuilderConfig.ALL_CTS);
    expect(getRule().field).toBeNull();
  });

  it('creates getter for default asset rule', () => {
    const getRule = DefaultRule.getDefaultRuleGetterFor('asset');
    expect(_.isFunction(getRule)).toBe(true);
    expect(_.isObject(getRule())).toBe(true);
    expect(getRule().contentType).toBeUndefined();
    expect(getRule().field).toBeUndefined();
  });
});
