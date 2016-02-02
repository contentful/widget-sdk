'use strict';

describe('Policy Builder, default rule', function () {

  var getDefaultRuleFor, getDefaultRuleGetterFor;

  beforeEach(function () {
    module('contentful/test');
    getDefaultRuleFor = this.$inject('PolicyBuilder/defaultRule').getDefaultRuleFor;
    getDefaultRuleGetterFor = this.$inject('PolicyBuilder/defaultRule').getDefaultRuleGetterFor;
  });

  it('getting default rule for entry', function () {
    var rule = getDefaultRuleFor('entry');
    expect(_.isString(rule.id)).toBe(true);
    expect(rule.contentType).toBe('all');
    expect(rule.action).toBe('all');
    expect(rule.scope).toBe('any');
    expect(rule.field).toBe(null);
    expect(rule.locale).toBe(null);
  });

  it('getting default rule for asset', function () {
    var rule = getDefaultRuleFor('asset');
    expect(_.isString(rule.id)).toBe(true);
    expect(rule.contentType).toBe(undefined);
    expect(rule.action).toBe('all');
    expect(rule.scope).toBe('any');
    expect(rule.field).toBe(undefined);
    expect(rule.locale).toBe(null);
  });

  it('creates getter for default entry rule', function () {
    var getRule = getDefaultRuleGetterFor('entry');
    expect(_.isFunction(getRule)).toBe(true);
    expect(_.isObject(getRule())).toBe(true);
    expect(getRule().contentType).toBe('all');
    expect(getRule().field).toBe(null);
  });

  it('creates getter for default asset rule', function () {
    var getRule = getDefaultRuleGetterFor('asset');
    expect(_.isFunction(getRule)).toBe(true);
    expect(_.isObject(getRule())).toBe(true);
    expect(getRule().contentType).toBe(undefined);
    expect(getRule().field).toBe(undefined);
  });
});
