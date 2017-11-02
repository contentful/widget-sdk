'use strict';

describe('Asset List Actions Controller', function () {
  let scope, stubs, accessChecker;
  let action1, action2, action3, action4;

  afterEach(function () {
    scope = stubs = accessChecker = null;
    action1 = action2 = action3 = action4 = null;
  });

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'track',
        'info',
        'warn',
        'size',
        'createAsset',
        'getSelected',
        'clear',
        'action1',
        'action2',
        'action3',
        'action4',
        'timeout'
      ]);

      $provide.value('analytics/Analytics', {
        track: stubs.track
      });

      $provide.value('notification', {
        info: stubs.info,
        warn: stubs.warn
      });

      $provide.value('$timeout', stubs.timeout);
    });

    const $q = this.$inject('$q');
    action1 = $q.defer();
    action2 = $q.defer();
    action3 = $q.defer();
    action4 = $q.defer();
    stubs.action1.returns(action1.promise);
    stubs.action2.returns(action2.promise);
    stubs.action3.returns(action3.promise);
    stubs.action4.returns(action4.promise);

    scope = this.$inject('$rootScope').$new();
    scope.selection = {
      size: stubs.size,
      getSelected: stubs.getSelected.returns([]),
      clear: stubs.clear
    };

    const spaceContext = this.$inject('mocks/spaceContext').init();
    spaceContext.space = {createAsset: stubs.createAsset};

    accessChecker = this.$inject('accessChecker');
    accessChecker.canPerformActionOnEntity = sinon.stub();

    const $controller = this.$inject('$controller');
    $controller('AssetListActionsController', {$scope: scope});
  });

  function makeEntity (action, stub) {
    const entity = {data: {sys: {id: 'entityid'}}};
    entity[action] = stub;
    return entity;
  }

  function makePerformTests (action, extraSpecs) {
    describe(action + ' selected assets', function () {
      beforeEach(function () {
        stubs.size.returns(2);
        const entities = [
          makeEntity(action, stubs.action1),
          makeEntity(action, stubs.action2),
          makeEntity(action, stubs.action3),
          makeEntity(action, stubs.action4)
        ];
        action1.resolve(entities[0]);
        action2.reject(new Error('boom'));
        action3.resolve(entities[2]);
        action4.resolve(entities[3]);
        stubs.getSelected.returns(entities);
        stubs.timeout.callsArg(0);

        scope[action + 'Selected']();
        scope.$digest();
      });

      it('calls ' + action + ' on first selected entry', function () {
        sinon.assert.called(stubs.action1);
      });

      it('calls ' + action + ' on second selected entry', function () {
        sinon.assert.called(stubs.action2);
      });

      it('calls ' + action + ' on third selected entry', function () {
        sinon.assert.called(stubs.action3);
      });

      it('calls ' + action + ' on fourth selected entry', function () {
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
        sinon.assert.called(stubs.clear);
      });

      it('tracks analytics event', function () {
        sinon.assert.called(stubs.track);
      });

      if (extraSpecs) {
        extraSpecs();
      }
    });
  }

  makePerformTests('publish');
  makePerformTests('unpublish');
  makePerformTests('delete');
  makePerformTests('archive');
  makePerformTests('unarchive');

  function makePermissionTests (action) {
    const methodName = 'show' + action.charAt(0).toUpperCase() + action.substr(1);
    const canMethodName = 'can' + action.charAt(0).toUpperCase() + action.substr(1);

    it('can show ' + action + ' action', function () {
      stubs.action1.returns(true);
      stubs.action2.returns(true);
      accessChecker.canPerformActionOnEntity.returns(true);
      stubs.getSelected.returns([
        makeEntity(canMethodName, stubs.action1),
        makeEntity(canMethodName, stubs.action2)
      ]);

      expect(scope[methodName]()).toBeTruthy();
    });

    it('cannot show delete ' + action + ' because no general permission', function () {
      stubs.action1.returns(true);
      stubs.action2.returns(true);
      accessChecker.canPerformActionOnEntity.returns(false);
      stubs.getSelected.returns([
        makeEntity(canMethodName, stubs.action1),
        makeEntity(canMethodName, stubs.action2)
      ]);

      expect(scope[methodName]()).toBeFalsy();
    });

    it('cannot show ' + action + ' action because no permission on item', function () {
      stubs.action1.returns(true);
      stubs.action2.returns(false);
      accessChecker.canPerformActionOnEntity.returns(true);
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
