'use strict';

describe('logger service', function () {
  var logger;
  var $httpBackend, $rootScope;
  var routeStub, userStub;
  var loggerStubs = {};

  function declareOptionTests(stubName) {
    it('has tags', function () {
      expect(loggerStubs[stubName].args[0][1].tags).toBeDefined();
    });

    it('has an url', function () {
      expect(loggerStubs[stubName].args[0][1].culprit).toBe('protocol//host/viewType');
    });

    it('has a logger param to identify the app', function () {
      expect(loggerStubs[stubName].args[0][1].logger).toBe('user_interface');
    });

    it('has an userId tag', function () {
      expect(loggerStubs[stubName].args[0][1].tags.userId).toBe('userid');
    });

    it('has a git_revision tag', function () {
      expect(loggerStubs[stubName].args[0][1].tags.git_revision).toBe('gitrevision');
    });

    it('has a viewport tag', function () {
      expect(loggerStubs[stubName].args[0][1].tags.viewport).toBe('innerWidth'+'x'+'innerHeight');
    });

    it('has a screensize tag', function () {
      expect(loggerStubs[stubName].args[0][1].tags.screensize).toBe('screenWidth'+'x'+'screenHeight');
    });
  }

  beforeEach(function () {
    loggerStubs = {
      captureMessageStub: sinon.stub(),
      logExceptionStub: sinon.stub()
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
        Raven: {
          captureMessage: loggerStubs.captureMessageStub,
          logException: loggerStubs.logExceptionStub
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

  describe('captures an error', function () {
    var error, options;
    var data;
    beforeEach(function () {
      var scope = $rootScope.$new();
      scope.scopeKey = 'scopeValue';
      error = new Error('error object');
      data = {
        key: 'value',
        scope: scope
      };
      options = {
        data: _.clone(data)
      };
      logger.logError(error, options);
    });

    it('calls logger method', function () {
      expect(loggerStubs.captureMessageStub).toBeCalled();
    });

    it('sends error to logger', function () {
      expect(loggerStubs.captureMessageStub.args[0][0]).toBe(error);
    });

    describe('on options', function () {
      it('has an error_message tag', function () {
        expect(loggerStubs.captureMessageStub.args[0][1].tags.type).toBe('error_message');
      });

      it('has a dataId of an object sent to logger service', function () {
        expect(typeof loggerStubs.captureMessageStub.args[0][1].extra.dataId).toBe('string');
      });

      it('has no data property in options', function () {
        expect(loggerStubs.captureMessageStub.args[0][1].data).toBeUndefined();
      });

      declareOptionTests('captureMessageStub');
    });

    it('sends data to logger service', function () {
      $httpBackend.expectPOST(
        /dataLoggerUrl/,
        {'key':'value','scope':{'this':'[Circular ~]','scopeKey':'scopeValue'}}
      ).respond(200);
      $httpBackend.flush();
    });
  });

  describe('captures an exception', function () {
    var error, options;
    beforeEach(function () {
      error = new Error('error object');
      logger.logException(error, options);
    });

    it('calls logger method', function () {
      expect(loggerStubs.logExceptionStub).toBeCalled();
    });

    it('sends error to logger', function () {
      expect(loggerStubs.logExceptionStub.args[0][0]).toBe(error);
    });

    describe('on options', function () {
      it('has an exception tag', function () {
        expect(loggerStubs.logExceptionStub.args[0][1].tags.type).toBe('exception');
      });

      declareOptionTests('logExceptionStub');
    });
  });

  describe('captures a server error', function () {
    var error, options;
    beforeEach(function () {
      error = new Error('error object');
      logger.logServerError('message', error, options);
    });

    it('calls logger method', function () {
      expect(loggerStubs.captureMessageStub).toBeCalled();
    });

    it('sends message to logger', function () {
      expect(loggerStubs.captureMessageStub.args[0][0]).toBe('message');
    });

    describe('on options', function () {
      it('has an exception tag', function () {
        expect(loggerStubs.captureMessageStub.args[0][1].tags.type).toBe('server_error');
      });

      it('has the error object on the extra object', function () {
        expect(loggerStubs.captureMessageStub.args[0][1].extra.error).toBe(error);
      });

      declareOptionTests('captureMessageStub');
    });
  });

});
