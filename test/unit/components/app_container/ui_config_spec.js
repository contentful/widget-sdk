'use strict';

describe('uiConfig service', function () {

  var config;

  beforeEach(function () {
    module('contentful/test');
    this.$rootScope = this.$inject('$rootScope');
    this.uiConfig = this.$inject('uiConfig');
    this.cfStub = this.$inject('cfStub');
    this.$rootScope.$apply();

    var space = this.cfStub.space('test');
    var contentTypeData = this.cfStub.contentTypeData('testType');
    this.spaceContext = this.cfStub.spaceContext(space, [contentTypeData]);

    config = {
      entryListViews: [{}],
      assetListViews: [{}]
    };

    this.initUiConfig = function (configIsDefined) {
      if (configIsDefined) {
        this.spaceContext.space.getUIConfig = sinon.stub().resolves(config);
      } else {
        var err = { statusCode: 404 };
        this.spaceContext.space.getUIConfig = sinon.stub().rejects(err);
      }
      this.loadPromise = this.uiConfig.load();
    };
  });

  describe('#load', function () {
    it('calls getUIConfig method', function () {
      this.initUiConfig(true);
      sinon.assert.calledOnce(this.spaceContext.space.getUIConfig);
    });

    pit('returns config if available', function () {
      this.initUiConfig(true);
      return this.loadPromise.then(function (val) {
        expect(val).toBe(config);
      });
    });

    pit('resolves to empty object if server returns 404', function () {
      this.initUiConfig(false);
      return this.loadPromise.then(function (val) {
        expect(val).toEqual({});
      });
    });

    pit('rejects if non-404 server error', function () {
      var err = { statusCode: 502 };
      this.spaceContext.space.getUIConfig = sinon.stub().rejects(err);
      this.loadPromise = this.uiConfig.load();

      return this.loadPromise.catch(function (val) {
        expect(val).toBe(err);
      });
    });
  });

  describe('#resetEntries', function () {
    it('returns defaults', function () {
      this.initUiConfig();
      expect(this.uiConfig.resetEntries().length).toBe(3);
    });
  });

  describe('#resetAssets', function () {
    it('returns defaults', function () {
      this.initUiConfig();
      expect(this.uiConfig.resetAssets().length).toBe(3);
    });
  });

  describe('#save', function () {
    it('calls setUIConfig method', function () {
      this.initUiConfig(true);
      this.spaceContext.space.setUIConfig = sinon.stub().resolves();
      this.loadPromise = this.uiConfig.save();
      sinon.assert.calledOnce(this.spaceContext.space.setUIConfig);
    });

  });

  describe('#addNewCt', function () {
    beforeEach(function () {
      this.spaceContext.space.setUIConfig = sinon.stub().resolves();
    });
    describe('no config defined', function () {
      it('does nothing', function () {
        var contentType = { foo: '' };

        this.initUiConfig(false);
        this.uiConfig.addNewCt(contentType);
        sinon.assert.notCalled(this.spaceContext.space.setUIConfig);
      });
    });

    describe('config is defined', function () {
      it('does nothing if there is no `Content Type` folder', function () {
        var contentType = { foo: '' };
        this.initUiConfig(true);
        this.uiConfig.addNewCt(contentType);
        sinon.assert.notCalled(this.spaceContext.space.setUIConfig);
      });

      describe('there is a `Content Type` folder', function () {
        var contentType;
        beforeEach(function () {
          config = {
            entryListViews: [
              {
                title: 'Content Type',
                views: []
              }
            ]
          };
          var ctData = this.cfStub.contentTypeData('testType');
          contentType = {
            data: ctData,
            getId: _.constant(ctData.sys.id)
          };

          this.spaceContext.space.getUIConfig = sinon.stub().resolves(config);
          this.loadPromise = this.uiConfig.load();
          this.$rootScope.$apply();
          this.uiConfig.addNewCt(contentType);
        });

        it('setUIConfig is called', function () {
          sinon.assert.calledOnce(this.spaceContext.space.setUIConfig);
        });

        it('updates views', function () {
          return this.loadPromise.then(function (val) {
            expect(_.first(val.entryListViews).views.length).toBe(1);
          });
        });
      });
    });
  });
});
