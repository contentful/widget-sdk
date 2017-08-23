import * as sinon from 'helpers/sinon';

describe('data/UiConfig/Store', function () {

  let uiConfig, stubs;

  beforeEach(function () {

    stubs = {
      config: sinon.stub(),
      spaceContext: {
        getData: sinon.stub(),
        space: {
          getUIConfig: sinon.stub(),
          setUIConfig: sinon.stub(),
          isAdmin: sinon.stub()
        }
      }
    };

    module('contentful/test', function ($provide) {
      $provide.value('spaceContext', stubs.spaceContext);
    });

    const createUiConfigStore = this.$inject('data/UiConfig/Store').default;
    uiConfig = createUiConfigStore(stubs.spaceContext);
  });

  describe('#load', function () {
    let config;
    beforeEach(function () {
      config = {
        entryListViews: [{}]
      };
      stubs.spaceContext.space.getUIConfig.resolves(config);
    });

    it('calls getUIConfig method', function () {
      uiConfig.load();
      sinon.assert.calledOnce(stubs.spaceContext.space.getUIConfig);
    });

    it('returns config if available', function* () {
      const val = yield uiConfig.load();
      expect(val).toBe(config);
    });

    it('resolves to empty object if server returns 404', function* () {
      stubs.spaceContext.space.getUIConfig.rejects({statusCode: 404});
      const result = yield uiConfig.load();
      expect(result).toEqual({});
    });

    it('rejects if non-404 server error', function* () {
      stubs.spaceContext.space.getUIConfig.rejects({ statusCode: 502 });
      const error = yield uiConfig.load().catch((e) => e);
      expect(error).toEqual({ statusCode: 502 });
    });
  });

  describe('#resetEntries', function () {
    it('returns defaults', function () {
      expect(uiConfig.resetEntries().length).toBe(3);
    });
  });

  describe('#resetAssets', function () {
    it('returns defaults', function () {
      expect(uiConfig.resetAssets().length).toBe(3);
    });
  });

  describe('#save', function () {
    it('calls setUIConfig method', function () {
      const newConfig = { name: 'new' };
      stubs.spaceContext.space.getUIConfig.resolves({ name: 'old' });
      stubs.spaceContext.space.setUIConfig.resolves();
      uiConfig.load();
      uiConfig.save(newConfig);
      sinon.assert.calledWith(stubs.spaceContext.space.setUIConfig, newConfig);
    });
  });


  describe('#addOrEditCt', function () {

    let mockCt;

    beforeEach(function () {
      mockCt = {
        data: {
          name: 'bar'
        },
        getId: _.constant(1)
      };
    });

    it('does nothing if config is not defined', function () {
      const newConfig = { name: 'new' };
      stubs.spaceContext.space.getUIConfig.rejects({statusCode: 404});
      stubs.spaceContext.space.setUIConfig.resolves();
      uiConfig.load();
      this.$apply();
      uiConfig.addOrEditCt(newConfig);
      sinon.assert.notCalled(stubs.spaceContext.space.setUIConfig);
    });

    it('does nothing if there is no `Content Type` folder', function () {
      const config = {
        entryListViews: [{ title: 'foo' }]
      };
      stubs.spaceContext.space.getUIConfig.resolves(config);
      uiConfig.load();
      this.$apply();
      uiConfig.addOrEditCt(mockCt);
      sinon.assert.notCalled(stubs.spaceContext.space.setUIConfig);
    });

    it('adds content type if it doesn\'t exist', function () {
      const config = {
        entryListViews: [{
          title: 'Content Type',
          views: [{
            title: 'foo',
            contentTypeId: 2
          }]
        }]
      };

      stubs.spaceContext.space.getUIConfig.resolves(config);
      stubs.spaceContext.space.setUIConfig.resolves();

      uiConfig.load();
      this.$apply();
      uiConfig.addOrEditCt(mockCt);
      sinon.assert.calledOnce(stubs.spaceContext.space.setUIConfig);
      uiConfig.load().then(function (currentConfig) {
        expect(currentConfig.entryListViews.length).toBe(2);
      });
    });

    it('edits view title when existing Content Type is changed', function () {
      const config = {
        entryListViews: [{
          title: 'Content Type',
          views: [{
            title: 'foo',
            contentTypeId: 2
          }]
        }]
      };
      mockCt.data.getId = _.constant(2);

      stubs.spaceContext.space.getUIConfig.resolves(config);
      stubs.spaceContext.space.setUIConfig.resolves();

      uiConfig.load();
      this.$apply();
      uiConfig.addOrEditCt(mockCt);
      sinon.assert.calledOnce(stubs.spaceContext.space.setUIConfig);
      uiConfig.load().then(function (currentConfig) {
        expect(currentConfig.entryListViews.length).toBe(1);
      });
    });
  });
});
