'use strict';

describe('Webhook Headers directive', function () {
  beforeEach(function () {
    module('contentful/test');

    this.compile = function (headers) {
      const data = {headers: headers || [], isDirty: false};
      this.element = this.$compile('<cf-webhook-headers headers="headers" is-dirty="isDirty" />', data);
      this.scope = this.element.isolateScope();
    }.bind(this);

    this.enter = $.Event('keydown', {which: 13});
  });

  describe('initial state', function () {
    it('displays no rows for an empty headers hash', function () {
      this.compile();
      expect(this.element.find('.webhook-header__item').length).toBe(0);
    });

    it('displays rows when some headers are defined', function () {
      this.compile([{key: 'x', value: 'y'}, {key: 'z', value: 'v'}]);
      const items = this.element.find('.webhook-header__item');
      expect(items.length).toBe(2);
      expect(items.first().children().eq(1).text()).toBe('y');
    });
  });

  describe('"add" button', function () {
    beforeEach(function () {
      this.add = function () {
        return this.element.find('.webhook-new-header__actions > button');
      }.bind(this);
    });

    it('disables "add" button if there is no key', function () {
      this.compile();
      expect(this.add().get(0).disabled).toBe(true);
    });

    it('disables "add" button if there is no value', function () {
      this.compile();
      this.scope.model.fresh = {key: 'key'};
      this.$apply();
      expect(this.add().get(0).disabled).toBe(true);
    });

    it('enables "add" button if there are both key and value', function () {
      this.compile();
      this.scope.model.fresh = {key: 'x', value: 'y'};
      this.$apply();
      expect(this.add().get(0).disabled).toBe(false);
    });

    it('disabled "add" button if a key is already used', function () {
      this.compile([{key: 'x', value: 'test'}]);
      this.scope.model.fresh = {key: 'x', value: 'test2'};
      this.$apply();
      expect(this.add().get(0).disabled).toBe(true);
    });

    it('adds a key-value pair', function () {
      this.compile([{key: 'x', value: 'y'}]);
      this.scope.model.fresh = {key: 'z', value: 'v'};
      this.$apply();
      this.add().click();
      this.$apply();
      expect(_.keys(this.scope.headers).length).toBe(2);
      expect(this.scope.headers[0].key).toBe('x');
      expect(this.scope.headers[0].value).toBe('y');
      expect(this.scope.headers[1].key).toBe('z');
      expect(this.scope.headers[1].value).toBe('v');
    });

    it('adds with enter keystroke', function () {
      this.compile();
      this.scope.model.fresh = {key: 'x', value: 'y'};
      this.$apply();
      this.element.find('input').last().trigger(this.enter);
      this.$apply();
      expect(this.scope.headers[0].key).toBe('x');
      expect(this.scope.headers[0].value).toBe('y');
    });
  });

  describe('edit mode', function () {
    it('enters edit mode and shows input for a value', function () {
      this.compile([{key: 'test', value: 'some-val'}]);
      this.scope.edit(this.scope.headers[0]);
      this.$apply();
      expect(this.element.find('input').first().val()).toBe('some-val');
    });

    it('saves changes on enter keystroke', function () {
      this.compile([{key: 'test', value: 'some-val'}, {key: 'x', value: 'y'}]);
      this.scope.edit(this.scope.headers[0]);
      this.$apply();
      this.scope.model.existing.value = 'new-val';
      this.$apply();
      this.element.find('input').first().trigger(this.enter);
      this.$apply();
      expect(this.scope.headers[0].key).toBe('test');
      expect(this.scope.headers[0].value).toBe('new-val');
      expect(this.scope.headers.length).toBe(2);
    });
  });

  describe('"delete" button', function () {
    it('removes a pair from the list', function () {
      this.compile([{key: 'test', value: 'test'}]);
      const btn = this.element.find('.webhook-header__actions:eq(0) button:last-child');
      btn.click();
      this.$apply();
      expect(_.keys(this.scope.headers).length).toBe(0);
      expect(this.scope.headers.test).toBeUndefined();
    });
  });
});
