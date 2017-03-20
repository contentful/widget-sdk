describe('cfCreateNewSpace directive', function () {

  let element, $scope, $rootScope, controller;
  let stubs;

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
      enforcements: {
        computeUsage: sinon.stub()
      },
      tokenStore: {
        refresh: sinon.stub(),
        getSpace: sinon.stub()
      },
      space: {
        getId: sinon.stub()
      },
      state: {
        go: sinon.stub()
      },
      dialog: {
        confirm: sinon.stub()
      },
      OrganizationList: {
        getAll: sinon.stub()
      },
      spaceContext: {
        getData: sinon.stub(),
        space: {
          createDeliveryApiKey: sinon.stub()
        }
      }
    };

    module('contentful/test', function ($provide) {
      $provide.value('spaceTemplateLoader', stubs.spaceTemplateLoader);
      $provide.value('spaceTemplateCreator', stubs.spaceTemplateCreator);
      $provide.value('accessChecker', stubs.accessChecker);
      $provide.value('analytics/Analytics', stubs.analytics);
      $provide.value('logger', stubs.logger);
      $provide.value('client', stubs.client);
      $provide.value('enforcements', stubs.enforcements);
      $provide.value('tokenStore', stubs.tokenStore);
      $provide.value('$state', stubs.state);
      $provide.value('OrganizationList', stubs.OrganizationList);
      $provide.value('spaceContext', stubs.spaceContext);
      $provide.removeDirectives('cfIcon');
      $provide.stubLaunchDarkly();
    });

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
      stubs.OrganizationList.getAll.returns(this.orgs);
      stubs.accessChecker.canCreateSpaceInOrganization.withArgs('orgid').returns(true);
      stubs.accessChecker.canCreateSpaceInOrganization.withArgs('orgid2').returns(false);
      this.setupDirective();
    });

    it('with only writable orgs', function () {
      expect(controller.writableOrganizations).toEqual([this.org]);
    });
  });

  describe('on the default state', function () {
    beforeEach(function () {
      this.org = {sys: {id: 'orgid'}};
      this.org2 = {sys: {id: 'orgid2'}};
      this.orgs = [this.org, this.org2];
      stubs.OrganizationList.getAll.returns(this.orgs);
      stubs.accessChecker.canCreateSpaceInOrganization.returns(true);
    });

    it('new space data has default locale', function () {
      this.setupDirective();
      expect(controller.newSpace.data.defaultLocale).toBe('en-US');
    });

    it('preselects the first organization', function () {
      this.setupDirective();
      expect(controller.newSpace.organization).toBe(this.org);
    });

    it('preselects the organization with matching id', function () {
      this.setupDirective('orgid2');
      expect(controller.newSpace.organization).toBe(this.org2);
    });
  });

  describe('creates a space', function () {
    beforeEach(function () {
      this.orgs = [{sys: {id: 'orgid'}}];
      stubs.OrganizationList.getAll.returns(this.orgs);
    });

    describe('if user cant create space in org', function () {
      beforeEach(function () {
        stubs.accessChecker.canCreateSpaceInOrganization.returns(false);
        this.setupDirective();
        controller.newSpace.data.name = 'My new space';
        controller.requestSpaceCreation();
        $rootScope.$digest();
      });

      it('checks for creation permission', function () {
        sinon.assert.calledWith(stubs.accessChecker.canCreateSpaceInOrganization, 'orgid');
      });

      it('shows error', function () {
        expect(controller.newSpace.errors.form).toEqual('You don’t have permission to create a space');
        sinon.assert.called(stubs.logger.logError);
      });
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

        it('computes usage', function () {
          sinon.assert.called(stubs.enforcements.computeUsage);
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

        it('computes usage', function () {
          sinon.assert.called(stubs.enforcements.computeUsage);
        });

        it('shows field length error', function () {
          expect(controller.newSpace.errors.fields.name).toEqual('Space name is too long');
        });
      });

      describe('if remote call succeeds', function () {
        let space;
        afterEach(function () {
          space = null;
        });

        beforeEach(function () {
          space = {getId: stubs.space.getId, data: {name: 'oldspace'}};
          stubs.space.getId.returns('spaceid');
          stubs.accessChecker.canCreateSpaceInOrganization.returns(true);
          stubs.tokenStore.refresh.resolves();
          stubs.client.createSpace.resolves(space);
          stubs.tokenStore.getSpace.resolves(space);
          stubs.spaceContext.space.createDeliveryApiKey.resolves();
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

          it('gets space', function () {
            sinon.assert.called(stubs.tokenStore.getSpace);
          });

          it('selects space', function () {
            sinon.assert.calledWith(stubs.state.go, 'spaces.detail', {spaceId: 'spaceid'});
          });

          it('creates one Delivery API key', function () {
            sinon.assert.calledOnce(stubs.spaceContext.space.createDeliveryApiKey);
          });
        });

        describe('template was selected', function () {
          beforeEach(function () {
            stubs.spaceTemplateCreator.getCreator.returns({
              create: stubs.spaceTemplateCreator.create.resolves()
            });
            controller.newSpace.data.name = 'name';
            controller.newSpace.useTemplate = true;
            controller.newSpace.selectedTemplate = {name: 'Blog'};
            controller.requestSpaceCreation();
            $rootScope.$digest();
          });

          it('refreshes token', function () {
            sinon.assert.calledOnce(stubs.tokenStore.refresh);
            sinon.assert.calledOnce(stubs.tokenStore.getSpace);
          });

          it('tracks analytics event', function () {
            sinon.assert.calledWith(
              stubs.analytics.track,
              'space:create',
              {templateName: 'Blog'}
            );
          });
        });
      });
    });
  });
});
