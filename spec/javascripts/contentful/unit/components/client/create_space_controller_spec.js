'use strict';

describe('Create Space Dialog controller', function () {
  var scope, createSpaceCtrl, stubs, createController;
  var org;
  var $q;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'start', 'stop', 'error', 'info', 'createSpace', 'serverError', 'warn', 'then',
        'getId', 'computeUsage', 'confirm', 'cancel'
      ]);

      $provide.value('cfSpinner', {
        start: stubs.start
      });
      stubs.start.returns(stubs.stop);

      $provide.value('notification', {
        serverError: stubs.serverError,
        warn: stubs.warn,
        error: stubs.error,
        info: stubs.info
      });

      $provide.value('client', {
        createSpace: stubs.createSpace
      });

      $provide.value('enforcements', {
        computeUsage: stubs.computeUsage
      });

    });
    inject(function ($rootScope, $controller, _$q_) {
      $q = _$q_;
      scope = $rootScope.$new();
      scope.dialog = {
        confirm: stubs.confirm,
        cancel: stubs.cancel
      };
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

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

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

    it('submit is unlocked', function() {
      expect(scope.lockSubmit).toBeFalsy();
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

    it('does nothing if submit is locked', function() {
      scope.lockSubmit = true;
      scope.createSpace();
      expect(stubs.start).not.toBeCalled();
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

        it('starts spinner', function() {
          expect(stubs.start).toBeCalled();
        });

        it('checks for creation permission', function() {
          expect(scope.canCreateSpaceInOrg).toBeCalledWith('orgid');
        });

        it('cancels dialog', function() {
          expect(stubs.cancel).toBeCalled();
        });

        it('stops spinner', function() {
          expect(stubs.stop).toBeCalled();
        });

        it('shows error', function() {
          expect(stubs.error).toBeCalled();
        });
      });

      describe('if user can create space in org', function() {
        beforeEach(function() {
          scope.canCreateSpaceInOrg.returns(true);
          scope.newSpaceData.name = 'name';
        });

        describe('if remote call fails with no specific error', function() {
          beforeEach(function() {
            stubs.createSpace.returns($q.reject({
              body: {
                details: {
                  errors: []
                }
              }
            }));
            scope.createSpace();
            scope.$apply();
          });

          it('starts spinner', function() {
            expect(stubs.start).toBeCalled();
          });

          it('checks for creation permission', function() {
            expect(scope.canCreateSpaceInOrg).toBeCalledWith('orgid');
          });

          it('calls client lib with data', function() {
            expect(stubs.createSpace.args[0][0].name).toEqual('name');
          });

          it('calls client lib with org id', function() {
            expect(stubs.createSpace.args[0][1]).toEqual('orgid');
          });

          it('computes usage', function() {
            expect(stubs.computeUsage).toBeCalled();
          });

          it('shows server error', function() {
            expect(stubs.serverError).toBeCalled();
          });

          it('cancels dialog', function() {
            expect(stubs.cancel).toBeCalled();
          });

          it('stops spinner', function() {
            expect(stubs.stop).toBeCalled();
          });

          it('unlocks submit', function() {
            expect(scope.lockSubmit).toBeFalsy();
          });
        });

        describe('if remote call fails with a specific error', function() {
          beforeEach(function() {
            stubs.createSpace.returns($q.reject({
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

          it('starts spinner', function() {
            expect(stubs.start).toBeCalled();
          });

          it('checks for creation permission', function() {
            expect(scope.canCreateSpaceInOrg).toBeCalledWith('orgid');
          });

          it('calls client lib with data', function() {
            expect(stubs.createSpace.args[0][0].name).toEqual('name');
          });

          it('calls client lib with org id', function() {
            expect(stubs.createSpace.args[0][1]).toEqual('orgid');
          });

          it('computes usage', function() {
            expect(stubs.computeUsage).toBeCalled();
          });

          it('shows server error', function() {
            expect(stubs.warn).toBeCalled();
          });

          it('does not cancel dialog', function() {
            expect(stubs.cancel).not.toBeCalled();
          });

          it('does stop spinner', function() {
            expect(stubs.stop).toBeCalled();
          });

          it('does not unlock submit', function() {
            expect(scope.lockSubmit).toBeTruthy();
          });
        });

        describe('if remote call succeeds', function() {
          var space;
          beforeEach(function() {
            space = {getId: stubs.getId, data: {name: 'newspace'}};
            scope.spaces = [space];
            stubs.createSpace.returns($q.when(space));
            stubs.getId.returns('spaceid');
            scope.performTokenLookup = sinon.stub().returns($q.when());
            scope.selectSpace = sinon.stub();
            scope.createSpace();
            scope.$apply();
          });

          it('starts spinner', function() {
            expect(stubs.start).toBeCalled();
          });

          it('checks for creation permission', function() {
            expect(scope.canCreateSpaceInOrg).toBeCalledWith('orgid');
          });

          it('calls client lib with data', function() {
            expect(stubs.createSpace.args[0][0].name).toEqual('name');
          });

          it('calls client lib with org id', function() {
            expect(stubs.createSpace.args[0][1]).toEqual('orgid');
          });

          it('performs token lookup', function() {
            expect(scope.performTokenLookup).toBeCalled();
          });

          it('reuses existing space with same id', function() {
            expect(stubs.getId).toBeCalledTwice();
          });

          it('selects space', function() {
            expect(scope.selectSpace).toBeCalledWith(space);
          });

          it('confirms dialog', function() {
            expect(stubs.confirm).toBeCalled();
          });

          it('notification is shown', function() {
            expect(stubs.info).toBeCalled();
          });

          it('space data is reset', function() {
            expect(scope.newSpaceData.name).toBeUndefined();
          });

          it('stops spinner', function() {
            expect(stubs.stop).toBeCalled();
          });

          it('unlocks submit', function() {
            expect(scope.lockSubmit).toBeFalsy();
          });
        });

      });

    });
  });

});
