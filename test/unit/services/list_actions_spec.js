'use strict';

describe('List Actions Service', function () {
  var listActions, $timeout, $q, $rootScope, startSpinner, stopSpinner;

  beforeEach(function() {
    module('contentful/test', function ($provide) {
      $provide.value('notification', {
        info: sinon.stub(),
        warn: sinon.stub()
      });
      $provide.value('cfSpinner', {
        start: startSpinner = sinon.stub().returns(stopSpinner = sinon.stub())
      });
    });
    inject(function ($injector) {
      $rootScope  = $injector.get('$rootScope');
      $timeout    = $injector.get('$timeout');
      $q          = $injector.get('$q');
      listActions = $injector.get('listActions');
      sinon.spy($rootScope, '$broadcast');
    });
  });

  afterEach(function () {
    $rootScope.$broadcast.restore();
  });

  describe('batch performer', function() {
    var performer;
    beforeEach(function() {
      performer = listActions.createBatchPerformer({
        entityNamePlural: 'entities'
      });
    });

    it('is created', function() {
      expect(performer).toBeDefined();
    });

    describe('batch results notifier', function() {
      var notifier, notification;
      beforeEach(function() {
        notification = this.$inject('notification');
        notifier = performer.makeBatchResultsNotifier('action');
      });

      it('is created', function() {
        expect(typeof notifier).toBe('function');
      });

      describe('when called', function() {
        beforeEach(function() {
          notifier([
            {err: {}},
            {},
            {}
          ], 3);
        });

        it('success notification called for 2 entities', function() {
          expect(notification.info.args[0][0]).toMatch('2 entities action');
        });

        it('warn notification called for 1 entity', function() {
          expect(notification.warn.args[0][0]).toMatch('1 entities');
          expect(notification.warn.args[0][0]).toMatch('action');
        });

      });

    });

    describe('call action', function() {
      var entity, params, changedEntity, errorResponse;

      beforeEach(function() {
        this.action = $q.defer();
        entity = {
          setDeleted: sinon.stub(),
          getVersion: sinon.stub(),
          action: sinon.stub().returns(this.action.promise)
        };
        errorResponse = {};
        changedEntity = {};
        params = {
          method: 'action'
        };
        params.event = 'eventname';
        params.getterForMethodArgs = ['getVersion'];
        entity.getVersion.returns(2);
        this.promise = performer.callAction(entity, params)
        .then(
          _.bind(function(res){ this.result = res; }, this),
          _.bind(function(err){ this.error  = err; }, this)
        );
      });

      describe('successfully', function() {
        beforeEach(function() {
          this.action.resolve(changedEntity);
          $rootScope.$apply();
        });

        it('calls action', function() {
          sinon.assert.called(entity.action);
        });

        it('gets version', function() {
          sinon.assert.called(entity.getVersion);
        });

        it('calls action with version as first arg', function() {
          expect(entity.action.args[0][0]).toBe(2);
        });

        it('returns a resolved promise', function() {
          var resolved;
          this.promise.then(function(){ resolved = true; });
          $rootScope.$apply();
          expect(resolved).toBe(true);
        });

        it('event is broadcasted', function() {
          expect($rootScope.$broadcast).toBeCalledWith('eventname', changedEntity);
        });
      });

      describe('unsuccessfully', function() {
        beforeEach(function() {
          this.action.reject(errorResponse);
          $rootScope.$apply();
        });

        it('calls action', function() {
          sinon.assert.called(entity.action);
        });

        it('returns the error', function() {
          expect(this.error).toEqual({err: errorResponse});
        });
      });

      describe('unsuccessfully because entity is gone', function() {
        beforeEach(function() {
          errorResponse.statusCode = performer.getErrors().NOT_FOUND;
          this.action.reject(errorResponse);
          $rootScope.$apply();
        });

        it('calls action', function() {
          sinon.assert.called(entity.action);
        });

        it('sets deleted flag on entity', function() {
          sinon.assert.called(entity.setDeleted);
        });

        it('returns a resolved promise', function() {
          var resolved;
          this.promise.then(function(){ resolved = true; });
          $rootScope.$apply();
          expect(resolved).toBe(true);
        });

        it('entityDeleted event is broadcasted', function() {
          expect($rootScope.$broadcast).toBeCalledWith('entityDeleted', entity);
        });
      });
    });

    describe('perform', function() {
      var params, results;
      beforeEach(function() {
        params = {};
        results = [
          {res1: true},
          {res2: true}
        ];
        sinon.stub(performer, 'handlePerformResult');
        performer.params.getSelected = sinon.stub();
      });

      describe('with a supplied action callback and multiple results', function() {
        beforeEach(inject(function() {
          params.actionCallback = sinon.spy(function (entity) {
            return $q.when(results[entity.index]);
          });
          performer.params.getSelected.returns([{index: 0}, {index: 1}]);
          performer.perform(params);
          $rootScope.$apply();
        }));

        it('gets selected items', function() {
          sinon.assert.called(performer.params.getSelected);
        });

        it('calls action callback', function() {
          sinon.assert.called(params.actionCallback);
        });

        it('starts spinner', function() {
          sinon.assert.called(startSpinner);
        });

        it('stops spinner', function() {
          sinon.assert.called(stopSpinner);
        });

        it('handles results', function() {
          expect(performer.handlePerformResult).toBeCalledWith(results, params, 2);
        });
      });

      describe('with the default action callback', function() {
        beforeEach(inject(function() {
          sinon.stub(performer, 'callAction', function () {
            return $q.when(results[0]);
          });
          performer.params.getSelected.returns([{}]);
          performer.perform(params);
          $rootScope.$apply();
        }));

        it('gets selected items', function() {
          sinon.assert.called(performer.params.getSelected);
        });

        it('calls call action', function() {
          sinon.assert.called(performer.callAction);
        });

        it('starts spinner', function() {
          sinon.assert.called(startSpinner);
        });

        it('stops spinner', function() {
          sinon.assert.called(stopSpinner);
        });

        it('handles results', function() {
          expect(performer.handlePerformResult).toBeCalledWith([results[0]], params, 1);
        });
      });

    });
  });

});
