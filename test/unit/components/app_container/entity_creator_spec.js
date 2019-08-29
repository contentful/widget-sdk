import sinon from 'sinon';
import { $initialize, $inject, $apply } from 'test/helpers/helpers';

describe('entityCreator', () => {
  beforeEach(async function() {
    this.stubs = {
      computeUsage: sinon.stub(),
      enforcement: sinon.stub(),
      success: sinon.stub(),
      error: sinon.stub()
    };

    this.ComponentLibrary = await this.system.import('@contentful/forma-36-react-components');
    this.ComponentLibrary.Notification.success = this.stubs.success;
    this.ComponentLibrary.Notification.error = this.stubs.error;

    this.system.set('access_control/Enforcements.es6', {
      computeUsageForOrganization: this.stubs.computeUsage,
      determineEnforcement: this.stubs.enforcement
    });

    await $initialize(this.system);

    const cfStub = $inject('cfStub');

    this.$q = $inject('$q');

    this.spaceContext = $inject('spaceContext');
    this.spaceContext.space = cfStub.space('test');

    this.entityCreator = $inject('entityCreator');
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
        $apply();
      });

      it('determines enforcements', function() {
        sinon.assert.calledWith(this.stubs.enforcement, this.spaceContext.space, [], 'entry');
      });

      it('notifies of the error', function() {
        sinon.assert.called(this.stubs.error);
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
        $apply();
      });

      it('determines enforcements', function() {
        sinon.assert.calledWith(this.stubs.enforcement, this.spaceContext.space, [], 'asset');
      });

      it('notifies of the error', function() {
        sinon.assert.called(this.stubs.error);
      });
    });
  });
});
