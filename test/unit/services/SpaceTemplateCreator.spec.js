import * as sinon from 'helpers/sinon';

describe('Space Template creation service', () => {
  let spaceTemplateCreator, creator, stubs, spaceContext, enrichTemplate;

  beforeEach(function() {
    module('contentful/test', $provide => {
      stubs = $provide.makeStubs([
        'ctPublish',
        'assetPublish',
        'assetProcess',
        'entryPublish',
        'progressSuccess',
        'progressError',
        'success',
        'error',
        'retrySuccess',
        'getContentPreview',
        'createContentPreview',
        'refreshLocaleStore',
        'setActiveLocales'
      ]);

      $provide.value('contentPreview', {
        getAll: stubs.getContentPreview,
        create: stubs.createContentPreview
      });
      $provide.value('analytics/Analytics.es6', { track: _.noop });
      $provide.value('services/SpaceTemplateCreator/enrichTemplate.es6', {
        // we don't care about template info, because we describe enrichTemplate
        // function by ourselves
        enrichTemplate: (_templateInfo, template) => enrichTemplate(template)
      });

      $provide.value('TheLocaleStore', {
        refresh: stubs.refreshLocaleStore,
        setActiveLocales: stubs.setActiveLocales
      });
    });

    spaceTemplateCreator = this.$inject('services/SpaceTemplateCreator');
  });

  afterEach(() => {
    spaceTemplateCreator = creator = stubs = spaceContext = null;
  });

  describe('creates content based on a template', () => {
    let template;
    beforeEach(function*() {
      // we enrich template with 2 editor interfaces
      // but only 1 matches the content type we publish
      enrichTemplate = template => ({
        ...template,
        editorInterfaces: [
          {
            sys: {
              contentType: {
                sys: { id: 'ct1' }
              }
            }
          },
          {
            sys: {
              contentType: {
                sys: { id: 'unexisting_ct' }
              }
            }
          }
        ]
      });
      stubs.getContentPreview.returns(Promise.resolve([]));
      stubs.createContentPreview.returns(Promise.resolve({ sys: { id: 1 }, name: 'test' }));
      template = {
        contentTypes: [
          { sys: { id: 'ct1' }, publish: stubs.ctPublish },
          { sys: { id: 'ct2' }, publish: stubs.ctPublish },
          { sys: { id: 'ct3' }, publish: stubs.ctPublish }
        ],
        assets: [
          {
            sys: { id: 'a1' },
            fields: { file: { 'en-US': 'val' } },
            process: stubs.assetProcess,
            publish: stubs.assetPublish
          },
          {
            sys: { id: 'a2' },
            fields: { file: { 'en-US': 'val' } },
            process: stubs.assetProcess,
            publish: stubs.assetPublish
          },
          {
            sys: { id: 'a3' },
            fields: { file: { 'en-US': 'val' } },
            process: stubs.assetProcess,
            publish: stubs.assetPublish
          }
        ],
        entries: [
          {
            sys: { id: 'e1', contentType: { sys: { id: 'ct1' } } },
            fields: { file: { 'en-US': 'val' } },
            publish: stubs.entryPublish
          },
          {
            sys: { id: 'e2', contentType: { sys: { id: 'ct2' } } },
            fields: { file: { 'en-US': 'val' } },
            publish: stubs.entryPublish
          },
          {
            sys: { id: 'e3', contentType: { sys: { id: 'ct3' } } },
            fields: { file: { 'en-US': 'val' } },
            publish: stubs.entryPublish
          }
        ],
        apiKeys: [{ sys: { id: 'ak1' } }, { sys: { id: 'ak2' } }],
        space: {
          locales: [
            {
              code: 'en-US'
            }
          ]
        }
      };

      spaceContext = {
        space: {
          getId: _.constant('123'),
          createContentType: sinon.stub(),
          createEntry: sinon.stub(),
          createAsset: sinon.stub(),
          getContentType: function() {
            return Promise.resolve({
              createEditingInterface: spaceContext.createEditingInterface
            });
          }
        },
        docConnection: {
          open: sinon.stub().returns(
            Promise.resolve({
              destroy: _.noop,
              doc: {
                on: (_event, handler) => handler([{ p: ['fields', 'file'], oi: { url: 'url' } }]),
                removeListener: sinon.stub(),
                close: sinon.stub()
              }
            })
          )
        },
        apiKeyRepo: {
          create: sinon.stub().resolves(),
          getAll: () => Promise.resolve([{ accessToken: 'mock-token' }])
        },
        localeRepo: {
          save: sinon.stub()
        },
        editingInterfaces: {
          save: sinon.stub()
        }
      };

      spaceContext.editingInterfaces.save.returns(Promise.resolve());

      _.times(2, n => {
        spaceContext.space.createContentType
          .onCall(n)
          .returns(Promise.resolve(template.contentTypes[n]));
      });
      spaceContext.space.createContentType
        .onThirdCall()
        .returns(Promise.reject(new Error('can not create a content type')));
      stubs.ctPublish.returns(Promise.resolve({ data: { sys: { id: 'ct1' } } }));

      _.times(2, n => {
        spaceContext.space.createAsset.onCall(n).returns(Promise.resolve(template.assets[n]));
      });
      spaceContext.space.createAsset
        .onThirdCall()
        .returns(Promise.reject(new Error('can not create an asset')));
      stubs.assetProcess.returns(Promise.resolve());
      stubs.assetPublish.returns(Promise.resolve());

      _.times(2, n => {
        spaceContext.space.createEntry.onCall(n).returns(Promise.resolve(template.entries[n]));
      });
      spaceContext.space.createEntry
        .onThirdCall()
        .returns(Promise.reject(new Error('can not createa an entry')));
      stubs.entryPublish.returns(Promise.resolve());
      spaceContext.localeRepo.save.returns(Promise.resolve({ code: 'something' }));

      creator = spaceTemplateCreator.getCreator(
        spaceContext,
        { onItemSuccess: stubs.progressSuccess, onItemError: stubs.progressError },
        { name: 'Template name', spaceId: 'some_random_id' },
        'de-DE'
      );

      yield creator
        .create(template)
        .spaceSetup.then(data => {
          stubs.success(data);
        })
        .catch(() => {
          stubs.error();
        });
    });

    it('attempts to create 3 content types', () => {
      expect(spaceContext.space.createContentType.callCount).toBe(3);
    });

    it('publishes 2 content types', () => {
      expect(stubs.ctPublish.callCount).toBe(2);
    });

    it('creates 1 editor interface', () => {
      expect(spaceContext.editingInterfaces.save.callCount).toBe(1);
    });

    it('attempts to create 3 assets', () => {
      expect(spaceContext.space.createAsset.callCount).toBe(3);
    });

    it('transforms assets locale', () => {
      expect(_.keys(spaceContext.space.createAsset.args[0][0].fields.file)[0]).toEqual('de-DE');
      expect(_.keys(spaceContext.space.createAsset.args[1][0].fields.file)[0]).toEqual('de-DE');
      expect(_.keys(spaceContext.space.createAsset.args[2][0].fields.file)[0]).toEqual('de-DE');
    });

    it('processes 2 assets', () => {
      expect(stubs.assetProcess.callCount).toBe(2);
    });

    it('publishes 2 assets', () => {
      expect(stubs.assetPublish.callCount).toBe(2);
    });

    it('attempts to create 3 entries', () => {
      expect(spaceContext.space.createEntry.callCount).toBe(3);
    });

    it('calls entry with content type id', () => {
      expect(spaceContext.space.createEntry.args[0][0]).toEqual('ct1');
      expect(spaceContext.space.createEntry.args[1][0]).toEqual('ct2');
      expect(spaceContext.space.createEntry.args[2][0]).toEqual('ct3');
    });

    it('transforms entries locale', () => {
      expect(_.keys(spaceContext.space.createEntry.args[0][1].fields.file)[0]).toEqual('de-DE');
      expect(_.keys(spaceContext.space.createEntry.args[1][1].fields.file)[0]).toEqual('de-DE');
      expect(_.keys(spaceContext.space.createEntry.args[2][1].fields.file)[0]).toEqual('de-DE');
    });

    it('publishes 2 entries', () => {
      expect(stubs.entryPublish.callCount).toBe(2);
    });

    it('creates 2 apikeys', () => {
      expect(spaceContext.apiKeyRepo.create.callCount).toBe(2);
    });

    it('creates 1 preview environment', () => {
      const env = stubs.createContentPreview.args[0][0];
      sinon.assert.calledOnce(stubs.getContentPreview);
      expect(env.name).toBe('Discovery App');
      expect(env.configs.length).toBe(3);
    });

    it('refreshes the locale store', () => {
      sinon.assert.calledOnce(stubs.refreshLocaleStore);
    });

    it('set active locales', () => {
      sinon.assert.calledOnce(stubs.refreshLocaleStore);
    });

    it('updates success progress 17 times', () => {
      expect(stubs.progressSuccess.callCount).toBe(17);
    });

    it('updates error progress 4 times', () => {
      expect(stubs.progressError.callCount).toBe(3);
    });

    it('rejects promise because some have failed', () => {
      sinon.assert.called(stubs.error);
    });

    describe('retries creating the failed entities', () => {
      beforeEach(function*() {
        const template = {
          contentTypes: [
            { sys: { id: 'ct1' }, publish: stubs.ctPublish },
            { sys: { id: 'ct2' }, publish: stubs.ctPublish },
            { sys: { id: 'ct3' }, publish: stubs.ctPublish }
          ],
          assets: [
            {
              sys: { id: 'a1' },
              fields: { file: { 'en-US': 'val' } },
              process: stubs.assetProcess,
              publish: stubs.assetPublish
            },
            {
              sys: { id: 'a2' },
              fields: { file: { 'en-US': 'val' } },
              process: stubs.assetProcess,
              publish: stubs.assetPublish
            },
            {
              sys: { id: 'a3' },
              fields: { file: { 'en-US': 'val' } },
              process: stubs.assetProcess,
              publish: stubs.assetPublish
            }
          ],
          entries: [
            {
              sys: { id: 'e1', contentType: { sys: { id: 'ct1' } } },
              fields: { file: { 'en-US': 'val' } },
              publish: stubs.entryPublish
            },
            {
              sys: { id: 'e2', contentType: { sys: { id: 'ct2' } } },
              fields: { file: { 'en-US': 'val' } },
              publish: stubs.entryPublish
            },
            {
              sys: { id: 'e3', contentType: { sys: { id: 'ct3' } } },
              fields: { file: { 'en-US': 'val' } },
              publish: stubs.entryPublish
            }
          ],
          apiKeys: [{ sys: { id: 'ak1' } }, { sys: { id: 'ak2' } }],
          space: {
            locales: []
          }
        };
        spaceContext.space.createContentType = sinon.stub();
        spaceContext.space.createEntry = sinon.stub();
        spaceContext.space.createAsset = sinon.stub();

        spaceContext.space.createContentType.returns(
          Promise.resolve({ sys: { id: 'ct3' }, publish: stubs.ctPublish })
        );
        stubs.ctPublish.returns(Promise.resolve());

        spaceContext.space.createAsset.returns(
          Promise.resolve({
            sys: { id: 'a3' },
            process: stubs.assetProcess,
            publish: stubs.assetPublish
          })
        );
        stubs.assetProcess.returns(Promise.resolve());
        stubs.assetPublish.returns(Promise.resolve());

        spaceContext.space.createEntry.returns(
          Promise.resolve({ sys: { id: 'e3' }, publish: stubs.entryPublish })
        );
        stubs.entryPublish.returns(Promise.resolve());

        yield creator.create(template).spaceSetup.catch(stubs.retrySuccess);
      });

      it('creates 1 content type', () => {
        expect(spaceContext.space.createContentType.callCount).toBe(1);
      });

      it('has published all 3 content types', () => {
        expect(stubs.ctPublish.callCount).toBe(3);
      });

      it('creates 1 asset', () => {
        expect(spaceContext.space.createAsset.callCount).toBe(1);
      });

      it('has processed all 3 assets', () => {
        expect(stubs.assetProcess.callCount).toBe(3);
      });

      it('has published all 3 assets', () => {
        expect(stubs.assetPublish.callCount).toBe(3);
      });

      it('creates 1 entry', () => {
        expect(spaceContext.space.createEntry.callCount).toBe(1);
      });

      it('has published all 3 entries', () => {
        expect(stubs.entryPublish.callCount).toBe(3);
      });

      it('updates success progress 24 times in total', () => {
        expect(stubs.progressSuccess.callCount).toBe(24);
      });

      it('updates error progress 4 times in total', () => {
        expect(stubs.progressError.callCount).toBe(3);
      });

      it('rejects promise because some have failed', () => {
        sinon.assert.called(stubs.retrySuccess);
      });
    });
  });
});
