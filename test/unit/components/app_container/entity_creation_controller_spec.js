'use strict';

describe('EntityCreationController', function () {
  let stubs;

  afterEach(function () {
    stubs = null;
  });

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'computeUsage',
        'setSpaceContext',
        'enforcement',
        'track'
      ]);

      $provide.value('access_control/Enforcements', {
        getPeriodUsage: stubs.periodUsage,
        computeUsage: stubs.computeUsage,
        determineEnforcement: stubs.enforcement,
        setSpaceContext: stubs.setSpaceContext
      });
    });

    const cfStub = this.$inject('cfStub');
    const $controller = this.$inject('$controller');

    this.notification = this.mockService('notification');
    this.$q = this.$inject('$q');

    this.spaceContext = this.$inject('spaceContext');
    this.spaceContext.space = cfStub.space('test');

    this.$state = this.$inject('$state');
    this.$state.go = sinon.stub();

    this.entityCreationController = $controller('EntityCreationController');
  });

  describe('creates an entry', function () {
    let createStub;
    let contentType;
    beforeEach(inject(function (cfStub) {
      createStub = sinon.stub(this.spaceContext.space, 'createEntry').returns(this.$q.defer().promise);
      contentType = cfStub.contentType(this.spaceContext.space, 'thing', 'Thing');
    }));

    afterEach(function () {
      createStub.restore();
    });

    it('calls the space create method', function () {
      this.entityCreationController.newEntry(contentType);
      sinon.assert.called(createStub);
    });

    describe('creation fails', function () {
      beforeEach(function () {
        createStub.returns(this.$q.reject({
          body: {
            details: {
              reasons: []
            }
          }
        }));
        this.entityCreationController.newEntry(contentType);
        this.$apply();
      });

      it('determines enforcements', function () {
        sinon.assert.calledWith(stubs.enforcement, [], 'entry');
      });

      it('notifies of the error', function () {
        sinon.assert.called(this.notification.error);
      });
    });

    describe('creation suceeds', function () {
      beforeEach(function () {
        createStub.returns(this.$q.resolve({ getId: sinon.stub().returns('someEntryId') }));
        this.entityCreationController.newEntry(contentType);
        this.$apply();
      });

      it('navigates to editor', function () {
        sinon.assert.calledWith(this.$state.go, 'spaces.detail.entries.detail', {
          entryId: 'someEntryId'
        });
      });
    });
  });

  describe('creates an asset', function () {
    let createStub;
    beforeEach(function () {
      createStub = sinon.stub(this.spaceContext.space, 'createAsset').returns(this.$q.defer().promise);
    });

    afterEach(function () {
      createStub.restore();
    });

    it('calls the space create method', function () {
      this.entityCreationController.newAsset();
      sinon.assert.called(createStub);
    });

    describe('creation fails', function () {
      beforeEach(function () {
        createStub.returns(this.$q.reject({
          body: {
            details: {
              reasons: []
            }
          }
        }));
        this.entityCreationController.newAsset();
        this.$apply();
      });

      it('determines enforcements', function () {
        sinon.assert.calledWith(stubs.enforcement, [], 'asset');
      });

      it('notifies of the error', function () {
        sinon.assert.called(this.notification.error);
      });
    });

    describe('creation suceeds', function () {
      beforeEach(inject(function (cfStub) {
        createStub.returns(this.$q.resolve(cfStub.asset(this.spaceContext.space, 'someAssetId')));
        this.entityCreationController.newAsset();
        this.$apply();
      }));

      it('navigates to editor', function () {
        sinon.assert.calledWith(this.$state.go, 'spaces.detail.assets.detail', {
          assetId: 'someAssetId'
        });
      });
    });
  });

  describe('creates a content type', function () {
    beforeEach(function () {
      this.entityCreationController.newContentType();
      this.$apply();
    });

    it('navigates to editor', function () {
      sinon.assert.calledWith(this.$state.go, 'spaces.detail.content_types.new');
    });
  });

  describe('opens editor for new locale', function () {
    beforeEach(function () {
      stubs.computeUsage.returns(null);
      this.entityCreationController.newLocale();
    });

    it('computes the locale usage', function () {
      sinon.assert.calledWith(stubs.computeUsage, 'locale');
    });

    it('navigates to editor', function () {
      sinon.assert.calledWith(this.$state.go, 'spaces.detail.settings.locales.new');
    });
  });
});
