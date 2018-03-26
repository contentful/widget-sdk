import { createMockProperty } from 'helpers/mocks/kefir';

describe('cfCreateNewSpace directive', function () {
  let element, $scope, $rootScope, controller, stubs;
  afterEach(function () {
    element = $scope = $rootScope = controller = stubs = null;
  });

  beforeEach(function () {
    stubs = {
      spaceTemplateLoader: {
        getTemplatesList: sinon.stub(),
        getTemplate: sinon.stub()
      },
      spaceTemplateCreator: {
        getCreator: sinon.stub(),
        create: sinon.stub()
      },
      accessChecker: {
        canCreateSpaceInOrganization: sinon.stub()
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
        organizations$: createMockProperty([])
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
      $provide.value('access_control/AccessChecker', stubs.accessChecker);
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

    this.setupDirective = function (organizationId) {
      element = this.$compile('<cf-create-new-space>', {
        dialog: stubs.dialog,
        organizationId: organizationId
      });
      $scope = element.scope();
      controller = $scope.createSpace;
    };
  });

  it('does not preselect if no organizations exist', function () {
    this.setupDirective();
    expect(controller.newSpace.organization).toBeUndefined();
  });

  describe('creates an array of writable orgs', function () {
    beforeEach(function () {
      this.org = {sys: {id: 'orgid'}};
      this.orgs = [
        this.org,
        {sys: {id: 'orgid2'}},
        {badorg: true}
      ];
      stubs.tokenStore.organizations$.set(this.orgs);
      stubs.accessChecker.canCreateSpaceInOrganization.withArgs('orgid').returns(true);
      stubs.accessChecker.canCreateSpaceInOrganization.withArgs('orgid2').returns(false);
      this.setupDirective();
    });

    it('with only writable orgs', function () {
      expect(controller.writableOrganizations.map((o) => o.sys.id)).toEqual(['orgid']);
    });
  });

  describe('on the default state', function () {
    beforeEach(function () {
      this.org = {sys: {id: 'orgid'}};
      this.org2 = {sys: {id: 'orgid2'}};
      this.orgs = [this.org, this.org2];
      stubs.tokenStore.organizations$.set(this.orgs);
      stubs.accessChecker.canCreateSpaceInOrganization.returns(true);
    });

    it('new space data has default locale', function () {
      this.setupDirective();
      expect(controller.newSpace.data.defaultLocale).toBe('en-US');
    });

    it('preselects the first organization', function () {
      this.setupDirective();
      expect(controller.newSpace.organization.sys.id).toBe('orgid');
    });

    it('preselects the organization with matching id', function () {
      this.setupDirective('orgid2');
      expect(controller.newSpace.organization.sys.id).toBe('orgid2');
    });
  });

  describe('creates a space', function () {
    beforeEach(function () {
      this.orgs = [{sys: {id: 'orgid'}}];
      stubs.tokenStore.organizations$.set(this.orgs);
    });

    describe('in a legacy organization', function () {
      it('asks if the space limits have been reached', function () {
        stubs.accessChecker.canCreateSpaceInOrganization.returns(true);
        this.setupDirective();
        controller.requestSpaceCreation();
        $rootScope.$digest();

        sinon.assert.called(stubs.resourceService._canCreate);
      });
    });

    describe('in a non-legacy organization', function () {
      it('does not ask if the space limits have been reached', function () {
        stubs.tokenStore.organizations$.set([
          {
            sys: {
              id: 'orgid'
            },
            pricingVersion: 'pricing_version_2'
          }
        ]);

        stubs.accessChecker.canCreateSpaceInOrganization.returns(true);
        this.setupDirective();
        controller.requestSpaceCreation();
        $rootScope.$digest();

        sinon.assert.notCalled(stubs.resourceService._canCreate);
      });
    });

    it('checks for creation permission', function () {
      stubs.accessChecker.canCreateSpaceInOrganization.returns(false);
      this.setupDirective();
      controller.newSpace.data.name = 'My new space';
      controller.requestSpaceCreation();
      $rootScope.$digest();
      sinon.assert.calledWith(stubs.accessChecker.canCreateSpaceInOrganization, 'orgid');
    });

    describe('if user can create space in org', function () {
      beforeEach(function () {
        stubs.accessChecker.canCreateSpaceInOrganization.returns(true);
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

        it('checks for creation permission', function () {
          sinon.assert.calledWith(stubs.accessChecker.canCreateSpaceInOrganization, 'orgid');
        });

        it('sends template selection analytics event', function () {
          sinon.assert.calledWith(stubs.analytics.track, 'space:template_selected', {templateName: 'Blank'});
        });

        it('calls client lib with data', function () {
          expect(stubs.client.createSpace.args[0][0].name).toEqual('name');
        });

        it('calls client lib with org id', function () {
          expect(stubs.client.createSpace.args[0][1]).toEqual('orgid');
        });

        it('displays and logs error', function () {
          const error = 'Could not create Space. If the problem persists please get in contact with us.';
          expect(controller.newSpace.errors.form).toEqual(error);
          sinon.assert.called(stubs.logger.logServerWarn);
        });
      });

      describe('if remote call fails with a specific error', function () {
        beforeEach(function () {
          stubs.accessChecker.canCreateSpaceInOrganization.returns(true);
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

        it('checks for creation permission', function () {
          sinon.assert.calledWith(stubs.accessChecker.canCreateSpaceInOrganization, 'orgid');
        });

        it('calls client lib with data', function () {
          expect(stubs.client.createSpace.args[0][0].name).toEqual('name');
        });

        it('calls client lib with org id', function () {
          expect(stubs.client.createSpace.args[0][1]).toEqual('orgid');
        });

        it('shows field length error', function () {
          expect(controller.newSpace.errors.fields.name).toEqual('Space name is too long');
        });
      });

      describe('if remote call succeeds', function () {
        beforeEach(function () {
          stubs.accessChecker.canCreateSpaceInOrganization.returns(true);
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

          it('checks for creation permission', function () {
            sinon.assert.calledWith(stubs.accessChecker.canCreateSpaceInOrganization, 'orgid');
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
            expect(stubs.client.createSpace.args[0][1]).toEqual('orgid');
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
                contentCreated: Promise.resolve(),
                spaceSetup: Promise.reject(new Error('something happened'))
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
              {templateName: 'Blog'}
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
});
