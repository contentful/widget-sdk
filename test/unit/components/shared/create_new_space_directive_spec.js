import { createMockProperty } from 'helpers/mocks/kefir';

describe('cfCreateNewSpace directive', function () {
  let element, $scope, $rootScope, controller, stubs, $q;
  afterEach(function () {
    element = $scope = $rootScope = controller = stubs = null;
  });

  beforeEach(function () {
    this.org = {sys: {id: 'org_id'}};

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
        user$: createMockProperty({firstName: 'firstName'}),
        getOrganization: sinon.stub().resolves(this.org)
      },
      state: {
        go: sinon.stub().resolves()
      },
      dialog: {
        confirm: sinon.stub()
      }
    };

    module('contentful/test', function ($provide) {
      $provide.value('services/SpaceTemplateLoader', stubs.spaceTemplateLoader);
      $provide.value('services/SpaceTemplateCreator', stubs.spaceTemplateCreator);
      $provide.value('analytics/Analytics', stubs.analytics);
      $provide.value('logger', stubs.logger);
      $provide.value('client', stubs.client);
      $provide.value('services/TokenStore', stubs.tokenStore);
      $provide.value('services/ResourceService', stubs.resourceService);
      $provide.value('$state', stubs.state);
      $provide.removeDirectives('cfIcon');
    });

    this.spaceContext = this.$inject('mocks/spaceContext').init();
    this.spaceContext.getData = sinon.stub();
    this.spaceContext.apiKeyRepo = {create: sinon.stub()};

    stubs.spaceTemplateLoader.getTemplatesList.resolves(true);

    $rootScope = this.$inject('$rootScope');
    $q = this.$inject('$q');

    this.setupDirective = function (organization) {
      element = this.$compile('<cf-create-new-space>', {
        dialog: stubs.dialog,
        organization: organization || this.org
      });
      $scope = element.scope();
      controller = $scope.createSpace;
    };
  });

  describe('on the default state', function () {
    it('new space data has default locale', function () {
      this.setupDirective();
      expect(controller.newSpace.data.defaultLocale).toBe('en-US');
    });

    it('selects given organization', function () {
      this.setupDirective();
      expect(controller.newSpace.organization).toBe(this.org);
    });
  });

  describe('creates a space in a legacy organization', function () {
    it('asks if the space limits have been reached', function () {
      this.setupDirective();
      controller.requestSpaceCreation();
      $rootScope.$digest();

      sinon.assert.called(stubs.resourceService._canCreate);
    });

    describe('if remote call fails with no specific error', function () {
      beforeEach(function () {
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

      it('sends template selection analytics event', function () {
        sinon.assert.calledWith(stubs.analytics.track, 'space:template_selected', {templateName: 'Blank'});
      });

      it('calls client lib with data', function () {
        expect(stubs.client.createSpace.args[0][0].name).toEqual('name');
      });

      it('calls client lib with org id', function () {
        expect(stubs.client.createSpace.args[0][1]).toEqual(this.org.sys.id);
      });

      it('displays and logs error', function () {
        const error = 'Could not create Space. If the problem persists please get in contact with us.';
        expect(controller.newSpace.errors.form).toEqual(error);
        sinon.assert.called(stubs.logger.logServerWarn);
      });
    });

    describe('if remote call fails with a specific error', function () {
      beforeEach(function () {
        stubs.client.createSpace.rejects({
          body: {
            details: {
              errors: [
                {path: 'name', name: 'length'}
              ]
            }
          }
        });
        this.setupDirective();
        controller.newSpace.data.name = 'name';
        controller.requestSpaceCreation();
        $rootScope.$digest();
      });

      it('calls client lib with data', function () {
        expect(stubs.client.createSpace.args[0][0].name).toEqual('name');
      });

      it('calls client lib with org id', function () {
        expect(stubs.client.createSpace.args[0][1]).toEqual(this.org.sys.id);
      });

      it('shows field length error', function () {
        expect(controller.newSpace.errors.fields.name).toEqual('Space name is too long');
      });
    });

    describe('if remote call succeeds', function () {
      beforeEach(function () {
        stubs.tokenStore.refresh.resolves();
        stubs.client.createSpace.resolves({sys: {id: 'spaceid'}, name: 'oldspace'});
        this.spaceContext.apiKeyRepo.create.resolves();
        stubs.spaceTemplateLoader.getTemplate.resolves();
        this.setupDirective();
      });

      describe('no template selected', function () {
        beforeEach(function () {
          controller.newSpace.data.name = 'name';
          controller.newSpace.data.defaultLocale = 'fr';
          controller.requestSpaceCreation();
          $rootScope.$digest();
        });

        it('asks if it can create a new space', function () {
          sinon.assert.called(stubs.resourceService._canCreate);
        });

        it('calls client lib with org name', function () {
          expect(stubs.client.createSpace.args[0][0].name).toEqual('name');
        });

        it('calls client lib with locale', function () {
          expect(stubs.client.createSpace.args[0][0].defaultLocale).toEqual('fr');
        });

        it('calls client lib with org id', function () {
          expect(stubs.client.createSpace.args[0][1]).toEqual(this.org.sys.id);
        });

        it('performs token refresh', function () {
          sinon.assert.called(stubs.tokenStore.refresh);
        });

        it('selects space', function () {
          sinon.assert.calledWith(stubs.state.go, 'spaces.detail', {spaceId: 'spaceid'});
        });

        it('creates one API key', function () {
          sinon.assert.calledOnce(this.spaceContext.apiKeyRepo.create);
        });
      });

      describe('creating space from template', function () {
        beforeEach(function () {
          stubs.spaceTemplateCreator.getCreator.returns({
            create: sinon.stub().returns({
              contentCreated: $q.resolve(),
              spaceSetup: $q.reject(new Error('something happened'))
            })
          });
          controller.newSpace.data.name = 'name';
          controller.newSpace.useTemplate = true;
          controller.newSpace.selectedTemplate = {name: 'Blog'};
          controller.requestSpaceCreation();
          sinon.spy($rootScope, '$broadcast');
          this.$apply();
        });

        it('refreshes token', function () {
          sinon.assert.calledOnce(stubs.tokenStore.refresh);
        });

        it('tracks analytics event', function () {
          sinon.assert.calledWith(
            stubs.analytics.track,
            'space:create',
            {templateName: 'Blog', entityAutomationScope: {scope: 'space_template'}}
          );
        });

        it('triggers a content type refresh', function () {
          sinon.assert.called(this.spaceContext.publishedCTs.refresh);
        });

        it('emits "spaceTemplateCreated" event', function () {
          sinon.assert.calledWith($rootScope.$broadcast, 'spaceTemplateCreated');
        });
      });
    });
  });
});
