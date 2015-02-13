'use strict';

describe('logger service', function () {
  var logger, stringifySafe, toJsonReplacer;
  var $rootScope;
  var routeStub, userStub;
  var loggerStubs = {};

  function declareOptionTests(stubName) {
    var metadataIndex = 2;
    it('has tags', function () {
      expect(loggerStubs[stubName].args[0][metadataIndex].params).toBeDefined();
    });

    it('has a viewport tag', function () {
      expect(loggerStubs[stubName].args[0][metadataIndex].params.viewport).toBe('innerWidth'+'x'+'innerHeight');
    });

    it('has a screensize tag', function () {
      expect(loggerStubs[stubName].args[0][metadataIndex].params.screensize).toBe('screenWidth'+'x'+'screenHeight');
    });
  }

  beforeEach(function () {
    loggerStubs = {
      notifyStub: sinon.stub(),
      notifyExceptionStub: sinon.stub()
    };
    routeStub = sinon.stub();
    userStub = sinon.stub();
    module('contentful/test', function ($provide) {
      $provide.constant('environment', {
        settings: {
          dataLoggerUrl: 'dataLoggerUrl/',
          git_revision: 'gitrevision'
        }
      });

      $provide.value('$window', {
        addEventListener: sinon.stub(),
        location: {
          protocol: 'protocol',
          host: 'host'
        },
        innerWidth: 'innerWidth',
        innerHeight: 'innerHeight',
        screen: {
          width: 'screenWidth',
          height: 'screenHeight'
        },
        Bugsnag: {
          notify: loggerStubs.notifyStub,
          notifyException: loggerStubs.notifyExceptionStub
        }
      });

      $provide.value('routing', {
        getRoute: routeStub
      });

      $provide.value('authentication', {
        getUser: userStub
      });

    });
    inject(function (realLogger, _$rootScope_, $injector) {
      stringifySafe = $injector.get('stringifySafe');
      toJsonReplacer = $injector.get('toJsonReplacer');
      $rootScope = _$rootScope_;
      logger = realLogger;

      routeStub.returns({
        viewType: 'viewType'
      });
      userStub.returns({
        sys: {
          id: 'userid'
        }
      });
    });
  });

  function createLogLevelTest(level, methodName) {
    var levelCapitalized = level.charAt(0).toUpperCase() + level.substr(1, level.length);
    var loggedData;
    describe('logs a '+level, function () {
      var message, metaData;
      var data;
      beforeEach(function () {
        var scope = $rootScope.$new();
        scope.scopeKey = 'scopeValue';
        message = 'message';
        data = {
          key: 'value',
          scope: scope,
          undef: undefined
        };
        metaData = {
          data: _.clone(data)
        };
        loggedData = _.mapValues(data, function(v){
          return JSON.parse(stringifySafe(v)||'{}', toJsonReplacer);
        });
        logger[methodName](message, metaData);
      });

      it('calls logger method', function () {
        expect(loggerStubs.notifyStub).toBeCalled();
      });

      it('sends notification name to logger', function () {
        expect(loggerStubs.notifyStub.args[0][0]).toEqual('Logged '+levelCapitalized);
      });

      it('sends message to logger', function () {
        expect(loggerStubs.notifyStub.args[0][1]).toEqual(message);
      });

      it('sends metadata to logger', function () {
        expect(typeof loggerStubs.notifyStub.args[0][2]).toEqual('object');
      });

      it('notifies with type', function () {
        expect(loggerStubs.notifyStub.args[0][3]).toEqual(level);
      });

      describe('on metaData', function () {
        it('has data property in metaData', function () {
          expect(loggerStubs.notifyStub.args[0][2].data).toEqual(loggedData);
        });

        declareOptionTests('notifyStub');
      });
    });
  }

  createLogLevelTest('error', 'logError');
  createLogLevelTest('warning', 'logWarn');
  createLogLevelTest('info', 'log');

  describe('captures a server error', function () {
    var error, metaData;
    beforeEach(function () {
      error = new Error('error object');
      metaData = metaData || {};
      metaData.error = error;
      logger.logServerError('message', metaData);
    });

    it('calls logger method', function () {
      expect(loggerStubs.notifyStub).toBeCalled();
    });

    it('sends notification name to logger', function () {
      expect(loggerStubs.notifyStub.args[0][0]).toEqual('Logged Server Error');
    });

    it('sends message to logger', function () {
      expect(loggerStubs.notifyStub.args[0][1]).toEqual('message');
    });

    it('sends metadata to logger', function () {
      expect(typeof loggerStubs.notifyStub.args[0][2]).toEqual('object');
    });

    it('notifies with type', function () {
      expect(loggerStubs.notifyStub.args[0][3]).toEqual('error');
    });

    describe('on metaData', function () {
      it('has the error object on the metadata', function () {
        expect(loggerStubs.notifyStub.args[0][2].error).toBe(error);
      });

      declareOptionTests('notifyStub');
    });
  });

  describe('captures an exception', function () {
    var error, metaData;
    beforeEach(function () {
      error = new Error('error object');
      logger.logException(error, metaData);
    });

    it('calls logger method', function () {
      expect(loggerStubs.notifyExceptionStub).toBeCalled();
    });

    it('sends error to logger', function () {
      expect(loggerStubs.notifyExceptionStub.args[0][0]).toBe(error);
    });

    describe('on metaData', function () {
      declareOptionTests('notifyExceptionStub');
    });
  });

  describe('captures CORS errors', function(){
    it('when receiving a serverError', function(){
      logger.logServerError('Foobar', {error: {statusCode: 0}});
      expect(loggerStubs.notifyStub.args[0][0]).toBe('CORS Warning');
      expect(loggerStubs.notifyStub.args[0][3]).toBe('warning');
    });

    it('when receiving a serverWarn', function(){
      logger.logServerWarn('Foobar', {error: {statusCode: 0}});
      expect(loggerStubs.notifyStub.args[0][0]).toBe('CORS Warning');
      expect(loggerStubs.notifyStub.args[0][3]).toBe('warning');
    });
  });

});
