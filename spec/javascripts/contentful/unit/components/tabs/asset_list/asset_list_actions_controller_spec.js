'use strict';

describe('Asset List Actions Controller', function () {
  var controller, scope, stubs;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'track',
        'info',
        'error',
        'size',
        'createAsset',
        'getSelected',
        'removeAll',
        'action1',
        'action2',
        'getVersion',
        'can'
      ]);
      $provide.value('analytics', {
        track: stubs.track
      });

      $provide.value('notification', {
        info: stubs.info,
        error: stubs.error
      });
    });

    inject(function ($rootScope, $controller) {
      scope = $rootScope.$new();

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

      scope.can = stubs.can;
      scope.broadcastFromSpace = sinon.stub();

      controller = $controller('AssetListActionsCtrl', {$scope: scope});
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

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
        stubs.size.returns(2);
        stubs.action1.callsArg(actionIndex);
        stubs.action2.callsArgWith(actionIndex, {});
        stubs.getSelected.returns([
          makeEntity(action, stubs.action1),
          makeEntity(action, stubs.action2)
        ]);

        scope[action+'Selected']();
      });

      it('calls '+action+' on selected assets', function () {
        expect(stubs.action1).toBeCalled();
        expect(stubs.action2).toBeCalled();
      });

      it('calls success notification', function () {
        expect(stubs.info).toBeCalledOnce();
      });

      it('calls error notification', function () {
        expect(stubs.error).toBeCalledOnce();
      });

      it('clears selection', function () {
        expect(stubs.removeAll).toBeCalled();
      });

      it('tracks analytics event', function () {
        expect(stubs.track).toBeCalled();
      });

      if(extraSpecs){ extraSpecs(); }
    });
  }

  makePerformTests('publish', 1, function () {
    it('gets version of selected assets', function () {
      expect(stubs.getVersion).toBeCalledTwice();
    });
  });
  makePerformTests('unpublish', 0);
  makePerformTests('delete', 0, function () {
    it('broadcasts event for sucessfully deleted asset', function () {
      expect(scope.broadcastFromSpace).toBeCalledWith('entityDeleted');
    });
  });
  makePerformTests('archive', 0);
  makePerformTests('unarchive', 0);

  function makePermissionTests(action){
    var methodName = 'show'+action.charAt(0).toUpperCase()+action.substr(1);
    var canMethodName = 'can'+action.charAt(0).toUpperCase()+action.substr(1);
    it('can show '+action+' action', function () {
      stubs.can.withArgs(action, 'Asset').returns(true);
      stubs.action1.returns(true);
      stubs.action2.returns(true);
      stubs.getSelected.returns([
        makeEntity(canMethodName, stubs.action1),
        makeEntity(canMethodName, stubs.action2)
      ]);

      expect(scope[methodName]()).toBeTruthy();
    });

    it('cannot show delete '+action+' because no general permission', function () {
      stubs.can.withArgs(action, 'Asset').returns(false);
      stubs.action1.returns(true);
      stubs.action2.returns(true);
      stubs.getSelected.returns([
        makeEntity(canMethodName, stubs.action1),
        makeEntity(canMethodName, stubs.action2)
      ]);

      expect(scope[methodName]()).toBeFalsy();
    });

    it('cannot show '+action+' action because no permission on item', function () {
      stubs.can.withArgs(action, 'Asset').returns(true);
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
