'use strict';

describe('logger service', function () {
  var logger;
  var $httpBackend, $rootScope;
  var routeStub, userStub;
  var loggerStubs = {};

  function declareOptionTests(stubName, metadataIndex) {
    metadataIndex = metadataIndex || 2;
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
    inject(function (_logger_, _$httpBackend_, _$rootScope_) {
      $httpBackend = _$httpBackend_;
      $rootScope = _$rootScope_;
      logger = _logger_;

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

  afterEach(inject(function ($log) {
    $log.assertEmpty();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  }));

  describe('logs a data object', function () {
    var generatedId;
    var data;
    beforeEach(function () {
      data = {data: 'object'};
      generatedId = logger.logDataObject(data);
    });

    it('generates an id', function () {
      expect(generatedId).toBeDefined();
    });

    it('id is a string', function () {
      expect(typeof generatedId).toBe('string');
    });

    it('sends data to logger service', function () {
      $httpBackend.expectPOST(/dataLoggerUrl/, data).respond(200);
      $httpBackend.flush();
    });
  });

  function createLogLevelTest(level, methodName) {
    var levelCapitalized = level.charAt(0).toUpperCase() + level.substr(1, level.length);
    describe('logs a '+level, function () {
      var message, options;
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
        options = {
          data: _.clone(data)
        };
        logger[methodName](message, options);
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

      describe('on options', function () {
        it('has a dataId of an object sent to logger service', function () {
          expect(typeof loggerStubs.notifyStub.args[0][2].dataId).toBe('string');
        });

        it('has no data property in options', function () {
          expect(loggerStubs.notifyStub.args[0][2].data).toBeUndefined();
        });

        declareOptionTests('notifyStub');
      });

      it('sends data to logger service', function () {
        $httpBackend.expectPOST(
          /dataLoggerUrl/,
          {'key':'value','scope':{'$id':2,'$parent':{'$id':1,'$parent':null,'$root':'[Circular ~.$parent]'},'scopeKey':'scopeValue'}, 'undef': {}}
        ).respond(200);
        $httpBackend.flush();
      });
    });
  }

  createLogLevelTest('error', 'logError');
  createLogLevelTest('warning', 'logWarn');
  createLogLevelTest('info', 'log');

  describe('captures a server error', function () {
    var error, options;
    beforeEach(function () {
      error = new Error('error object');
      logger.logServerError('message', error, options);
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

    describe('on options', function () {
      it('has the error object on the metadata', function () {
        expect(loggerStubs.notifyStub.args[0][2].error).toBe(error);
      });

      declareOptionTests('notifyStub');
    });
  });

  describe('captures an exception', function () {
    var error, options;
    beforeEach(function () {
      error = new Error('error object');
      logger.logException(error, options);
    });

    it('calls logger method', function () {
      expect(loggerStubs.notifyExceptionStub).toBeCalled();
    });

    it('sends error to logger', function () {
      expect(loggerStubs.notifyExceptionStub.args[0][0]).toBe(error);
    });

    describe('on options', function () {
      declareOptionTests('notifyExceptionStub', 1);
    });
  });

});
