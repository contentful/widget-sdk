'use strict';

describe('widgets/store', function () {
  let Store;

  beforeEach(function () {
    module('contentful/test');
    Store = this.$inject('widgets/store');
  });

  afterEach(function () {
    Store = null;
  });

  describe('#getMap()', function () {
    pit('returns an object including the builtin widgets', function () {
      const builtin = this.$inject('widgets/builtin');
      const builtinIds = _.keys(builtin);
      const store = Store.create(makeSpaceStub());
      return store.getMap()
      .then(function (widgets) {
        const widgetIds = _.keys(widgets);
        expect(widgetIds).toEqual(builtinIds);
      });
    });

    pit('includes processed widgets from API', function () {
      const custom = {
        sys: {id: 'CUSTOM'},
        widget: {
          name: 'NAME',
          src: 'SRC',
          sidebar: 'SIDEBAR',
          fieldTypes: [{type: 'Array', items: {type: 'Link', linkType: 'Asset'}}]
        }
      };
      const store = Store.create(makeSpaceStub([custom]));

      return store.getMap().then(function (widgets) {
        const processed = widgets['CUSTOM'];
        expect(processed.sidebar).toEqual('SIDEBAR');
        expect(processed.src).toEqual('SRC');
        expect(processed.name).toEqual('NAME');
        expect(processed.template).toEqual('<cf-iframe-widget>');
        expect(processed.fieldTypes).toEqual(['Assets']);
      });
    });

    pit('returns only builtins if response fails', function () {
      const store = Store.create({
        endpoint: sinon.stub().returns({
          get: sinon.stub().rejects()
        })
      });
      const builtin = this.$inject('widgets/builtin');
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
