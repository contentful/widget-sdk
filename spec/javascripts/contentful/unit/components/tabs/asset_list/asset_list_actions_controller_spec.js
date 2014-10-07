'use strict';

describe('Asset List Actions Controller', function () {
  var controller, scope, stubs;
  var action1, action2, action3, action3call2, action4;

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
        'can',
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
      action3call2 = $q.defer();
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

      scope.can = stubs.can;

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
        stubs.getVersion.returns(3);
        stubs.size.returns(2);
        action1.resolve();
        action2.reject({});
        stubs.action3
          .onFirstCall().returns(action3.promise)
          .onSecondCall().returns(action3call2.promise);
        action3.reject({statusCode: 429});
        action3call2.resolve();
        action4.resolve();
        stubs.getSelected.returns([
          makeEntity(action, stubs.action1),
          makeEntity(action, stubs.action2),
          makeEntity(action, stubs.action3),
          makeEntity(action, stubs.action4)
        ]);
        stubs.timeout.callsArg(0);

        scope[action+'Selected']();
        scope.$apply();
      });

      it('calls '+action+' on first selected entry', function () {
        expect(stubs.action1).toBeCalled();
      });

      it('calls '+action+' on second selected entry', function () {
        expect(stubs.action2).toBeCalled();
      });

      it('calls '+action+' on third selected entry', function () {
        expect(stubs.action3).toBeCalled();
      });

      it('calls '+action+' on fourth selected entry', function () {
        expect(stubs.action4).toBeCalled();
      });

      it('calls success notification', function () {
        expect(stubs.info).toBeCalledOnce();
      });

      it('success notification shown for 3 items', function () {
        expect(stubs.info.args[0][0]).toMatch(/^2*/);
      });

      it('calls warn notification', function () {
        expect(stubs.warn).toBeCalledOnce();
      });

      it('warn notification shown for 1 item', function () {
        expect(stubs.warn.args[0][0]).toMatch(/^2*/);
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
      expect(stubs.getVersion.callCount).toBe(5);
    });

    it('publishes 3rd version', function () {
      expect(stubs.getVersion.getCall(0).returnValue).toBe(3);
    });
  });

  makePerformTests('unpublish', 0);
  makePerformTests('delete', 0, function () {
    it('broadcasts event for sucessfully deleted asset', function () {
      expect(stubs.broadcast).toBeCalledWith('entityDeleted');
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
