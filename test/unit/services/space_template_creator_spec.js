'use strict';

describe('Space Template creation service', function () {
  var spaceTemplateCreator, creator, $q, $rootScope, stubs;
  var attemptedTemplate, spaceContext;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'ctPublish', 'assetPublish', 'assetProcess', 'entryPublish', 'progressSuccess', 'progressError',
        'success', 'error', 'open', 'on', 'timeout', 'timeoutCancel', 'retrySuccess'
      ]);

      $provide.value('ShareJS', {
        open: stubs.open
      });

      stubs.timeout.cancel = stubs.timeoutCancel;
      $provide.value('$timeout', stubs.timeout);
    });
    inject(function ($injector) {
      spaceTemplateCreator = $injector.get('spaceTemplateCreator');
      $q = $injector.get('$q');
      $rootScope = $injector.get('$rootScope');
    });
  });

  describe('creates content based on a template', function() {
    var template;
    beforeEach(function() {
      template = {
        contentTypes: [
          {sys: {id: 'ct1'}, publish: stubs.ctPublish},
          {sys: {id: 'ct2'}, publish: stubs.ctPublish},
          {sys: {id: 'ct3'}, publish: stubs.ctPublish}],
        editingInterfaces: [{sys: {id: 'ei1'}}, {sys: {id: 'ei2'}}],
        assets: [
          {sys: {id: 'a1'}, process: stubs.assetProcess, publish: stubs.assetPublish },
          {sys: {id: 'a2'}, process: stubs.assetProcess, publish: stubs.assetPublish },
          {sys: {id: 'a3'}, process: stubs.assetProcess, publish: stubs.assetPublish }
        ],
        entries: [
          { sys: { id: 'e1', contentType: {sys: {id: 'ct1'}} }, publish: stubs.entryPublish},
          { sys: { id: 'e2', contentType: {sys: {id: 'ct2'}} }, publish: stubs.entryPublish},
          { sys: { id: 'e3', contentType: {sys: {id: 'ct3'}} }, publish: stubs.entryPublish}
        ],
        apiKeys: [
          {sys: {id: 'ak1'}},
          {sys: {id: 'ak2'}}
        ]
      };

      spaceContext = {
        createEditingInterface: sinon.stub(),
        space: {
          createContentType: sinon.stub(),
          createEntry: sinon.stub(),
          createAsset: sinon.stub(),
          createDeliveryApiKey: sinon.stub(),
          getContentType: function() {
            return $q.when({
              createEditingInterface: spaceContext.createEditingInterface
            });
          }
        }
      };

      _.times(2, function (n) {
        spaceContext.space.createContentType.onCall(n).returns($q.when(template.contentTypes[n]));
      });
      spaceContext.space.createContentType.onThirdCall().returns($q.reject());
      stubs.ctPublish.returns($q.when());

      spaceContext.createEditingInterface.returns($q.when());
      spaceContext.createEditingInterface.onSecondCall().returns($q.reject());

      _.times(2, function (n) {
        spaceContext.space.createAsset.onCall(n).returns($q.when(template.assets[n]));
      });
      spaceContext.space.createAsset.onThirdCall().returns($q.reject());
      stubs.assetProcess.returns($q.when());
      stubs.assetPublish.returns($q.when());

      _.times(2, function (n) {
        spaceContext.space.createEntry.onCall(n).returns($q.when(template.entries[n]));
      });
      spaceContext.space.createEntry.onThirdCall().returns($q.reject());
      stubs.entryPublish.returns($q.when());

      spaceContext.space.createDeliveryApiKey.returns($q.when());

      creator = spaceTemplateCreator.getCreator(
        spaceContext,
        {onItemSuccess: stubs.progressSuccess, onItemError: stubs.progressError}
      );

      creator.create(template)
      .then(stubs.success)
      .catch(function (data) {
        attemptedTemplate = data.template;
        stubs.error();
      });
      $rootScope.$digest();

      stubs.open.yield(null, {
        on: stubs.on,
        removeListener: sinon.stub(),
        close: sinon.stub()
      });
      stubs.on.yield([
        {p: ['fields', 'file'], oi: {url: 'url'}}
      ]);
      stubs.timeout.yield();
      $rootScope.$digest();
    });

    it('attempts to create 3 content types', function() {
      expect(spaceContext.space.createContentType.callCount).toBe(3);
    });

    it('publishes 2 content types', function() {
      expect(stubs.ctPublish.callCount).toBe(2);
    });

    it('attempts to create 2 editing interface', function() {
      expect(spaceContext.createEditingInterface.callCount).toBe(2);
    });

    it('attempts to create 3 assets', function() {
      expect(spaceContext.space.createAsset.callCount).toBe(3);
    });

    it('processes 2 assets', function() {
      expect(stubs.assetProcess.callCount).toBe(2);
    });

    it('publishes 2 assets', function() {
      expect(stubs.assetPublish.callCount).toBe(2);
    });

    it('attempts to create 3 entries', function() {
      expect(spaceContext.space.createEntry.callCount).toBe(3);
    });

    it('calls entry with content type id', function() {
      expect(spaceContext.space.createEntry.args[0][0]).toEqual('ct1');
      expect(spaceContext.space.createEntry.args[1][0]).toEqual('ct2');
      expect(spaceContext.space.createEntry.args[2][0]).toEqual('ct3');
    });

    it('publishes 2 entries', function() {
      expect(stubs.entryPublish.callCount).toBe(2);
    });

    it('creates 2 apikeys', function() {
      expect(spaceContext.space.createDeliveryApiKey.callCount).toBe(2);
    });

    it('updates success progress 17 times', function() {
      expect(stubs.progressSuccess.callCount).toBe(17);
    });

    it('updates error progress 4 times', function() {
      expect(stubs.progressError.callCount).toBe(4);
    });

    it('rejects promise because some have failed', function() {
      sinon.assert.called(stubs.error);
    });

    describe('retries creating the failed entities', function() {
      beforeEach(function() {
        spaceContext.space.createContentType      = sinon.stub();
        spaceContext.space.createEditingInterface = sinon.stub();
        spaceContext.space.createEntry            = sinon.stub();
        spaceContext.space.createAsset            = sinon.stub();
        spaceContext.space.createDeliveryApiKey   = sinon.stub();
        spaceContext.createEditingInterface       = sinon.stub();

        spaceContext.space.createContentType.returns($q.when({sys: {id: 'ct3'}, publish: stubs.ctPublish}));
        stubs.ctPublish.returns($q.when());

        spaceContext.createEditingInterface.returns($q.when());

        spaceContext.space.createAsset.returns($q.when({
          sys: {id: 'a3'},
          process: stubs.assetProcess,
          publish: stubs.assetPublish
        }));
        stubs.assetProcess.returns($q.when());
        stubs.assetPublish.returns($q.when());

        spaceContext.space.createEntry.returns($q.when({sys: {id: 'e3'}, publish: stubs.entryPublish}));
        stubs.entryPublish.returns($q.when());

        stubs.open.reset();
        stubs.on.reset();
        stubs.timeout.reset();

        creator.create(attemptedTemplate)
        .then(stubs.retrySuccess);
        $rootScope.$digest();

        stubs.open.yield(null, {
          on: stubs.on,
          removeListener: sinon.stub(),
          close: sinon.stub()
        });
        stubs.on.yield([
          {p: ['fields', 'file'], oi: {url: 'url'}}
        ]);
        stubs.timeout.yield();
        $rootScope.$digest();

      });

      it('creates 1 content type', function() {
        expect(spaceContext.space.createContentType.callCount).toBe(1);
      });

      it('has published all 3 content types', function() {
        expect(stubs.ctPublish.callCount).toBe(3);
      });

      it('creates 1 editing interface', function() {
        expect(spaceContext.createEditingInterface.callCount).toBe(1);
      });

      it('creates 1 asset', function() {
        expect(spaceContext.space.createAsset.callCount).toBe(1);
      });

      it('has processed all 3 assets', function() {
        expect(stubs.assetProcess.callCount).toBe(3);
      });

      it('has published all 3 assets', function() {
        expect(stubs.assetPublish.callCount).toBe(3);
      });

      it('creates 1 entry', function() {
        expect(spaceContext.space.createEntry.callCount).toBe(1);
      });

      it('has published all 3 entries', function() {
        expect(stubs.entryPublish.callCount).toBe(3);
      });

      it('updates success progress 25 times in total', function() {
        expect(stubs.progressSuccess.callCount).toBe(25);
      });

      it('updates error progress 4 times in total', function() {
        expect(stubs.progressError.callCount).toBe(4);
      });

      it('rejects promise because some have failed', function() {
        sinon.assert.called(stubs.retrySuccess);
      });


    });
  });

});
