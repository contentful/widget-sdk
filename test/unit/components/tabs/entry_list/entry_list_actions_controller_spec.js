import sinon from 'sinon';

import { $initialize, $inject } from 'test/utils/ng';
import { it } from 'test/utils/dsl';

describe('Entry List Actions Controller', () => {
  let scope, stubs, ComponentLibrary;
  let action1, action2, action3, action4;

  afterEach(() => {
    scope = stubs = ComponentLibrary = null;
    action1 = action2 = action3 = action4 = null;
  });

  beforeEach(async function () {
    const duplicateOrPublishResults = {
      succeeded: ['foo', 'bar'].map((prefix) => ({
        data: {
          sys: {
            id: prefix,
            contentType: {
              sys: {
                id: `${prefix}-ct-id`,
              },
            },
          },
        },
      })),
    };

    stubs = {
      track: sinon.stub(),
      success: sinon.stub(),
      error: sinon.stub(),
      size: sinon.stub(),
      createEntry: sinon.stub(),
      getSelected: sinon.stub(),
      clear: sinon.stub(),
      action1: sinon.stub(),
      action2: sinon.stub(),
      action3: sinon.stub(),
      action4: sinon.stub(),
      timeout: sinon.stub(),
      shouldHide: sinon.stub(),
      shouldDisable: sinon.stub(),
      canPerformActionOnEntity: sinon.stub(),
    };

    this.system.set('analytics/Analytics', {
      track: stubs.track,
    });

    this.system.set('access_control/AccessChecker', {
      shouldHide: stubs.shouldHide,
      shouldDisable: stubs.shouldDisable,
      canPerformActionOnEntity: stubs.canPerformActionOnEntity,
    });

    const paginatorClass = (await this.system.import('classes/Paginator')).default;

    ComponentLibrary = await this.system.import('@contentful/forma-36-react-components');
    ComponentLibrary.Notification.error = stubs.error;
    ComponentLibrary.Notification.success = stubs.success;

    await $initialize(this.system, ($provide) => {
      $provide.value('$timeout', stubs.timeout);
    });

    const $q = $inject('$q');
    action1 = $q.defer();
    action2 = $q.defer();
    action3 = $q.defer();
    action4 = $q.defer();
    stubs.action1.returns(action1.promise);
    stubs.action2.returns(action2.promise);
    stubs.action3.returns(action3.promise);
    stubs.action4.returns(action4.promise);

    scope = $inject('$rootScope').$new();

    scope.paginator = paginatorClass.create();
    scope.selection = {
      size: stubs.size,
      getSelected: stubs.getSelected.returns([]),
      clear: stubs.clear,
    };

    const spaceContext = $inject('mocks/spaceContext').init();
    spaceContext.space = { createEntry: stubs.createEntry };

    scope.publishSelected = sinon.stub().returns($q.resolve(duplicateOrPublishResults));

    // Several of the tests below are coupled with ListActionsController and
    // rely upon its implementation (via batchPerformer instance methods)
    // internally. The stub below allows us to do so while mocking the return
    // value of `batchPerformer.create(config).duplicate`.
    const batchPerformer = $inject('batchPerformer');
    const { create } = batchPerformer;
    sinon.stub(batchPerformer, 'create').callsFake((...args) => {
      const { duplicate, ...performer } = create(...args);
      return {
        ...performer,
        duplicate: (...args) => {
          duplicate(...args);
          return Promise.resolve(duplicateOrPublishResults);
        },
      };
    });

    const $controller = $inject('$controller');
    $controller('EntryListActionsController', { $scope: scope });
  });

  function makeEntity(action, stub) {
    const entity = {
      data: {
        sys: {
          id: 'entity-id',
          contentType: {
            sys: {
              id: 'content-type-id',
            },
          },
        },
      },
    };
    entity[action] = stub;
    return entity;
  }

  function makePerformTests(action, extraSpecs) {
    describe(`${action} selected entries`, () => {
      beforeEach(() => {
        stubs.size.returns(2);
        const entities = [
          makeEntity(action, stubs.action1),
          makeEntity(action, stubs.action2),
          makeEntity(action, stubs.action3),
          makeEntity(action, stubs.action4),
        ];
        action1.resolve(entities[0]);
        action2.reject(new Error('boom'));
        action3.resolve(entities[2]);
        action4.resolve(entities[3]);
        stubs.getSelected.returns(entities);
        stubs.timeout.callsArg(0);

        scope[`${action}Selected`]();
        scope.$digest();
      });

      it(`calls ${action} on first selected entry`, () => {
        sinon.assert.called(stubs.action1);
      });

      it(`calls ${action} on second selected entry`, () => {
        sinon.assert.called(stubs.action2);
      });

      it(`calls ${action} on third selected entry`, () => {
        sinon.assert.called(stubs.action3);
      });

      it(`calls ${action} on fourth selected entry`, () => {
        sinon.assert.called(stubs.action4);
      });

      it('calls success notification', () => {
        sinon.assert.calledOnce(stubs.success);
      });

      it('success notification shown for 3 items', () => {
        expect(stubs.success.args[0][0]).toMatch(/^2*/);
      });

      it('calls error notification', () => {
        sinon.assert.calledOnce(stubs.error);
      });

      it('error notification shown for 1 item', () => {
        expect(stubs.error.args[0][0]).toMatch(/^2*/);
      });

      it('clears selection', () => {
        sinon.assert.called(stubs.clear);
      });

      it('tracks analytics event', () => {
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

  describe('duplicates selected entries', () => {
    beforeEach(() => {
      stubs.size.returns(2);
      stubs.action1.returns({
        type: 'Entry',
        contentType: {
          sys: {
            id: 'foo',
            contentType: {
              sys: { id: 'foo-ct-id' },
            },
          },
        },
      });
      stubs.action2.returns({
        type: 'Entry',
        contentType: {
          sys: {
            id: 'bar',
            contentType: {
              sys: { id: 'bar-ct-id' },
            },
          },
        },
      });
      stubs.createEntry.withArgs('foo').resolves({});
      stubs.createEntry.withArgs('bar').rejects(new Error('boom'));
      scope.entries = [];
      stubs.getSelected.returns([
        {
          getSys: stubs.action1,
          data: {
            sys: {
              id: 'foo',
              contentType: {
                sys: { id: 'foo-ct-id' },
              },
            },
          },
        },
        {
          getSys: stubs.action2,
          data: {
            sys: {
              id: 'bar',
              contentType: {
                sys: { id: 'bar-ct-id' },
              },
            },
          },
        },
      ]);

      scope.duplicateSelected();
      scope.$digest();
    });

    it('calls getSys on first selected entry', () => {
      sinon.assert.called(stubs.action1);
    });

    it('calls getSys on second selected entry', () => {
      sinon.assert.called(stubs.action2);
    });

    it('attempts to create first entries', () => {
      sinon.assert.calledWith(stubs.createEntry, 'foo');
    });

    it('attempts to create second entries', () => {
      sinon.assert.calledWith(stubs.createEntry, 'bar');
    });

    it('calls success notification', () => {
      sinon.assert.calledOnce(stubs.success);
    });

    it('calls error notification', () => {
      sinon.assert.calledOnce(stubs.error);
    });

    it('clears selection', () => {
      sinon.assert.called(stubs.clear);
    });

    it('tracks analytics event', () => {
      sinon.assert.called(stubs.track);
    });

    it('increases paginator value', () => {
      expect(scope.paginator.getTotal()).toBe(2);
    });
  });

  it('can show duplicate action', () => {
    expect(scope.showDuplicate()).toBeTruthy();
  });

  it('cannot show duplicate action', () => {
    stubs.shouldHide.withArgs('create', 'entry').returns(true);
    expect(scope.showDuplicate()).toBeFalsy();
  });

  function makePermissionTests(action) {
    const methodName = 'show' + action.charAt(0).toUpperCase() + action.substr(1);
    const canMethodName = 'can' + action.charAt(0).toUpperCase() + action.substr(1);

    it('can show ' + action + ' action', () => {
      stubs.action1.returns(true);
      stubs.action2.returns(true);
      stubs.canPerformActionOnEntity.returns(true);
      stubs.getSelected.returns([
        makeEntity(canMethodName, stubs.action1),
        makeEntity(canMethodName, stubs.action2),
      ]);

      expect(scope[methodName]()).toBeTruthy();
    });

    it('cannot show delete ' + action + ' because no general permission', () => {
      stubs.shouldHide.withArgs(action, 'entry').returns(true);
      stubs.action1.returns(true);
      stubs.action2.returns(true);
      stubs.canPerformActionOnEntity.returns(false);
      stubs.getSelected.returns([
        makeEntity(canMethodName, stubs.action1),
        makeEntity(canMethodName, stubs.action2),
      ]);

      expect(scope[methodName]()).toBeFalsy();
    });

    it('cannot show ' + action + ' action because no permission on item', () => {
      stubs.action1.returns(true);
      stubs.action2.returns(false);
      stubs.canPerformActionOnEntity.returns(true);
      stubs.getSelected.returns([
        makeEntity(canMethodName, stubs.action1),
        makeEntity(canMethodName, stubs.action2),
      ]);

      expect(scope[methodName]()).toBeFalsy();
    });
  }
  makePermissionTests('delete');
  makePermissionTests('archive');
  makePermissionTests('unarchive');
  makePermissionTests('publish');
  makePermissionTests('unpublish');

  it('gets publish button name if all are unpublished', () => {
    stubs.action1.returns(false);
    stubs.action2.returns(false);
    stubs.getSelected.returns([
      makeEntity('isPublished', stubs.action1),
      makeEntity('isPublished', stubs.action2),
    ]);

    expect(scope.publishButtonName()).toBe('Publish');
  });

  it('gets publish button name if all published', () => {
    stubs.action1.returns(true);
    stubs.action2.returns(true);
    stubs.getSelected.returns([
      makeEntity('isPublished', stubs.action1),
      makeEntity('isPublished', stubs.action2),
    ]);

    expect(scope.publishButtonName()).toBe('Republish');
  });

  it('gets publish button name not all are published', () => {
    stubs.action1.returns(true);
    stubs.action2.returns(false);
    stubs.getSelected.returns([
      makeEntity('isPublished', stubs.action1),
      makeEntity('isPublished', stubs.action2),
    ]);

    expect(scope.publishButtonName()).toBe('(Re)publish');
  });
});
