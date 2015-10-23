'use strict';

describe('widgets/store', function () {
  var Store;

  beforeEach(function () {
    module('contentful/test');
    Store = this.$inject('widgets/store');
  });

  describe('#getMap()', function () {
    pit('returns an object including the builtin widgets', function () {
      var builtin = this.$inject('widgets/builtin');
      var builtinIds = _.keys(builtin);
      Store.setSpace({});
      return Store.getMap()
      .then(function (widgets) {
        var widgetIds = _.keys(widgets);
        expect(widgetIds).toEqual(builtinIds);
      });
    });

    pit('caches the object', function () {
      Store.setSpace({});
      return Store.getMap()
      .then(function (widgets1) {
        return Store.getMap().then(function (widgets2) {
          expect(widgets1).toBe(widgets2);
        });
      });
    });

    pit('invalidates cache if space is reset', function () {
      Store.setSpace({});
      return Store.getMap()
      .then(function (widgets1) {
        Store.setSpace({});
        return Store.getMap().then(function (widgets2) {
          expect(widgets1).not.toBe(widgets2);
        });
      });
    });

    it('rejects the promise if there is no space', function (done) {
      Store.setSpace(null);
      Store.getMap()
      .catch(function () {
        done();
      });
      this.$apply();
    });
  });
});
