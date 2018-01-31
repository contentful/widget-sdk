'use strict';

describe('entityCreator', function () {
  let stubs;

  afterEach(function () {
    stubs = null;
  });

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'computeUsage',
        'enforcement',
        'track'
      ]);

      $provide.value('access_control/Enforcements', {
        computeUsageForOrganization: stubs.computeUsage,
        determineEnforcement: stubs.enforcement
      });
    });

    const cfStub = this.$inject('cfStub');

    this.notification = this.mockService('notification');
    this.$q = this.$inject('$q');

    this.spaceContext = this.$inject('spaceContext');
    this.spaceContext.space = cfStub.space('test');

    this.entityCreator = this.$inject('entityCreator');
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
      this.entityCreator.newEntry(contentType);
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
        this.entityCreator.newEntry(contentType);
        this.$apply();
      });

      it('determines enforcements', function () {
        sinon.assert.calledWith(stubs.enforcement, this.spaceContext.space.organization, [], 'entry');
      });

      it('notifies of the error', function () {
        sinon.assert.called(this.notification.error);
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
      this.entityCreator.newAsset();
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
        this.entityCreator.newAsset();
        this.$apply();
      });

      it('determines enforcements', function () {
        sinon.assert.calledWith(stubs.enforcement, this.spaceContext.space.organization, [], 'asset');
      });

      it('notifies of the error', function () {
        sinon.assert.called(this.notification.error);
      });
    });
  });
});
