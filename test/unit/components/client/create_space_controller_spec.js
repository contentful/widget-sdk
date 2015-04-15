'use strict';

describe('Create Space controller', function () {
  var scope, createSpaceCtrl, stubs, createController;
  var org;

  beforeEach(function () {
    var self = this;
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'stop', 'then', 'getId', 'timeout'
      ]);

      self.tokenStoreStubs = {
        getUpdatedToken: sinon.stub(),
        getSpace: sinon.stub()
      };
      $provide.value('tokenStore', self.tokenStoreStubs);

      $provide.value('$timeout', stubs.timeout);
      stubs.timeout.callsArg(0);
    });
    inject(function ($controller, $injector) {
      this.$rootScope = $injector.get('$rootScope');
      this.logger = $injector.get('logger');
      this.notification = $injector.get('notification');
      this.$q = $injector.get('$q');
      this.client = $injector.get('client');
      this.enforcements = $injector.get('enforcements');
      this.cfSpinner = $injector.get('cfSpinner');

      this.broadcastStub = sinon.stub(this.$rootScope, '$broadcast');
      this.broadcastStub.returns(sinon.stub());
      this.cfSpinner.start = sinon.stub();
      this.cfSpinner.start.returns(stubs.stop);
      this.client.createSpace = sinon.stub();
      this.enforcements.computeUsage = sinon.stub();
      this.enforcements.determineEnforcement = sinon.stub();

      scope = this.$rootScope;
      scope.$emit = sinon.stub();
      scope.$root.$on = sinon.stub();
      scope.$root.$on.withArgs('$stateChangeSuccess').returns(angular.noop);

      org = {sys: {id: 'orgid'}};
      scope.organizations = [
        org
      ];
      scope.permissionController = {};
      scope.permissionController.canCreateSpaceInOrg = sinon.stub();
      scope.newSpaceForm = {};

      scope.setTokenDataOnScope = sinon.stub();

      createController = function () {
        createSpaceCtrl = $controller('CreateSpaceDialogController', {$scope: scope});
      };
    });
  });

  afterEach(function () {
    this.broadcastStub.restore();
  });

  it('does not preselect if no organizations exist', function() {
    scope.organizations = [];
    createController();
    expect(scope.selectedOrganization).toBeUndefined();
  });

  describe('creates an array of writable orgs', function() {
    beforeEach(function() {
      scope.organizations = [
        org,
        {sys: {id: 'orgid2'}},
        {badorg: true}
      ];
      scope.permissionController.canCreateSpaceInOrg.withArgs('orgid').returns(true);
      scope.permissionController.canCreateSpaceInOrg.withArgs('orgid2').returns(false);
      createController();
    });

    it('with only writable orgs', function() {
      expect(scope.writableOrganizations).toEqual([org]);
    });
  });

  describe('on the default state', function() {
    beforeEach(function() {
      scope.permissionController.canCreateSpaceInOrg.returns(true);
      createController();
    });

    it('new space data has default locale', function() {
      expect(scope.newSpaceData.defaultLocale).toBeDefined();
    });

    it('preselects an organization', function() {
      expect(scope.selectedOrganization).toBe(org);
    });
  });

  it('updates state', function() {
    createController();
    scope.newSpaceForm.$invalid = false;
    scope.$digest();
  });

  it('selects an organization', function() {
    createController();
    var neworg = {neworg: true};
    scope.selectOrganization(neworg);
    expect(scope.selectedOrganization).toBe(neworg);
  });

  describe('creates a space', function() {
    beforeEach(function() {
      createController();
    });

    describe('if submit is unlocked', function() {
      beforeEach(function() {
        scope.selectedOrganization = {
          sys: {id: 'orgid'}
        };
      });

      describe('if user cant create space in org', function() {
        beforeEach(function() {
          scope.permissionController.canCreateSpaceInOrg.returns(false);
          scope.createSpace();
        });

        it('broadcasts space creation request', function() {
          sinon.assert.calledWith(this.broadcastStub, 'spaceCreationRequested');
        });

        it('starts spinner', function() {
          sinon.assert.called(this.cfSpinner.start);
        });

        it('checks for creation permission', function() {
          sinon.assert.calledWith(scope.permissionController.canCreateSpaceInOrg, 'orgid');
        });

        it('stops spinner', function() {
          sinon.assert.called(stubs.stop);
        });

        it('shows error', function() {
          sinon.assert.called(this.notification.error);
          sinon.assert.called(this.logger.logError);
        });

        it('broadcasts space creation failure', function() {
          sinon.assert.calledWith(this.broadcastStub, 'spaceCreationFailed');
        });
      });

      describe('if user can create space in org', function() {
        beforeEach(function() {
          scope.permissionController.canCreateSpaceInOrg.returns(true);
          scope.newSpaceData.name = 'name';
        });

        describe('if remote call fails with no specific error', function() {
          beforeEach(function() {
            this.client.createSpace.returns(this.$q.reject({
              body: {
                details: {
                  errors: []
                }
              }
            }));
            scope.createSpace();
            scope.$digest();
          });

          it('broadcasts space creation request', function() {
            sinon.assert.calledWith(this.broadcastStub, 'spaceCreationRequested');
          });

          it('starts spinner', function() {
            sinon.assert.called(this.cfSpinner.start);
          });

          it('checks for creation permission', function() {
            sinon.assert.calledWith(scope.permissionController.canCreateSpaceInOrg, 'orgid');
          });

          it('calls client lib with data', function() {
            expect(this.client.createSpace.args[0][0].name).toEqual('name');
          });

          it('calls client lib with org id', function() {
            expect(this.client.createSpace.args[0][1]).toEqual('orgid');
          });

          it('computes usage', function() {
            sinon.assert.called(this.enforcements.computeUsage);
          });

          it('shows error', function() {
            sinon.assert.called(this.notification.error);
            sinon.assert.called(this.logger.logServerWarn);
          });

          it('stops spinner', function() {
            sinon.assert.called(stubs.stop);
          });

          it('broadcasts space creation failure', function() {
            sinon.assert.calledWith(this.broadcastStub, 'spaceCreationFailed');
          });
        });

        describe('if remote call fails with a specific error', function() {
          beforeEach(function() {
            this.client.createSpace.returns(this.$q.reject({
              body: {
                details: {
                  errors: [
                    {path: 'name', name: 'length'}
                  ]
                }
              }
            }));
            scope.createSpace();
            scope.$digest();
          });

          it('broadcasts space creation request', function() {
            sinon.assert.calledWith(this.broadcastStub, 'spaceCreationRequested');
          });

          it('starts spinner', function() {
            sinon.assert.called(this.cfSpinner.start);
          });

          it('checks for creation permission', function() {
            sinon.assert.calledWith(scope.permissionController.canCreateSpaceInOrg, 'orgid');
          });

          it('calls client lib with data', function() {
            expect(this.client.createSpace.args[0][0].name).toEqual('name');
          });

          it('calls client lib with org id', function() {
            expect(this.client.createSpace.args[0][1]).toEqual('orgid');
          });

          it('computes usage', function() {
            sinon.assert.called(this.enforcements.computeUsage);
          });

          it('shows server error', function() {
            sinon.assert.called(this.notification.warn);
          });

          it('does stop spinner', function() {
            sinon.assert.called(stubs.stop);
          });

          it('broadcasts space creation failure', function() {
            sinon.assert.calledWith(this.broadcastStub, 'spaceCreationFailed');
          });
        });

        describe('if remote call succeeds', function() {
          var space;
          beforeEach(function() {
            space = {getId: stubs.getId, data: {name: 'newspace'}};
            scope.spaces = [space];
            this.client.createSpace.returns(this.$q.when(space));
            stubs.getId.returns('spaceid');
            this.tokenStoreStubs.getUpdatedToken.returns(this.$q.when());
            this.tokenStoreStubs.getSpace.returns(this.$q.when(space));
            scope.selectSpace = sinon.stub();
            scope.createSpace();
            scope.$digest();
            scope.$on.yield();
          });

          it('broadcasts space creation request', function() {
            sinon.assert.calledWith(this.broadcastStub, 'spaceCreationRequested');
          });

          it('starts spinner', function() {
            sinon.assert.called(this.cfSpinner.start);
          });

          it('checks for creation permission', function() {
            sinon.assert.calledWith(scope.permissionController.canCreateSpaceInOrg, 'orgid');
          });

          it('calls client lib with data', function() {
            expect(this.client.createSpace.args[0][0].name).toEqual('name');
          });

          it('calls client lib with org id', function() {
            expect(this.client.createSpace.args[0][1]).toEqual('orgid');
          });

          it('performs token lookup', function() {
            sinon.assert.called(this.tokenStoreStubs.getUpdatedToken);
          });

          it('gets space', function() {
            sinon.assert.called(this.tokenStoreStubs.getSpace);
          });

          it('sets token data on scope', function() {
            sinon.assert.called(scope.setTokenDataOnScope);
          });

          it('reuses existing space with same id', function() {
            sinon.assert.calledOnce(stubs.getId);
          });

          it('selects space', function() {
            sinon.assert.calledWith(scope.selectSpace, space);
          });

          it('stops spinner', function() {
            sinon.assert.called(stubs.stop);
          });

          it('broadcasts space creation', function() {
            sinon.assert.calledWith(scope.$emit, 'spaceCreated');
          });
        });

      });

    });
  });

});
