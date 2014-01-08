'use strict';

describe('Entry List Actions Controller', function () {
  var controller, scope;
  var getSelectedStub, sizeStub, removeAllStub, actionStub1, actionStub2, createEntryStub,
      getVersionStub, trackStub, infoStub, errorStub, canStub;

  beforeEach(function () {
    trackStub = sinon.stub();
    infoStub = sinon.stub();
    errorStub = sinon.stub();
    sizeStub = sinon.stub();
    createEntryStub = sinon.stub();
    getSelectedStub = sinon.stub();
    removeAllStub = sinon.stub();
    actionStub1 = sinon.stub();
    actionStub2 = sinon.stub();
    getVersionStub = sinon.stub();
    canStub = sinon.stub();

    module('contentful/test', function ($provide) {
      $provide.value('analytics', {
        track: trackStub
      });

      $provide.value('notification', {
        info: infoStub,
        error: errorStub
      });
    });

    inject(function ($rootScope, $controller) {
      scope = $rootScope.$new();

      scope.selection = {
        size: sizeStub,
        getSelected: getSelectedStub,
        removeAll: removeAllStub
      };

      scope.spaceContext = {
        space: {
          createEntry: createEntryStub
        }
      };

      scope.can = canStub;

      scope.broadcastFromSpace = sinon.stub();

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
      entity.getVersion = getVersionStub;
    }
    return entity;
  }

  function makePerformTests(action, actionIndex, extraSpecs){
    describe(action+' selected entries', function () {
      beforeEach(function () {
        sizeStub.returns(2);
        actionStub1.callsArg(actionIndex);
        actionStub2.callsArgWith(actionIndex, {});
        getSelectedStub.returns([
          makeEntity(action, actionStub1),
          makeEntity(action, actionStub2)
        ]);

        scope[action+'Selected']();
      });

      it('calls '+action+' on selected entries', function () {
        expect(actionStub1.called).toBeTruthy();
        expect(actionStub2.called).toBeTruthy();
      });

      it('calls success notification', function () {
        expect(infoStub.calledOnce).toBeTruthy();
      });

      it('calls error notification', function () {
        expect(errorStub.calledOnce).toBeTruthy();
      });

      it('clears selection', function () {
        expect(removeAllStub.called).toBeTruthy();
      });

      it('tracks analytics event', function () {
        expect(trackStub.called).toBeTruthy();
      });

      if(extraSpecs){ extraSpecs(); }
    });
  }

  makePerformTests('publish', 1, function () {
    it('gets version of selected entries', function () {
      expect(getVersionStub.calledTwice).toBeTruthy();
    });
  });
  makePerformTests('unpublish', 0);
  makePerformTests('delete', 0, function () {
    it('broadcasts event for sucessfully deleted entry', function () {
      expect(scope.broadcastFromSpace.calledWith('entityDeleted')).toBeTruthy();
    });
  });
  makePerformTests('archive', 0);
  makePerformTests('unarchive', 0);

  describe('duplicates selected entries', function () {
    beforeEach(function () {
      sizeStub.returns(2);
      actionStub1.returns({contentType: {sys: {id: 'foo'}}});
      actionStub2.returns({contentType: {sys: {id: 'bar'}}});
      createEntryStub.withArgs('foo').callsArg(2);
      createEntryStub.withArgs('bar').callsArgWith(2, {});
      scope.entries = [];
      getSelectedStub.returns([
        { getSys: actionStub1, data: {sys: {}}},
        { getSys: actionStub2, data: {sys: {}}}
      ]);

      scope.duplicateSelected();
    });

    it('calls getSys on selected entries', function () {
      expect(actionStub1.called).toBeTruthy();
      expect(actionStub2.called).toBeTruthy();
    });

    it('attempts to create first entries', function () {
      expect(createEntryStub.calledWith('foo')).toBeTruthy();
    });

    it('attempts to create second entries', function () {
      expect(createEntryStub.calledWith('bar')).toBeTruthy();
    });

    it('calls success notification', function () {
      expect(infoStub.calledOnce).toBeTruthy();
    });

    it('calls error notification', function () {
      expect(errorStub.calledOnce).toBeTruthy();
    });

    it('clears selection', function () {
      expect(removeAllStub.called).toBeTruthy();
    });

    it('tracks analytics event', function () {
      expect(trackStub.called).toBeTruthy();
    });
  });

  it('can show duplicate action', function () {
    canStub.withArgs('create', 'Entry').returns(true);
    expect(scope.showDuplicate()).toBeTruthy();
  });

  it('cannot show duplicate action', function () {
    canStub.withArgs('create', 'Entry').returns(false);
    expect(scope.showDuplicate()).toBeFalsy();
  });

  function makePermissionTests(action){
    var methodName = 'show'+action.charAt(0).toUpperCase()+action.substr(1);
    var canMethodName = 'can'+action.charAt(0).toUpperCase()+action.substr(1);
    it('can show '+action+' action', function () {
      canStub.withArgs(action, 'Entry').returns(true);
      actionStub1.returns(true);
      actionStub2.returns(true);
      getSelectedStub.returns([
        makeEntity(canMethodName, actionStub1),
        makeEntity(canMethodName, actionStub2)
      ]);

      expect(scope[methodName]()).toBeTruthy();
    });

    it('cannot show delete '+action+' because no general permission', function () {
      canStub.withArgs(action, 'Entry').returns(false);
      actionStub1.returns(true);
      actionStub2.returns(true);
      getSelectedStub.returns([
        makeEntity(canMethodName, actionStub1),
        makeEntity(canMethodName, actionStub2)
      ]);

      expect(scope[methodName]()).toBeFalsy();
    });

    it('cannot show '+action+' action because no permission on item', function () {
      canStub.withArgs(action, 'Entry').returns(true);
      actionStub1.returns(true);
      actionStub2.returns(false);
      getSelectedStub.returns([
        makeEntity(canMethodName, actionStub1),
        makeEntity(canMethodName, actionStub2)
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
    actionStub1.returns(false);
    actionStub2.returns(false);
    getSelectedStub.returns([
      makeEntity('isPublished', actionStub1),
      makeEntity('isPublished', actionStub2)
    ]);

    expect(scope.publishButtonName()).toBe('Publish');
  });

  it('gets publish button name if all published', function () {
    actionStub1.returns(true);
    actionStub2.returns(true);
    getSelectedStub.returns([
      makeEntity('isPublished', actionStub1),
      makeEntity('isPublished', actionStub2)
    ]);

    expect(scope.publishButtonName()).toBe('Republish');
  });

  it('gets publish button name not all are published', function () {
    actionStub1.returns(true);
    actionStub2.returns(false);
    getSelectedStub.returns([
      makeEntity('isPublished', actionStub1),
      makeEntity('isPublished', actionStub2)
    ]);

    expect(scope.publishButtonName()).toBe('(Re)publish');
  });

});
