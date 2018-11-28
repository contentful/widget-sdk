'use strict';

describe('entityCreator', () => {
  let stubs;

  afterEach(() => {
    stubs = null;
  });

  beforeEach(function() {
    module('contentful/test', $provide => {
      stubs = $provide.makeStubs(['computeUsage', 'enforcement', 'track', 'succes', 'error']);

      $provide.value('access_control/Enforcements.es6', {
        computeUsageForOrganization: stubs.computeUsage,
        determineEnforcement: stubs.enforcement
      });
    });

    const cfStub = this.$inject('cfStub');

    this.ComponentLibrary = this.$inject('@contentful/ui-component-library');
    this.ComponentLibrary.Notification.success = stubs.success;
    this.ComponentLibrary.Notification.error = stubs.error;

    this.$q = this.$inject('$q');

    this.spaceContext = this.$inject('spaceContext');
    this.spaceContext.space = cfStub.space('test');

    this.entityCreator = this.$inject('entityCreator');
  });

  describe('creates an entry', () => {
    let createStub;
    let contentType;
    beforeEach(inject(function(cfStub) {
      this.entity = { getId: sinon.stub() };
      createStub = sinon
        .stub(this.spaceContext.space, 'createEntry')
        .returns(this.$q.resolve(this.entity));
      contentType = cfStub.contentType(this.spaceContext.space, 'thing', 'Thing');
    }));

    afterEach(() => {
      createStub.restore();
    });

    it('calls the space create method', function() {
      this.entityCreator.newEntry(contentType);
      sinon.assert.called(createStub);
    });

    describe('creation fails', () => {
      beforeEach(function() {
        createStub.returns(
          this.$q.reject({
            body: {
              details: {
                reasons: []
              }
            }
          })
        );
        this.entityCreator.newEntry(contentType);
        this.$apply();
      });

      it('determines enforcements', function() {
        sinon.assert.calledWith(stubs.enforcement, this.spaceContext.space, [], 'entry');
      });

      it('notifies of the error', function() {
        sinon.assert.called(stubs.error);
      });
    });
  });

  describe('creates an asset', () => {
    let createStub;
    beforeEach(function() {
      createStub = sinon
        .stub(this.spaceContext.space, 'createAsset')
        .returns(this.$q.defer().promise);
    });

    afterEach(() => {
      createStub.restore();
    });

    it('calls the space create method', function() {
      this.entityCreator.newAsset();
      sinon.assert.called(createStub);
    });

    describe('creation fails', () => {
      beforeEach(function() {
        createStub.returns(
          this.$q.reject({
            body: {
              details: {
                reasons: []
              }
            }
          })
        );
        this.entityCreator.newAsset();
        this.$apply();
      });

      it('determines enforcements', function() {
        sinon.assert.calledWith(stubs.enforcement, this.spaceContext.space, [], 'asset');
      });

      it('notifies of the error', function() {
        sinon.assert.called(stubs.error);
      });
    });
  });
});
