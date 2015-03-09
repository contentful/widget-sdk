'use strict';

describe('EntityCreationController', function () {
  var stubs;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'computeUsage',
        'setSpaceContext',
        'enforcement',
        'track'
      ]);

      $provide.value('enforcements', {
        getPeriodUsage: stubs.periodUsage,
        computeUsage: stubs.computeUsage,
        determineEnforcement: stubs.enforcement,
        setSpaceContext: stubs.setSpaceContext
      });

      $provide.value('analytics', {
        track: stubs.track
      });
    });
    inject(function ($injector, $controller, $rootScope, cfStub){
      this.notification = $injector.get('notification');
      this.$q = $injector.get('$q');
      this.scope = $rootScope.$new();

      var space = cfStub.space('test');
      var contentTypeData = cfStub.contentTypeData('testType');
      this.scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);

      this.entityCreationController = $controller('EntityCreationController', {$scope: this.scope});
    });
  });

  describe('creates an entry', function () {
    var createStub;
    var contentType;
    beforeEach(inject(function (cfStub) {
      createStub = sinon.stub(this.scope.spaceContext.space, 'createEntry').returns(this.$q.defer().promise);
      contentType = cfStub.contentType(this.scope.spaceContext.space, 'thing', 'Thing');
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
        this.scope.$apply();
      });

      it('determines enforcements', function () {
        sinon.assert.calledWith(stubs.enforcement, [], 'entry');
      });

      it('notifies of the error', function () {
        sinon.assert.called(this.notification.error);
      });

      it('tracks analytics', function () {
        sinon.assert.called(stubs.track);
      });
    });

    describe('creation suceeds', function () {
      var editorStub;
      beforeEach(function () {
        editorStub = sinon.stub();
        editorStub.returns({goTo: sinon.stub()});
        this.scope.navigator = {
          entryEditor: editorStub
        };
        createStub.returns(this.$q.when({}));
        this.entityCreationController.newEntry(contentType);
        this.scope.$apply();
      });

      it('navigates to editor', function () {
        sinon.assert.called(editorStub);
      });

      it('tracks analytics', function () {
        sinon.assert.called(stubs.track);
      });
    });
  });

  describe('creates an asset', function () {
    var createStub;
    beforeEach(function () {
      createStub = sinon.stub(this.scope.spaceContext.space, 'createAsset').returns(this.$q.defer().promise);
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
        this.scope.$apply();
      });

      it('determines enforcements', function () {
        sinon.assert.calledWith(stubs.enforcement, [], 'asset');
      });

      it('notifies of the error', function () {
        sinon.assert.called(this.notification.error);
      });

      it('tracks analytics', function () {
        sinon.assert.called(stubs.track);
      });
    });

    describe('creation suceeds', function () {
      var editorStub;
      beforeEach(inject(function (cfStub) {
        editorStub = sinon.stub();
        editorStub.returns({goTo: sinon.stub()});
        this.scope.navigator = {
          assetEditor: editorStub
        };
        createStub.returns(this.$q.when(cfStub.asset(this.scope.spaceContext.space, 'image')));
        this.entityCreationController.newAsset();
        this.scope.$apply();
      }));

      it('navigates to editor', function () {
        sinon.assert.called(editorStub);
      });

      it('tracks analytics', function () {
        sinon.assert.called(stubs.track);
      });
    });
  });

  describe('creates a content type', function () {
    var createStub;
    beforeEach(function () {
      createStub = sinon.stub(this.scope.spaceContext.space, 'createContentType').returns(this.$q.defer().promise);
    });

    afterEach(function () {
      createStub.restore();
    });

    it('calls the space create method', function () {
      this.entityCreationController.newContentType();
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
        this.entityCreationController.newContentType();
        this.scope.$apply();
      });

      it('determines enforcements', function () {
        sinon.assert.calledWith(stubs.enforcement, [], 'contentType');
      });

      it('notifies of the error', function () {
        sinon.assert.called(this.notification.error);
      });

      it('tracks analytics', function () {
        sinon.assert.called(stubs.track);
      });
    });

    describe('creation suceeds', function () {
      var editorStub;
      beforeEach(function () {
        editorStub = sinon.stub();
        editorStub.returns({goTo: sinon.stub()});
        this.scope.navigator = {
          contentTypeEditor: editorStub
        };
        createStub.returns(this.$q.when({}));
        this.entityCreationController.newContentType();
        this.scope.$apply();
      });

      it('navigates to editor', function () {
        sinon.assert.called(editorStub);
      });

      it('tracks analytics', function () {
        sinon.assert.called(stubs.track);
      });
    });
  });

  describe('creates an api key', function () {
    var createStub;
    beforeEach(function () {
      createStub = sinon.stub(this.scope.spaceContext.space, 'newDeliveryApiKey');
    });

    afterEach(function () {
      createStub.restore();
    });

    describe('creation fails', function () {
      beforeEach(function () {
        stubs.computeUsage.returns({});
        this.entityCreationController.newApiKey();
      });

      it('computes the api key usage', function () {
        sinon.assert.calledWith(stubs.computeUsage, 'apiKey');
      });

      it('notifies of the error', function () {
        sinon.assert.called(this.notification.error);
      });
    });

    describe('creation suceeds', function () {
      var editorStub;
      beforeEach(function () {
        editorStub = sinon.stub();
        editorStub.returns({openAndGoTo: sinon.stub()});
        this.scope.navigator = {
          apiKeyEditor: editorStub
        };
        stubs.computeUsage.returns(null);
        this.entityCreationController.newApiKey();
      });

      it('computes the api key usage', function () {
        sinon.assert.calledWith(stubs.computeUsage, 'apiKey');
      });

      it('calls the space create method', function () {
        sinon.assert.called(createStub);
      });

      it('navigates to editor', function () {
        sinon.assert.called(editorStub);
      });

      it('tracks analytics', function () {
        sinon.assert.called(stubs.track);
      });
    });
  });


});
