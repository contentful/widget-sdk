'use strict';

describe('Space Template creation service', function () {
  let spaceTemplateCreator, creator, $q, $rootScope, stubs;
  let attemptedTemplate, spaceContext;
  let openShareJSDoc;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'ctPublish', 'assetPublish', 'assetProcess', 'entryPublish', 'progressSuccess', 'progressError',
        'success', 'error', 'on', 'timeout', 'timeoutCancel', 'retrySuccess', 'getContentPreview', 'createContentPreview'
      ]);

      stubs.timeout.cancel = stubs.timeoutCancel;
      $provide.value('$timeout', stubs.timeout);

      $provide.value('contentPreview', {getAll: stubs.getContentPreview, create: stubs.createContentPreview});
    });
    inject(function ($injector) {
      spaceTemplateCreator = $injector.get('spaceTemplateCreator');
      $q = $injector.get('$q');
      $rootScope = $injector.get('$rootScope');
      openShareJSDoc = $q.defer();
      stubs.getContentPreview.resolves([]);
      stubs.createContentPreview.resolves({sys: {id: 1}, name: 'test'});
    });
  });

  afterEach(function () {
    spaceTemplateCreator = creator = $q = $rootScope = stubs =
    attemptedTemplate = spaceContext = openShareJSDoc = null;
  });

  describe('creates content based on a template', function () {
    let template;
    beforeEach(function () {
      template = {
        contentTypes: [
          {sys: {id: 'ct1'}, publish: stubs.ctPublish},
          {sys: {id: 'ct2'}, publish: stubs.ctPublish},
          {sys: {id: 'ct3'}, publish: stubs.ctPublish}],
        editingInterfaces: [
          {contentType: {sys: {id: 'ct1'}}, data: {sys: {id: 'ei1', version: 3}}},
          {contentType: {sys: {id: 'ct2'}}, data: {sys: {id: 'ei2', version: 5}}}
        ],
        assets: [
          {sys: {id: 'a1'}, fields: {file: {'en-US': 'val'}}, process: stubs.assetProcess, publish: stubs.assetPublish},
          {sys: {id: 'a2'}, fields: {file: {'en-US': 'val'}}, process: stubs.assetProcess, publish: stubs.assetPublish},
          {sys: {id: 'a3'}, fields: {file: {'en-US': 'val'}}, process: stubs.assetProcess, publish: stubs.assetPublish}
        ],
        entries: [
          {sys: {id: 'e1', contentType: {sys: {id: 'ct1'}}}, fields: {file: {'en-US': 'val'}}, publish: stubs.entryPublish},
          {sys: {id: 'e2', contentType: {sys: {id: 'ct2'}}}, fields: {file: {'en-US': 'val'}}, publish: stubs.entryPublish},
          {sys: {id: 'e3', contentType: {sys: {id: 'ct3'}}}, fields: {file: {'en-US': 'val'}}, publish: stubs.entryPublish}
        ],
        apiKeys: [
          {sys: {id: 'ak1'}},
          {sys: {id: 'ak2'}}
        ]
      };

      spaceContext = {
        editingInterfaces: {
          save: sinon.stub()
        },
        space: {
          data: {
            locales: [
              { internal_code: 'de-DE' }
            ]
          },
          getId: _.constant('123'),
          getDeliveryApiKeys: sinon.stub().returns([{data: {accessToken: 'mock-token'}}]),
          createContentType: sinon.stub(),
          createEntry: sinon.stub(),
          createAsset: sinon.stub(),
          createDeliveryApiKey: sinon.stub(),
          getContentType: function () {
            return $q.resolve({
              createEditingInterface: spaceContext.createEditingInterface
            });
          }
        },
        docConnection: {
          open: sinon.stub().returns(openShareJSDoc.promise)
        }
      };

      _.times(2, function (n) {
        spaceContext.space.createContentType.onCall(n).returns($q.resolve(template.contentTypes[n]));
      });
      spaceContext.space.createContentType.onThirdCall().returns($q.reject());
      stubs.ctPublish.returns($q.resolve());

      spaceContext.editingInterfaces.save.returns($q.resolve());
      spaceContext.editingInterfaces.save.onSecondCall().returns($q.reject());

      _.times(2, function (n) {
        spaceContext.space.createAsset.onCall(n).returns($q.resolve(template.assets[n]));
      });
      spaceContext.space.createAsset.onThirdCall().returns($q.reject());
      stubs.assetProcess.returns($q.resolve());
      stubs.assetPublish.returns($q.resolve());

      _.times(2, function (n) {
        spaceContext.space.createEntry.onCall(n).returns($q.resolve(template.entries[n]));
      });
      spaceContext.space.createEntry.onThirdCall().returns($q.reject());
      stubs.entryPublish.returns($q.resolve());

      spaceContext.space.createDeliveryApiKey.returns($q.resolve());

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

      openShareJSDoc.resolve({
        destroy: _.noop,
        doc: {
          on: stubs.on,
          removeListener: sinon.stub(),
          close: sinon.stub()
        }
      });
      this.$apply();
      stubs.on.yield([
        {p: ['fields', 'file'], oi: {url: 'url'}}
      ]);
      stubs.timeout.yield();
      $rootScope.$digest();
    });

    it('attempts to create 3 content types', function () {
      expect(spaceContext.space.createContentType.callCount).toBe(3);
    });

    it('publishes 2 content types', function () {
      expect(stubs.ctPublish.callCount).toBe(2);
    });

    it('attempts to create 2 editing interface', function () {
      expect(spaceContext.editingInterfaces.save.callCount).toBe(2);
    });

    it('attempts to create 3 assets', function () {
      expect(spaceContext.space.createAsset.callCount).toBe(3);
    });

    it('transforms assets locale', function () {
      expect(_.keys(spaceContext.space.createAsset.args[0][0].fields.file)[0]).toEqual('de-DE');
      expect(_.keys(spaceContext.space.createAsset.args[1][0].fields.file)[0]).toEqual('de-DE');
      expect(_.keys(spaceContext.space.createAsset.args[2][0].fields.file)[0]).toEqual('de-DE');
    });

    it('processes 2 assets', function () {
      expect(stubs.assetProcess.callCount).toBe(2);
    });

    it('publishes 2 assets', function () {
      expect(stubs.assetPublish.callCount).toBe(2);
    });

    it('attempts to create 3 entries', function () {
      expect(spaceContext.space.createEntry.callCount).toBe(3);
    });

    it('calls entry with content type id', function () {
      expect(spaceContext.space.createEntry.args[0][0]).toEqual('ct1');
      expect(spaceContext.space.createEntry.args[1][0]).toEqual('ct2');
      expect(spaceContext.space.createEntry.args[2][0]).toEqual('ct3');
    });

    it('transforms entries locale', function () {
      expect(_.keys(spaceContext.space.createEntry.args[0][1].fields.file)[0]).toEqual('de-DE');
      expect(_.keys(spaceContext.space.createEntry.args[1][1].fields.file)[0]).toEqual('de-DE');
      expect(_.keys(spaceContext.space.createEntry.args[2][1].fields.file)[0]).toEqual('de-DE');
    });

    it('publishes 2 entries', function () {
      expect(stubs.entryPublish.callCount).toBe(2);
    });

    it('creates 2 apikeys', function () {
      expect(spaceContext.space.createDeliveryApiKey.callCount).toBe(2);
    });

    it('creates 1 preview environment', function () {
      const env = stubs.createContentPreview.args[0][0];
      sinon.assert.calledOnce(stubs.getContentPreview);
      expect(env.name).toBe('Discovery App');
      expect(env.configs.length).toBe(3);
    });

    it('updates success progress 17 times', function () {
      expect(stubs.progressSuccess.callCount).toBe(17);
    });

    it('updates error progress 4 times', function () {
      expect(stubs.progressError.callCount).toBe(4);
    });

    it('rejects promise because some have failed', function () {
      sinon.assert.called(stubs.error);
    });

    describe('retries creating the failed entities', function () {
      beforeEach(function () {
        spaceContext.space.createContentType = sinon.stub();
        spaceContext.space.createEntry = sinon.stub();
        spaceContext.space.createAsset = sinon.stub();
        spaceContext.space.createDeliveryApiKey = sinon.stub();
        spaceContext.editingInterfaces.save = sinon.stub().resolves();

        spaceContext.space.createContentType.returns($q.resolve({sys: {id: 'ct3'}, publish: stubs.ctPublish}));
        stubs.ctPublish.returns($q.resolve());

        spaceContext.space.createAsset.returns($q.resolve({
          sys: {id: 'a3'},
          process: stubs.assetProcess,
          publish: stubs.assetPublish
        }));
        stubs.assetProcess.returns($q.resolve());
        stubs.assetPublish.returns($q.resolve());

        spaceContext.space.createEntry.returns($q.resolve({sys: {id: 'e3'}, publish: stubs.entryPublish}));
        stubs.entryPublish.returns($q.resolve());

        stubs.on.reset();
        stubs.timeout.reset();

        creator.create(attemptedTemplate)
        .then(stubs.retrySuccess);
        $rootScope.$digest();

        openShareJSDoc.resolve({
          on: stubs.on,
          removeListener: sinon.stub(),
          close: sinon.stub()
        });
        this.$apply();
        stubs.on.yield([
          {p: ['fields', 'file'], oi: {url: 'url'}}
        ]);
        stubs.timeout.yield();
        $rootScope.$digest();
      });

      it('creates 1 content type', function () {
        expect(spaceContext.space.createContentType.callCount).toBe(1);
      });

      it('has published all 3 content types', function () {
        expect(stubs.ctPublish.callCount).toBe(3);
      });

      it('creates 1 editing interface', function () {
        expect(spaceContext.editingInterfaces.save.callCount).toBe(1);
      });

      it('creates 1 asset', function () {
        expect(spaceContext.space.createAsset.callCount).toBe(1);
      });

      it('has processed all 3 assets', function () {
        expect(stubs.assetProcess.callCount).toBe(3);
      });

      it('has published all 3 assets', function () {
        expect(stubs.assetPublish.callCount).toBe(3);
      });

      it('creates 1 entry', function () {
        expect(spaceContext.space.createEntry.callCount).toBe(1);
      });

      it('has published all 3 entries', function () {
        expect(stubs.entryPublish.callCount).toBe(3);
      });

      it('updates success progress 25 times in total', function () {
        expect(stubs.progressSuccess.callCount).toBe(25);
      });

      it('updates error progress 4 times in total', function () {
        expect(stubs.progressError.callCount).toBe(4);
      });

      it('rejects promise because some have failed', function () {
        sinon.assert.called(stubs.retrySuccess);
      });
    });
  });
});
