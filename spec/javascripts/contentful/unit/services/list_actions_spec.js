'use strict';

describe('List Actions', function () {
  var listActions, stubs, $timeout, $q;

  beforeEach(function() {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'info', 'warn', 'setDeleted', 'getVersion', 'resolve', 'reject', 'then', 'catch',
        'action', 'getSelected', 'start', 'stopSpinner'
      ]);
      $provide.value('notification', {
        info: stubs.info,
        warn: stubs.warn
      });
      stubs.start.returns(stubs.stopSpinner);
      $provide.value('cfSpinner', {
        start: stubs.start
      });
    });
    inject(function (_listActions_, $rootScope, _$timeout_, _$q_) {
      $timeout = _$timeout_;
      $q = _$q_;
      stubs.broadcast = sinon.stub($rootScope, '$broadcast');
      listActions = _listActions_;
    });
  });

  afterEach(function () {
    stubs.broadcast.restore();
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
      var notifier;
      beforeEach(function() {
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
          expect(stubs.info.args[0][0]).toMatch('2 entities action');
        });

        it('warn notification called for 1 entity', function() {
          expect(stubs.warn.args[0][0]).toMatch('1 entities');
          expect(stubs.warn.args[0][0]).toMatch('action');
        });

      });

    });

    describe('call action', function() {
      var entity, err, params, deferred, changedEntity;

      beforeEach(function() {
        entity = {
          setDeleted: stubs.setDeleted,
          getVersion: stubs.getVersion,
          action: stubs.action
        };
        err = {};
        changedEntity = {};
        params = {
          method: 'action'
        };
        deferred = {
          resolve: stubs.resolve,
          reject: stubs.reject
        };
      });

      describe('successfully', function() {
        beforeEach(function() {
          params.event = 'eventname';
          params.getterForMethodArgs = ['getVersion'];
          stubs.getVersion.returns(2);
          stubs.action.callsArgWith(1, null, changedEntity);
          performer.callAction(entity, params, deferred);
        });

        it('calls action', function() {
          expect(stubs.action).toBeCalled();
        });

        it('gets version', function() {
          expect(stubs.getVersion).toBeCalled();
        });

        it('calls action with version as first arg', function() {
          expect(stubs.action.args[0][0]).toBe(2);
        });

        it('deferred gets resolved', function() {
          expect(stubs.resolve).toBeCalledOnce();
        });

        it('event is broadcasted', function() {
          expect(stubs.broadcast).toBeCalledWith('eventname', changedEntity);
        });
      });

      describe('unsuccessfully', function() {
        beforeEach(function() {
          stubs.action.callsArgWith(0, err);
          performer.callAction(entity, params, deferred);
        });

        it('calls action', function() {
          expect(stubs.action).toBeCalled();
        });

        it('deferred gets rejected', function() {
          expect(stubs.reject).toBeCalledOnce();
        });

        it('deferred gets error', function() {
          expect(stubs.reject.args[0][0]).toEqual({err: err});
        });
      });

      describe('unsuccessfully because entity is gone', function() {
        beforeEach(function() {
          err.statusCode = performer.getErrors().NOT_FOUND;
          stubs.action.callsArgWith(0, err);
          performer.callAction(entity, params, deferred);
        });

        it('calls action', function() {
          expect(stubs.action).toBeCalled();
        });

        it('deferred gets resolved', function() {
          expect(stubs.resolve).toBeCalledOnce();
        });

        it('sets deleted flag on entity', function() {
          expect(stubs.setDeleted).toBeCalled();
        });

        it('entityDeleted event is broadcasted', function() {
          expect(stubs.broadcast).toBeCalledWith('entityDeleted', entity);
        });
      });

      describe('unsuccessfully because too many requests', function() {
        beforeEach(function() {
          err.statusCode = performer.getErrors().TOO_MANY_REQUESTS;
          stubs.action.callsArgWith(0, err);
          performer.callAction(entity, params, deferred);
          $timeout.flush();
        });

        it('calls action', function() {
          expect(stubs.action).toBeCalledTwice();
        });
      });

    });

    describe('perform', function() {
      var params;
      beforeEach(function() {
        params = {};
        stubs.callAction = sinon.stub(performer, 'callAction');
        stubs.handlePerformResult = sinon.stub(performer, 'handlePerformResult');
        performer.params.getSelected = stubs.getSelected;
        stubs.getSelected.returns([{}]);
        stubs.defer = sinon.stub($q, 'defer');
        stubs.defer.returns({
          promise: {
            then: stubs.then
          }
        });
        stubs.then.returns({
          catch: stubs.catch
        });
      });

      describe('with a supplied action callback', function() {
        beforeEach(function() {
          params.actionCallback = stubs.action;
          performer.perform(params);
        });

        it('gets selected items', function() {
          expect(stubs.getSelected).toBeCalled();
        });

        it('calls action callback', function() {
          expect(stubs.action).toBeCalled();
        });

        it('starts spinner', function() {
          expect(stubs.start).toBeCalled();
        });
      });

      describe('with the default action callback', function() {
        beforeEach(function() {
          performer.perform(params);
        });

        it('gets selected items', function() {
          expect(stubs.getSelected).toBeCalled();
        });

        it('calls call action', function() {
          expect(stubs.callAction).toBeCalled();
        });

        it('starts spinner', function() {
          expect(stubs.start).toBeCalled();
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
