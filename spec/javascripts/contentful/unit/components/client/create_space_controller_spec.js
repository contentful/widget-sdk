'use strict';

describe('Create Space Dialog controller', function () {
  var scope, createSpaceCtrl, stubs, createController;
  var org;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'setInvalid', 'start', 'stop', 'error', 'info', 'createSpace', 'serverError', 'then',
        'getId', 'computeUsage', 'confirm', 'cancel'
      ]);

      $provide.value('cfSpinner', {
        start: stubs.start
      });
      stubs.start.returns(stubs.stop);

      $provide.value('notification', {
        serverError: stubs.serverError,
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
    inject(function ($rootScope, $controller) {
      scope = $rootScope.$new();
      scope.dialog = {
        setInvalid: stubs.setInvalid,
        confirm: stubs.confirm,
        cancel: stubs.cancel
      };
      org = {org: true};
      scope.organizations = [
        org
      ];
      scope.newSpaceForm = {};

      createController = function () {
        createSpaceCtrl = $controller('CreateSpaceDialogCtrl', {$scope: scope});
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

  describe('on the default state', function() {
    beforeEach(function() {
      createController();
    });

    it('dialog state is set to invalid', function() {
      expect(stubs.setInvalid).toBeCalledWith(true);
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
    expect(stubs.setInvalid).toBeCalledWith(false);
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
        scope.canCreateSpaceInOrg = sinon.stub();
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

        describe('if remote call fails', function() {
          beforeEach(function() {
            stubs.createSpace.callsArgWith(2, {});
            scope.createSpace();
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

        describe('if remote call succeeds', function() {
          var space;
          beforeEach(function() {
            space = {getId: stubs.getId, data: {name: 'newspace'}};
            scope.spaces = [space];
            stubs.createSpace.callsArgWith(2, null, space);
            stubs.getId.returns('spaceid');
            scope.performTokenLookup = sinon.stub();
            scope.performTokenLookup.returns({then: stubs.then});
            scope.selectSpace = sinon.stub();
            stubs.then.callsArg(0);
            scope.createSpace();
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
