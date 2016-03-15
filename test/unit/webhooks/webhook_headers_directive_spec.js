'use strict';

describe('Webhook Headers directive', function () {

  beforeEach(function () {
    module('contentful/test');

    this.compile = function (headers) {
      var data = {headers: headers || {}};
      this.element = this.$compile('<cf-webhook-headers headers="headers" />', data);
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
      this.compile({x: 'y', z: 'v'});
      var items = this.element.find('.webhook-header__item');
      expect(items.length).toBe(2);
      expect(items.first().children().eq(1).text()).toBe('y');
    });
  });

  describe('"add" button', function () {
    beforeEach(function() {
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
      this.scope.model.fresh = {name: 'key'};
      this.$apply();
      expect(this.add().get(0).disabled).toBe(true);
    });

    it('enables "add" button if there are both key and value', function () {
      this.compile();
      this.scope.model.fresh = {name: 'x', value: 'y'};
      this.$apply();
      expect(this.add().get(0).disabled).toBe(false);
    });

    it('disabled "add" button if a key is already used', function () {
      this.compile({x: 'test'});
      this.scope.model.fresh = {name: 'x', value: 'test2'};
      this.$apply();
      expect(this.add().get(0).disabled).toBe(true);
    });

    it('adds a key-value pair', function () {
      this.compile({x: 'y'});
      this.scope.model.fresh = {name: 'z', value: 'v'};
      this.$apply();
      this.add().click();
      this.$apply();
      expect(_.keys(this.scope.headers).length).toBe(2);
      expect(this.scope.headers.x).toBe('y');
      expect(this.scope.headers.z).toBe('v');
    });

    it('adds with enter keystroke', function () {
      this.compile();
      this.scope.model.fresh = {name: 'x', value: 'y'};
      this.$apply();
      this.element.find('input').last().trigger(this.enter);
      this.$apply();
      expect(this.scope.headers.x).toBe('y');
    });
  });

  describe('edit mode', function () {
    it('enters edit mode and shows input for a value', function () {
      this.compile({test: 'some-val'});
      this.scope.edit('test');
      this.$apply();
      expect(this.element.find('input').first().val()).toBe('some-val');
    });

    it('saves changes on enter keystroke', function () {
      this.compile({test: 'some-val'});
      this.scope.edit('test');
      this.$apply();
      this.scope.model.existing.value = 'new-val';
      this.$apply();
      this.element.find('input').first().trigger(this.enter);
      this.$apply();
      expect(this.scope.headers.test).toBe('new-val');
    });
  });

  describe('"delete" button', function () {
    it('removes a pair from the list', function () {
      this.compile({test: 'test'});
      var btn = this.element.find('.webhook-header__actions:eq(0) button:last-child');
      btn.click();
      this.$apply();
      expect(_.keys(this.scope.headers).length).toBe(0);
      expect(this.scope.headers.test).toBeUndefined();
    });
  });
});
