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
      sinon.stub($rootScope, '$broadcast');
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
          expect(entity.action).toBeCalled();
        });

        it('gets version', function() {
          expect(entity.getVersion).toBeCalled();
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
          expect(entity.action).toBeCalled();
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
          expect(entity.action).toBeCalled();
        });

        it('sets deleted flag on entity', function() {
          expect(entity.setDeleted).toBeCalled();
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

      describe('unsuccessfully because too many requests', function() {
        beforeEach(function() {
          errorResponse.statusCode = performer.getErrors().TOO_MANY_REQUESTS;
          this.action.reject(errorResponse);
          $rootScope.$apply();
          $timeout.flush();
        });

        it('calls action', function() {
          expect(entity.action).toBeCalledTwice();
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
          expect(performer.params.getSelected).toBeCalled();
        });

        it('calls action callback', function() {
          expect(params.actionCallback).toBeCalled();
        });

        it('starts spinner', function() {
          expect(startSpinner).toBeCalled();
        });

        it('stops spinner', function() {
          expect(stopSpinner).toBeCalled();
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
          expect(performer.params.getSelected).toBeCalled();
        });

        it('calls call action', function() {
          expect(performer.callAction).toBeCalled();
        });

        it('starts spinner', function() {
          expect(startSpinner).toBeCalled();
        });

        it('stops spinner', function() {
          expect(stopSpinner).toBeCalled();
        });

        it('handles results', function() {
          expect(performer.handlePerformResult).toBeCalledWith([results[0]], params, 1);
        });
      });

    });
  });

  describe('serializer', function() {
    var serialize;

    beforeEach(function () {
      serialize = listActions.serialize;
    });

    it('serializes http calls for rate limiting', function () {
      var messages = [];
      var result;
      var hasFailed  = false;
      serialize([
        function number1(){ return $timeout(function () {
          messages.push('number 1');
          return 1;
        }, 500);},
        function number2(){ return $timeout(function () {
          messages.push('number 2');
          return 2;
        }, 100);},
        function number3f(){ return $timeout(function () {
          if (hasFailed) {
            messages.push('failing number 3 succeeded');
            return 3;
          } else {
            hasFailed = true;
            messages.push('failing number 3 with 429');
            return $q.reject({statusCode: 429});
          }
        }, 200);},
        function number3(){ return $timeout(function () {
          messages.push('number 4');
          return 4;
        }, 500); }
      ]).then(function (res) {
        result = res;
      });

      $timeout.flush(); // Flush the call of number 1
      expect(messages[0]).toBe('number 1');
      $timeout.flush(); // Flush the call of number 2
      expect(messages[1]).toBe('number 2');
      $timeout.flush(); // Flush the call of failing number 3
      expect(messages[2]).toBe('failing number 3 with 429');
      $timeout.flush(); // Flush the call of the number 3 retry timeout
      $timeout.flush(); // Flush the call of the number 3 retry
      expect(messages[3]).toBe('failing number 3 succeeded');
      $timeout.flush(); // Flush the call of number 4
      expect(messages[4]).toBe('number 4');
      expect(messages.length).toBe(5);

      expect(result).toEqual([1,2,3,4]);
    });

    it('aborts on serious error', function () {
      var messages = [];
      serialize([
        function number1(){ return $timeout(function () {
          messages.push('number 1');
        }, 500);},
        function number2(){ return $timeout(function () {
          messages.push('number 2');
        }, 100);},
        function number3f(){ return $timeout(function () {
          messages.push('failing number 3');
          return $q.reject({statusCode: 404});
        }, 200);},
        function number3(){ return $timeout(function () {
          messages.push('number 3');
        }, 500); }
      ]).catch(function (err) {
        messages.push(err);
      });

      $timeout.flush(); // Flush the call of number 1
      expect(messages[0]).toBe('number 1');
      $timeout.flush(); // Flush the call of number 2
      expect(messages[1]).toBe('number 2');
      $timeout.flush(); // Flush the call of failing number 3
      expect(messages[2]).toBe('failing number 3');
      expect(messages[3].statusCode).toBe(404);
      expect(messages.length).toBe(4);
    });

    it('returns empty array with empty calls', function () {
      var result;
      serialize([]).then(function (res) {
        result = res;
      });

      $timeout.flush();
      expect(result).toEqual([]);
    });

  });

});
