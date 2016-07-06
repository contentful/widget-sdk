'use strict';

describe('widgets/store', function () {
  var Store;

  beforeEach(function () {
    module('contentful/test');
    Store = this.$inject('widgets/store');
  });

  afterEach(function () {
    Store = null;
  });

  describe('#getMap()', function () {
    pit('returns an object including the builtin widgets', function () {
      var builtin = this.$inject('widgets/builtin');
      var builtinIds = _.keys(builtin);
      var store = Store.create(makeSpaceStub());
      return store.getMap()
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
      var store = Store.create(makeSpaceStub([custom]));

      return store.getMap().then(function (widgets) {
        var processed = widgets['CUSTOM'];
        expect(processed.sidebar).toEqual('SIDEBAR');
        expect(processed.src).toEqual('SRC');
        expect(processed.name).toEqual('NAME');
        expect(processed.template).toEqual('<cf-iframe-widget>');
        expect(processed.fieldTypes).toEqual(['Assets']);
      });
    });

    pit('returns only builtins if response fails', function () {
      var store = Store.create({
        endpoint: sinon.stub().returns({
          get: sinon.stub().rejects()
        })
      });
      var builtin = this.$inject('widgets/builtin');
      return store.getMap()
      .then(function (widgets) {
        expect(widgets).toEqual(builtin);
      });
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
