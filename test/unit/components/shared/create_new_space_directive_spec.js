import { createMockProperty } from 'test/utils/kefir';
import sinon from 'sinon';
import { $initialize, $inject, $compile, $apply } from 'test/utils/ng';

describe('cfCreateNewSpace directive', () => {
  let element, $scope, $rootScope, controller, stubs, $q;

  afterEach(() => {
    element.remove();

    element = $scope = $rootScope = controller = stubs = null;
  });

  beforeEach(async function() {
    this.org = { sys: { id: 'org_id' } };

    stubs = {
      spaceTemplateLoader: {
        getTemplatesList: sinon.stub(),
        getTemplate: sinon.stub()
      },
      spaceTemplateCreator: {
        getCreator: sinon.stub(),
        create: sinon.stub()
      },
      analytics: {
        addIdentifyingData: sinon.stub(),
        track: sinon.stub()
      },
      logger: {
        logError: sinon.stub(),
        logServerWarn: sinon.stub()
      },
      client: {
        createSpace: sinon.stub()
      },
      resourceService: {
        _canCreate: sinon.stub().resolves(true),
        _messagesFor: sinon.stub().resolves({ error: '', warning: '' }),
        default: () => {
          return {
            canCreate: stubs.resourceService._canCreate,
            messagesFor: stubs.resourceService._messagesFor
          };
        }
      },
      tokenStore: {
        refresh: sinon.stub(),
        user$: createMockProperty({ firstName: 'firstName' }),
        getOrganization: sinon.stub().resolves(this.org)
      },
      state: {
        go: sinon.stub().resolves()
      },
      dialog: {
        confirm: sinon.stub()
      },
      apiKeyRepo: {
        create: sinon.stub()
      }
    };

    this.system.set('services/SpaceTemplateLoader.es6', stubs.spaceTemplateLoader);
    this.system.set('services/SpaceTemplateCreator/index.es6', stubs.spaceTemplateCreator);
    this.system.set('analytics/Analytics', stubs.analytics);
    this.system.set('services/logger.es6', stubs.logger);
    this.system.set('services/TokenStore.es6', stubs.tokenStore);
    this.system.set('services/ResourceService.es6', stubs.resourceService);
    this.system.set('services/client.es6', {
      default: stubs.client
    });
    this.system.set('app/settings/api/services/ApiKeyRepoInstance', {
      getApiKeyRepo: () => stubs.apiKeyRepo,
      purgeApiKeyRepoCache: () => {}
    });

    await $initialize(this.system, $provide => {
      $provide.value('$state', stubs.state);
    });

    this.spaceContext = $inject('mocks/spaceContext').init();
    this.spaceContext.getData = sinon.stub();

    stubs.spaceTemplateLoader.getTemplatesList.resolves(true);

    $rootScope = $inject('$rootScope');
    $q = $inject('$q');

    this.setupDirective = function(organization) {
      element = $compile('<cf-create-new-space>', {
        dialog: stubs.dialog,
        organization: organization || this.org
      });
      $scope = element.scope();
      controller = $scope.createSpace;
    };
  });

  describe('on the default state', () => {
    it('new space data has default locale', function() {
      this.setupDirective();
      expect(controller.newSpace.data.defaultLocale).toBe('en-US');
    });

    it('selects given organization', function() {
      this.setupDirective();
      expect(controller.newSpace.organization).toBe(this.org);
    });
  });

  describe('creates a space in a legacy organization', () => {
    it('asks if the space limits have been reached', function() {
      this.setupDirective();
      controller.requestSpaceCreation();
      $rootScope.$digest();

      sinon.assert.called(stubs.resourceService._canCreate);
    });

    describe('if remote call fails with no specific error', () => {
      beforeEach(function() {
        stubs.client.createSpace.rejects({
          body: {
            details: {
              errors: []
            }
          }
        });

        this.setupDirective();
        controller.newSpace.data.name = 'name';
        controller.requestSpaceCreation();
        $rootScope.$digest();
      });

      it('sends template selection analytics event', () => {
        sinon.assert.calledWith(stubs.analytics.track, 'space:template_selected', {
          templateName: 'Blank'
        });
      });

      it('calls client lib with data', () => {
        expect(stubs.client.createSpace.args[0][0].name).toEqual('name');
      });

      it('calls client lib with org id', function() {
        expect(stubs.client.createSpace.args[0][1]).toEqual(this.org.sys.id);
      });

      it('displays and logs error', () => {
        const error =
          'Could not create Space. If the problem persists please get in contact with us.';
        expect(controller.newSpace.errors.form).toEqual(error);
        sinon.assert.called(stubs.logger.logServerWarn);
      });
    });

    describe('if remote call fails with a specific error', () => {
      beforeEach(function() {
        stubs.client.createSpace.rejects({
          body: {
            details: {
              errors: [{ path: 'name', name: 'length' }]
            }
          }
        });
        this.setupDirective();
        controller.newSpace.data.name = 'name';
        controller.requestSpaceCreation();
        $rootScope.$digest();
      });

      it('calls client lib with data', () => {
        expect(stubs.client.createSpace.args[0][0].name).toEqual('name');
      });

      it('calls client lib with org id', function() {
        expect(stubs.client.createSpace.args[0][1]).toEqual(this.org.sys.id);
      });

      it('shows field length error', () => {
        expect(controller.newSpace.errors.fields.name).toEqual('Space name is too long');
      });
    });

    describe('if remote call succeeds', () => {
      beforeEach(function() {
        stubs.tokenStore.refresh.resolves();
        stubs.client.createSpace.resolves({ sys: { id: 'spaceid' }, name: 'oldspace' });
        stubs.apiKeyRepo.create.resolves();
        stubs.spaceTemplateLoader.getTemplate.resolves();
        this.setupDirective();
      });

      describe('no template selected', () => {
        beforeEach(() => {
          controller.newSpace.data.name = 'name';
          controller.newSpace.data.defaultLocale = 'fr';
          controller.requestSpaceCreation();
          $rootScope.$digest();
        });

        it('asks if it can create a new space', () => {
          sinon.assert.called(stubs.resourceService._canCreate);
        });

        it('calls client lib with org name', () => {
          expect(stubs.client.createSpace.args[0][0].name).toEqual('name');
        });

        it('calls client lib with locale', () => {
          expect(stubs.client.createSpace.args[0][0].defaultLocale).toEqual('fr');
        });

        it('calls client lib with org id', function() {
          expect(stubs.client.createSpace.args[0][1]).toEqual(this.org.sys.id);
        });

        it('performs token refresh', () => {
          sinon.assert.called(stubs.tokenStore.refresh);
        });

        it('selects space', () => {
          sinon.assert.calledWith(stubs.state.go, 'spaces.detail', { spaceId: 'spaceid' });
        });

        it('creates one API key', function() {
          sinon.assert.calledOnce(stubs.apiKeyRepo.create);
        });
      });

      describe('creating space from template', () => {
        beforeEach(function() {
          stubs.spaceTemplateCreator.getCreator.returns({
            create: sinon.stub().returns({
              contentCreated: $q.resolve(),
              spaceSetup: $q.reject(new Error('something happened'))
            })
          });
          controller.newSpace.data.name = 'name';
          controller.newSpace.useTemplate = true;
          controller.newSpace.selectedTemplate = { name: 'Blog' };
          controller.requestSpaceCreation();
          sinon.spy($rootScope, '$broadcast');
          $apply();
        });

        it('refreshes token', () => {
          sinon.assert.calledOnce(stubs.tokenStore.refresh);
        });

        it('tracks analytics event', () => {
          sinon.assert.calledWith(stubs.analytics.track, 'space:create', {
            templateName: 'Blog',
            entityAutomationScope: { scope: 'space_template' }
          });
        });

        it('triggers a content type refresh', function() {
          sinon.assert.called(this.spaceContext.publishedCTs.refresh);
        });

        it('emits "spaceTemplateCreated" event', () => {
          sinon.assert.calledWith($rootScope.$broadcast, 'spaceTemplateCreated');
        });
      });
    });
  });
});
