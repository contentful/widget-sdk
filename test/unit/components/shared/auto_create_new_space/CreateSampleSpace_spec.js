import sinon from 'sinon';
import { $initialize, $inject } from 'test/utils/ng';
import { it } from 'test/utils/dsl';

describe('CreateSampleSpace service', () => {
  beforeEach(async function() {
    this.templates = [
      {
        fields: { name: 'product catalogue' }
      },
      {
        fields: { name: 'custom template' }
      }
    ];

    this.template = {
      apiKeys: []
    };

    this.spaceTemplateLoader = {
      getTemplate: sinon.stub().resolves(this.template),
      getTemplatesList: sinon.stub().resolves(this.templates)
    };

    this.dialog = {
      cancel: sinon.spy()
    };

    this.modalDialog = {
      open: sinon.stub().returns(this.dialog)
    };

    this.client = {
      createSpace: sinon.stub().resolves({ sys: { id: 'space-id' } })
    };

    this.templateLoader = {
      create: sinon.spy(() => ({
        contentCreated: Promise.resolve(),
        spaceSetup: Promise.reject(new Error('something wrong happened'))
      }))
    };

    this.getCreator = sinon.stub().returns(this.templateLoader);

    this.go = sinon.stub().resolves();

    this.spaceContext = {
      publishedCTs: {
        refresh: sinon.stub().resolves()
      }
    };

    this.tokenStore = {
      refresh: sinon.stub().resolves()
    };

    this.system.set('services/TokenStore.es6', this.tokenStore);
    this.system.set('services/SpaceTemplateCreator/index.es6', {
      getCreator: this.getCreator
    });
    this.system.set('states/Navigator.es6', {
      go: this.go
    });
    this.system.set('services/SpaceTemplateLoader.es6', this.spaceTemplateLoader);

    this.createSampleSpace = (await this.system.import(
      'components/shared/auto_create_new_space/CreateSampleSpace.es6'
    )).default;

    await $initialize(this.system, $provide => {
      $provide.constant('client', this.client);
      $provide.constant('modalDialog', this.modalDialog);
      $provide.constant('spaceContext', this.spaceContext);
    });

    this.$rootScope = $inject('$rootScope');
    sinon.spy(this.$rootScope, '$broadcast');

    this.getOrg = (orgId = 'owned-org') => {
      return {
        sys: {
          id: `${orgId}`
        }
      };
    };
    this.assertRejection = function*(fn, errorMsg) {
      fn(new Error(errorMsg));
      const error = yield this.createSampleSpace(this.getOrg(), 'product catalogue').catch(e => e);
      expect(error.message).toBe(errorMsg);
    };
  });

  describe('default export', () => {
    it('should throw when org is falsy', function() {
      expect(_ => this.createSampleSpace()).toThrow(new Error('Required param org not provided'));
    });
    it('should create a new space and load the chosen template', function*() {
      yield this.createSampleSpace(this.getOrg(), 'custom template');

      const modalScope = this.modalDialog.open.args[0][0].scope;

      sinon.assert.calledOnce(this.spaceTemplateLoader.getTemplatesList);
      sinon.assert.calledOnce(this.modalDialog.open);
      sinon.assert.calledWithExactly(
        this.client.createSpace,
        {
          name: 'The example project',
          defaultLocale: 'en-US'
        },
        'owned-org'
      );
      sinon.assert.calledOnce(this.tokenStore.refresh);
      sinon.assert.calledWithExactly(this.go, {
        path: ['spaces', 'detail'],
        params: {
          spaceId: 'space-id'
        }
      });
      sinon.assert.calledOnce(this.getCreator);
      sinon.assert.calledWithExactly(
        this.spaceTemplateLoader.getTemplate,
        this.templates[1].fields
      );
      sinon.assert.calledWithExactly(this.templateLoader.create, this.template);
      sinon.assert.calledOnce(this.spaceContext.publishedCTs.refresh);
      sinon.assert.calledWithExactly(this.$rootScope.$broadcast, 'spaceTemplateCreated');
      expect(modalScope.isCreatingSpace).toBe(false);
    });
    it('should reject if the template does not exist', function*() {
      const error = yield this.createSampleSpace(this.getOrg(), 'non existing template').catch(
        e => e
      );
      expect(error.message).toBe('Template named non existing template not found');
    });
    it('should reject if space creation fails', function*() {
      yield* this.assertRejection(
        err => this.client.createSpace.rejects(err),
        'create space failed'
      );
    });
    it('should reject if token refresh fails', function*() {
      yield* this.assertRejection(
        err => this.tokenStore.refresh.rejects(err),
        'token refresh failed'
      );
    });
    it('should reject if state navigation fails', function*() {
      yield* this.assertRejection(err => this.go.rejects(err), 'navigation failed');
    });
    it('should reject if getTemplate fails', function*() {
      yield* this.assertRejection(
        err => this.spaceTemplateLoader.getTemplate.rejects(err),
        'getting template failed'
      );
    });
    it('should reject if template loader create fails', function*() {
      this.templateLoader.create = () => ({
        contentCreated: Promise.reject(new Error('Error during creation')),
        spaceSetup: Promise.reject(new Error('something wrong happened'))
      });

      const error = yield this.createSampleSpace(this.getOrg(), 'product catalogue').catch(e => e);
      expect(error.message).toBe('Error during creation');
    });
    it('should reject if refresh of published CTs fails', function*() {
      yield* this.assertRejection(
        err => this.spaceContext.publishedCTs.refresh.rejects(err),
        'refreshing published cts failed'
      );
    });
  });
});
