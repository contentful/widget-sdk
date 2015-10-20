'use strict';

describe('widgets/store', function () {
  var Store;

  beforeEach(function () {
    module('contentful/test');
    Store = this.$inject('widgets/store');
    Store.setSpace(makeSpaceStub());
  });

  describe('#getMap()', function () {
    pit('returns an object including the builtin widgets', function () {
      var builtin = this.$inject('widgets/builtin');
      var builtinIds = _.keys(builtin);
      return Store.getMap()
      .then(function (widgets) {
        var widgetIds = _.keys(widgets);
        expect(widgetIds).toEqual(builtinIds);
      });
    });

    pit('includes processed widgets from API', function () {
      var custom = {
        sys: {id: 'CUSTOM'},
        widget: {
          name: 'NAME',
          src: 'SRC',
          sidebar: 'SIDEBAR',
          fieldTypes: [{type: 'Array', items: {type: 'Link', linkType: 'Asset'}}]
        }
      };

      Store.setSpace(makeSpaceStub([custom]));
      return Store.getMap().then(function (widgets) {
        var processed = widgets['CUSTOM'];
        expect(processed.sidebar).toEqual('SIDEBAR');
        expect(processed.src).toEqual('SRC');
        expect(processed.name).toEqual('NAME');
        expect(processed.template).toEqual('<cf-iframe-widget>');
        expect(processed.fieldTypes).toEqual(['Assets']);
      });
    });

    pit('returns the same object on multiple calls', function () {
      return Store.getMap()
      .then(function (widgets1) {
        return Store.getMap().then(function (widgets2) {
          expect(widgets1).toBe(widgets2);
        });
      });
    });

    pit('invalidates cache if space is reset', function () {
      return Store.getMap()
      .then(function (widgets1) {
        Store.setSpace(makeSpaceStub());
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

  function makeSpaceStub (widgets) {
    return {
      endpoint: sinon.stub().returns({
        get: sinon.stub().resolves({items: widgets || []})
      })
    };
  }
});
