'use strict';

describe('Policy Builder, default rule', () => {
  let getDefaultRuleFor, getDefaultRuleGetterFor, CONFIG;

  beforeEach(function() {
    module('contentful/test');
    getDefaultRuleFor = this.$inject('PolicyBuilder/defaultRule').getDefaultRuleFor;
    getDefaultRuleGetterFor = this.$inject('PolicyBuilder/defaultRule').getDefaultRuleGetterFor;
    CONFIG = this.$inject('PolicyBuilder/CONFIG');
  });

  it('getting default rule for entry', () => {
    const rule = getDefaultRuleFor('entry');
    expect(_.isString(rule.id)).toBe(true);
    expect(rule.contentType).toBe(CONFIG.ALL_CTS);
    expect(rule.action).toBe('all');
    expect(rule.scope).toBe('any');
    expect(rule.field).toBe(null);
    expect(rule.locale).toBe(null);
  });

  it('getting default rule for asset', () => {
    const rule = getDefaultRuleFor('asset');
    expect(_.isString(rule.id)).toBe(true);
    expect(rule.contentType).toBe(undefined);
    expect(rule.action).toBe('all');
    expect(rule.scope).toBe('any');
    expect(rule.field).toBe(undefined);
    expect(rule.locale).toBe(null);
  });

  it('creates getter for default entry rule', () => {
    const getRule = getDefaultRuleGetterFor('entry');
    expect(_.isFunction(getRule)).toBe(true);
    expect(_.isObject(getRule())).toBe(true);
    expect(getRule().contentType).toBe(CONFIG.ALL_CTS);
    expect(getRule().field).toBe(null);
  });

  it('creates getter for default asset rule', () => {
    const getRule = getDefaultRuleGetterFor('asset');
    expect(_.isFunction(getRule)).toBe(true);
    expect(_.isObject(getRule())).toBe(true);
    expect(getRule().contentType).toBe(undefined);
    expect(getRule().field).toBe(undefined);
  });
});
