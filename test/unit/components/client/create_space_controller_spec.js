'use strict';

describe('Create Space Dialog controller', function () {
  var scope, createSpaceCtrl, stubs, createController;
  var org;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'stop', 'then', 'getId', 'timeout'
      ]);

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

      this.broadcastSpy = sinon.spy(this.$rootScope, '$broadcast');
      this.cfSpinner.start = sinon.stub();
      this.cfSpinner.start.returns(stubs.stop);
      this.client.createSpace = sinon.stub();
      this.enforcements.computeUsage = sinon.stub();
      this.enforcements.determineEnforcement = sinon.stub();

      scope = this.$rootScope.$new();
      scope.$emit = sinon.stub();
      scope.$on = sinon.stub();
      scope.$on.withArgs('$routeChangeSuccess').returns(angular.noop);

      org = {sys: {id: 'orgid'}};
      scope.organizations = [
        org
      ];
      scope.canCreateSpaceInOrg = sinon.stub();
      scope.newSpaceForm = {};


      createController = function () {
        createSpaceCtrl = $controller('CreateSpaceDialogController', {$scope: scope});
      };
    });
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
      scope.canCreateSpaceInOrg.withArgs('orgid').returns(true);
      scope.canCreateSpaceInOrg.withArgs('orgid2').returns(false);
      createController();
    });

    it('with only writable orgs', function() {
      expect(scope.writableOrganizations).toEqual([org]);
    });
  });

  describe('on the default state', function() {
    beforeEach(function() {
      scope.canCreateSpaceInOrg.returns(true);
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
          scope.canCreateSpaceInOrg.returns(false);
          scope.createSpace();
        });

        it('broadcasts space creation request', function() {
          sinon.assert.calledWith(this.broadcastSpy, 'spaceCreationRequested');
        });

        it('starts spinner', function() {
          sinon.assert.called(this.cfSpinner.start);
        });

        it('checks for creation permission', function() {
          sinon.assert.calledWith(scope.canCreateSpaceInOrg, 'orgid');
        });

        it('stops spinner', function() {
          sinon.assert.called(stubs.stop);
        });

        it('shows error', function() {
          sinon.assert.called(this.notification.error);
          sinon.assert.called(this.logger.logError);
        });

        it('broadcasts space creation failure', function() {
          sinon.assert.calledWith(this.broadcastSpy, 'spaceCreationFailed');
        });
      });

      describe('if user can create space in org', function() {
        beforeEach(function() {
          scope.canCreateSpaceInOrg.returns(true);
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
            scope.$apply();
          });

          it('broadcasts space creation request', function() {
            sinon.assert.calledWith(this.broadcastSpy, 'spaceCreationRequested');
          });

          it('starts spinner', function() {
            sinon.assert.called(this.cfSpinner.start);
          });

          it('checks for creation permission', function() {
            sinon.assert.calledWith(scope.canCreateSpaceInOrg, 'orgid');
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
            sinon.assert.calledWith(this.broadcastSpy, 'spaceCreationFailed');
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
            scope.$apply();
          });

          it('broadcasts space creation request', function() {
            sinon.assert.calledWith(this.broadcastSpy, 'spaceCreationRequested');
          });

          it('starts spinner', function() {
            sinon.assert.called(this.cfSpinner.start);
          });

          it('checks for creation permission', function() {
            sinon.assert.calledWith(scope.canCreateSpaceInOrg, 'orgid');
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
            sinon.assert.calledWith(this.broadcastSpy, 'spaceCreationFailed');
          });
        });

        describe('if remote call succeeds', function() {
          var space;
          beforeEach(function() {
            space = {getId: stubs.getId, data: {name: 'newspace'}};
            scope.spaces = [space];
            this.client.createSpace.returns(this.$q.when(space));
            stubs.getId.returns('spaceid');
            scope.performTokenLookup = sinon.stub().returns(this.$q.when());
            scope.selectSpace = sinon.stub();
            scope.createSpace();
            scope.$apply();
            scope.$on.yield();
          });

          it('broadcasts space creation request', function() {
            sinon.assert.calledWith(this.broadcastSpy, 'spaceCreationRequested');
          });

          it('starts spinner', function() {
            sinon.assert.called(this.cfSpinner.start);
          });

          it('checks for creation permission', function() {
            sinon.assert.calledWith(scope.canCreateSpaceInOrg, 'orgid');
          });

          it('calls client lib with data', function() {
            expect(this.client.createSpace.args[0][0].name).toEqual('name');
          });

          it('calls client lib with org id', function() {
            expect(this.client.createSpace.args[0][1]).toEqual('orgid');
          });

          it('performs token lookup', function() {
            sinon.assert.called(scope.performTokenLookup);
          });

          it('reuses existing space with same id', function() {
            expect(stubs.getId).toBeCalledTwice();
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
