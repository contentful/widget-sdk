import * as sinon from 'helpers/sinon';

describe('CreateSampleSpace service', function () {
  beforeEach(function () {
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

    this.space = {
      getId: sinon.stub().returns('space-id')
    };

    this.client = {
      createSpace: sinon.stub().resolves(this.space)
    };

    this.templateLoader = {
      create: sinon.stub().resolves()
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

    module('contentful/test', $provide => {
      $provide.value('client', this.client);
      $provide.value('modalDialog', this.modalDialog);
      $provide.value('services/TokenStore', this.tokenStore);
      $provide.value('spaceTemplateCreator', {
        getCreator: this.getCreator
      });
      $provide.value('states/Navigator', {
        go: this.go
      });
      $provide.value('spaceTemplateLoader', this.spaceTemplateLoader);
      $provide.value('spaceContext', this.spaceContext);
    });

    this.$rootScope = this.$inject('$rootScope');
    sinon.spy(this.$rootScope, '$broadcast');

    this.createSampleSpace = this.$inject('components/shared/auto_create_new_space/CreateSampleSpace').default;
    this.getOrg = (orgId = 'owned-org') => {
      return {
        sys: {
          id: `${orgId}`
        }
      };
    };
    this.assertRejection = function* (fn, errorMsg) {
      try {
        fn(new Error(errorMsg));
        yield this.createSampleSpace(this.getOrg(), 'product catalogue');
      } catch (e) {
        expect(e.message).toBe(errorMsg);
      }
    };
  });

  describe('default export', function () {
    it('should throw when org is falsy', function () {
      expect(_ => this.createSampleSpace()).toThrow(new Error('Required param org not provided'));
    });
    it('should create a new space and load the chosen template', function* () {
      yield this.createSampleSpace(this.getOrg(), 'custom template');

      const modalScope = this.modalDialog.open.args[0][0].scope;

      sinon.assert.calledOnce(this.spaceTemplateLoader.getTemplatesList);
      sinon.assert.calledOnce(this.modalDialog.open);
      sinon.assert.calledWithExactly(this.client.createSpace, {
        name: 'Sample project',
        defaultLocale: 'en-US'
      }, 'owned-org');
      sinon.assert.calledOnce(this.tokenStore.refresh);
      sinon.assert.calledWithExactly(this.go, {
        path: ['spaces', 'detail'],
        params: {
          spaceId: 'space-id'
        }
      });
      sinon.assert.calledOnce(this.getCreator);
      sinon.assert.calledWithExactly(this.spaceTemplateLoader.getTemplate, this.templates[1].fields);
      sinon.assert.calledWithExactly(this.templateLoader.create, this.template);
      sinon.assert.calledOnce(this.spaceContext.publishedCTs.refresh);
      sinon.assert.calledWithExactly(this.$rootScope.$broadcast, 'spaceTemplateCreated');
      expect(modalScope.isCreatingSpace).toBe(false);
    });
    it('should reject if the template does not exist', function* () {
      try {
        yield this.createSampleSpace(this.getOrg(), 'non existing template');
      } catch (e) {
        expect(e.message).toBe('Template named non existing template not found');
      }
    });
    it('should reject if space creation fails', function* () {
      yield* this.assertRejection(
        err => this.client.createSpace.rejects(err),
        'create space failed'
      );
    });
    it('should reject if token refresh fails', function* () {
      yield* this.assertRejection(
        err => this.tokenStore.refresh.rejects(err),
        'token refresh failed'
      );
    });
    it('should reject if state navigation fails', function* () {
      yield* this.assertRejection(
        err => this.go.rejects(err),
        'navigation failed'
      );
    });
    it('should reject if getTemplate fails', function* () {
      yield* this.assertRejection(
        err => this.spaceTemplateLoader.getTemplate.rejects(err),
        'getting template failed'
      );
    });
    it('should reject if template loader create fails', function* () {
      yield* this.assertRejection(
        err => this.templateLoader.create.rejects(err),
        'loading template failed'
      );
    });
    it('should reject if refresh of published CTs fails', function* () {
      yield* this.assertRejection(
        err => this.spaceContext.publishedCTs.refresh.rejects(err),
        'refreshing published cts failed'
      );
    });
  });
});
