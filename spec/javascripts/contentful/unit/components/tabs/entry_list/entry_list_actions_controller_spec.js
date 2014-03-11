'use strict';

describe('Entry List Actions Controller', function () {
  var controller, scope, stubs;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'track',
        'info',
        'warn',
        'size',
        'createEntry',
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

    inject(function ($rootScope, $controller) {
      $rootScope.$broadcast = stubs.broadcast;
      scope = $rootScope.$new();

      scope.selection = {
        size: stubs.size,
        getSelected: stubs.getSelected,
        removeAll: stubs.removeAll
      };

      scope.spaceContext = {
        space: {
          createEntry: stubs.createEntry
        }
      };

      scope.can = stubs.can;

      controller = $controller('EntryListActionsCtrl', {$scope: scope});
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
    describe(action+' selected entries', function () {
      beforeEach(function () {
        stubs.getVersion.returns(3);
        stubs.size.returns(2);
        stubs.action1.callsArg(actionIndex);
        stubs.action2.callsArgWith(actionIndex, {});
        stubs.action3
          .onFirstCall().callsArgWith(actionIndex, {statusCode: 429})
          .onSecondCall().callsArgWith(actionIndex);
        stubs.action4.callsArg(actionIndex);
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
    it('gets version of selected entries', function () {
      expect(stubs.getVersion.callCount).toBe(5);
    });

    it('publishes 3rd version', function () {
      expect(stubs.getVersion.getCall(0).returnValue).toBe(3);
    });
  });

  makePerformTests('unpublish', 0);
  makePerformTests('delete', 0, function () {
    it('broadcasts event for sucessfully deleted entry', function () {
      expect(stubs.broadcast).toBeCalledWith('entityDeleted');
    });
  });

  makePerformTests('archive', 0);
  makePerformTests('unarchive', 0);

  describe('duplicates selected entries', function () {
    beforeEach(function () {
      stubs.size.returns(2);
      stubs.action1.returns({contentType: {sys: {id: 'foo'}}});
      stubs.action2.returns({contentType: {sys: {id: 'bar'}}});
      stubs.createEntry.withArgs('foo').callsArg(2);
      stubs.createEntry.withArgs('bar').callsArgWith(2, {});
      scope.entries = [];
      stubs.getSelected.returns([
        { getSys: stubs.action1, data: {sys: {}}},
        { getSys: stubs.action2, data: {sys: {}}}
      ]);

      scope.duplicateSelected();
      scope.$apply();
    });

    it('calls getSys on first selected entry', function () {
      expect(stubs.action1).toBeCalled();
    });

    it('calls getSys on second selected entry', function () {
      expect(stubs.action2).toBeCalled();
    });

    it('attempts to create first entries', function () {
      expect(stubs.createEntry).toBeCalledWith('foo');
    });

    it('attempts to create second entries', function () {
      expect(stubs.createEntry).toBeCalledWith('bar');
    });

    it('calls success notification', function () {
      expect(stubs.info).toBeCalledOnce();
    });

    it('calls warn notification', function () {
      expect(stubs.warn).toBeCalledOnce();
    });

    it('clears selection', function () {
      expect(stubs.removeAll).toBeCalled();
    });

    it('tracks analytics event', function () {
      expect(stubs.track).toBeCalled();
    });
  });

  it('can show duplicate action', function () {
    stubs.can.withArgs('create', 'Entry').returns(true);
    expect(scope.showDuplicate()).toBeTruthy();
  });

  it('cannot show duplicate action', function () {
    stubs.can.withArgs('create', 'Entry').returns(false);
    expect(scope.showDuplicate()).toBeFalsy();
  });

  function makePermissionTests(action){
    var methodName = 'show'+action.charAt(0).toUpperCase()+action.substr(1);
    var canMethodName = 'can'+action.charAt(0).toUpperCase()+action.substr(1);
    it('can show '+action+' action', function () {
      stubs.can.withArgs(action, 'Entry').returns(true);
      stubs.action1.returns(true);
      stubs.action2.returns(true);
      stubs.getSelected.returns([
        makeEntity(canMethodName, stubs.action1),
        makeEntity(canMethodName, stubs.action2)
      ]);

      expect(scope[methodName]()).toBeTruthy();
    });

    it('cannot show delete '+action+' because no general permission', function () {
      stubs.can.withArgs(action, 'Entry').returns(false);
      stubs.action1.returns(true);
      stubs.action2.returns(true);
      stubs.getSelected.returns([
        makeEntity(canMethodName, stubs.action1),
        makeEntity(canMethodName, stubs.action2)
      ]);

      expect(scope[methodName]()).toBeFalsy();
    });

    it('cannot show '+action+' action because no permission on item', function () {
      stubs.can.withArgs(action, 'Entry').returns(true);
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
