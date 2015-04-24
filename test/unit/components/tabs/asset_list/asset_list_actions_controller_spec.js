'use strict';

describe('Asset List Actions Controller', function () {
  var controller, scope, stubs;
  var action1, action2, action3, action4;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'track',
        'info',
        'warn',
        'size',
        'createAsset',
        'getSelected',
        'removeAll',
        'action1',
        'action2',
        'action3',
        'action4',
        'getVersion',
        'timeout',
        'broadcast'
      ]);
      $provide.value('analytics', {
        track: stubs.track
      });

      $provide.value('notification', {
        info: stubs.info,
        warn: stubs.warn
      });

      $provide.value('$timeout', stubs.timeout);
    });

    inject(function ($rootScope, $controller, $q) {
      $rootScope.$broadcast = stubs.broadcast;
      scope = $rootScope.$new();

      action1 = $q.defer();
      action2 = $q.defer();
      action3 = $q.defer();
      action4 = $q.defer();
      stubs.action1.returns(action1.promise);
      stubs.action2.returns(action2.promise);
      stubs.action3.returns(action3.promise);
      stubs.action4.returns(action4.promise);

      scope.selection = {
        size: stubs.size,
        getSelected: stubs.getSelected,
        removeAll: stubs.removeAll
      };

      scope.spaceContext = {
        space: {
          createAsset: stubs.createAsset
        }
      };

      scope.permissionController = {
        get: sinon.stub()
      };

      controller = $controller('AssetListActionsController', {$scope: scope});
    });
  });

  function makeEntity(action, stub) {
    var entity = {};
    entity[action] = stub;
    if(action == 'publish'){
      entity.getVersion = stubs.getVersion;
    }
    return entity;
  }

  function makePerformTests(action, actionIndex, extraSpecs){
    describe(action+' selected assets', function () {
      beforeEach(function () {
        stubs.getVersion.returns(3);
        stubs.size.returns(2);
        action1.resolve();
        action2.reject({});
        action3.resolve();
        action4.resolve();
        stubs.getSelected.returns([
          makeEntity(action, stubs.action1),
          makeEntity(action, stubs.action2),
          makeEntity(action, stubs.action3),
          makeEntity(action, stubs.action4)
        ]);
        stubs.timeout.callsArg(0);

        scope[action+'Selected']();
        scope.$digest();
      });

      it('calls '+action+' on first selected entry', function () {
        sinon.assert.called(stubs.action1);
      });

      it('calls '+action+' on second selected entry', function () {
        sinon.assert.called(stubs.action2);
      });

      it('calls '+action+' on third selected entry', function () {
        sinon.assert.called(stubs.action3);
      });

      it('calls '+action+' on fourth selected entry', function () {
        sinon.assert.called(stubs.action4);
      });

      it('calls success notification', function () {
        sinon.assert.calledOnce(stubs.info);
      });

      it('success notification shown for 3 items', function () {
        expect(stubs.info.args[0][0]).toMatch(/^2*/);
      });

      it('calls warn notification', function () {
        sinon.assert.calledOnce(stubs.warn);
      });

      it('warn notification shown for 1 item', function () {
        expect(stubs.warn.args[0][0]).toMatch(/^2*/);
      });

      it('clears selection', function () {
        sinon.assert.called(stubs.removeAll);
      });

      it('tracks analytics event', function () {
        sinon.assert.called(stubs.track);
      });

      if(extraSpecs){ extraSpecs(); }
    });
  }

  makePerformTests('publish', 1, function () {
    it('gets version of selected assets', function () {
      expect(stubs.getVersion.callCount).toBe(4);
    });

    it('publishes 3rd version', function () {
      expect(stubs.getVersion.getCall(0).returnValue).toBe(3);
    });
  });

  makePerformTests('unpublish', 0);
  makePerformTests('delete', 0, function () {
    it('broadcasts event for sucessfully deleted asset', function () {
      sinon.assert.calledWith(stubs.broadcast, 'entityDeleted');
    });
  });

  makePerformTests('archive', 0);
  makePerformTests('unarchive', 0);

  function makePermissionTests(action){
    var methodName = 'show'+action.charAt(0).toUpperCase()+action.substr(1);
    var canMethodName = 'can'+action.charAt(0).toUpperCase()+action.substr(1);
    it('can show '+action+' action', function () {
      stubs.action1.returns(true);
      stubs.action2.returns(true);
      stubs.getSelected.returns([
        makeEntity(canMethodName, stubs.action1),
        makeEntity(canMethodName, stubs.action2)
      ]);

      expect(scope[methodName]()).toBeTruthy();
    });

    it('cannot show delete '+action+' because no general permission', function () {
      scope.permissionController.get.withArgs(action+'Asset', 'shouldHide').returns(true);
      stubs.action1.returns(true);
      stubs.action2.returns(true);
      stubs.getSelected.returns([
        makeEntity(canMethodName, stubs.action1),
        makeEntity(canMethodName, stubs.action2)
      ]);

      expect(scope[methodName]()).toBeFalsy();
    });

    it('cannot show '+action+' action because no permission on item', function () {
      stubs.action1.returns(true);
      stubs.action2.returns(false);
      stubs.getSelected.returns([
        makeEntity(canMethodName, stubs.action1),
        makeEntity(canMethodName, stubs.action2)
      ]);

      expect(scope[methodName]()).toBeFalsy();
    });
  }
  makePermissionTests('delete');
  makePermissionTests('archive');
  makePermissionTests('unarchive');
  makePermissionTests('publish');
  makePermissionTests('unpublish');

  it('gets publish button name if all are unpublished', function () {
    stubs.action1.returns(false);
    stubs.action2.returns(false);
    stubs.getSelected.returns([
      makeEntity('isPublished', stubs.action1),
      makeEntity('isPublished', stubs.action2)
    ]);

    expect(scope.publishButtonName()).toBe('Publish');
  });

  it('gets publish button name if all published', function () {
    stubs.action1.returns(true);
    stubs.action2.returns(true);
    stubs.getSelected.returns([
      makeEntity('isPublished', stubs.action1),
      makeEntity('isPublished', stubs.action2)
    ]);

    expect(scope.publishButtonName()).toBe('Republish');
  });

  it('gets publish button name not all are published', function () {
    stubs.action1.returns(true);
    stubs.action2.returns(false);
    stubs.getSelected.returns([
      makeEntity('isPublished', stubs.action1),
      makeEntity('isPublished', stubs.action2)
    ]);

    expect(scope.publishButtonName()).toBe('(Re)publish');
  });

});
