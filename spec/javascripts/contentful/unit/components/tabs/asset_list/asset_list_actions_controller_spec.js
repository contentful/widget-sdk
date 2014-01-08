'use strict';

describe('Asset List Actions Controller', function () {
  var controller, scope;
  var getSelectedStub, sizeStub, removeAllStub, actionStub1, actionStub2, createAssetStub,
      getVersionStub, trackStub, infoStub, errorStub, canStub;

  beforeEach(function () {
    trackStub = sinon.stub();
    infoStub = sinon.stub();
    errorStub = sinon.stub();
    sizeStub = sinon.stub();
    createAssetStub = sinon.stub();
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
          createAsset: createAssetStub
        }
      };

      scope.can = canStub;

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
      entity.getVersion = getVersionStub;
    }
    return entity;
  }

  function makePerformTests(action, actionIndex, extraSpecs){
    describe(action+' selected assets', function () {
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

      it('calls '+action+' on selected assets', function () {
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
    it('gets version of selected assets', function () {
      expect(getVersionStub.calledTwice).toBeTruthy();
    });
  });
  makePerformTests('unpublish', 0);
  makePerformTests('delete', 0, function () {
    it('broadcasts event for sucessfully deleted asset', function () {
      expect(scope.broadcastFromSpace.calledWith('entityDeleted')).toBeTruthy();
    });
  });
  makePerformTests('archive', 0);
  makePerformTests('unarchive', 0);

  function makePermissionTests(action){
    var methodName = 'show'+action.charAt(0).toUpperCase()+action.substr(1);
    var canMethodName = 'can'+action.charAt(0).toUpperCase()+action.substr(1);
    it('can show '+action+' action', function () {
      canStub.withArgs(action, 'Asset').returns(true);
      actionStub1.returns(true);
      actionStub2.returns(true);
      getSelectedStub.returns([
        makeEntity(canMethodName, actionStub1),
        makeEntity(canMethodName, actionStub2)
      ]);

      expect(scope[methodName]()).toBeTruthy();
    });

    it('cannot show delete '+action+' because no general permission', function () {
      canStub.withArgs(action, 'Asset').returns(false);
      actionStub1.returns(true);
      actionStub2.returns(true);
      getSelectedStub.returns([
        makeEntity(canMethodName, actionStub1),
        makeEntity(canMethodName, actionStub2)
      ]);

      expect(scope[methodName]()).toBeFalsy();
    });

    it('cannot show '+action+' action because no permission on item', function () {
      canStub.withArgs(action, 'Asset').returns(true);
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
