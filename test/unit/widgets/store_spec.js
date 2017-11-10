import createMockEndpoint from 'helpers/mocks/SpaceEndpoint';

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
    it('returns an object including the builtin widgets', function* () {
      const builtin = this.$inject('widgets/builtin');
      const builtinIds = _.keys(builtin);
      const endpoint = createMockEndpoint();
      const store = Store.create(endpoint.request);
      const widgets = yield store.getMap();
      const widgetIds = _.keys(widgets);
      expect(widgetIds).toEqual(builtinIds);
    });

    it('includes processed widgets from API', function* () {
      const endpoint = createMockEndpoint();
      endpoint.stores.extensions['CUSTOM'] = {
        sys: {id: 'CUSTOM'},
        widget: {
          name: 'NAME',
          src: 'SRC',
          sidebar: 'SIDEBAR',
          fieldTypes: [{type: 'Array', items: {type: 'Link', linkType: 'Asset'}}]
        }
      };
      const store = Store.create(endpoint.request);

      const widgets = yield store.getMap();
      const processed = widgets['CUSTOM'];
      expect(processed.sidebar).toEqual('SIDEBAR');
      expect(processed.src).toEqual('SRC');
      expect(processed.name).toEqual('NAME');
      expect(processed.template).toEqual('<cf-iframe-widget>');
      expect(processed.fieldTypes).toEqual(['Assets']);
    });

    it('returns only builtins if response fails', function* () {
      const endpoint = sinon.stub().rejects();
      const store = Store.create(endpoint);
      const builtin = this.$inject('widgets/builtin');
      const widgets = yield store.getMap();
      expect(widgets).toEqual(builtin);
    });
  });
});
