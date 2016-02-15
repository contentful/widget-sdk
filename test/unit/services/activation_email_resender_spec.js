'use strict';

describe('activationEmailResender', function () {

  var $httpBackend;
  var resend;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.constant('environment', {
        settings: { base_host: 'be.contentful.com:443' }
      });
    });

    resend = this.$inject('activationEmailResender').resend;
    $httpBackend = this.$inject('$httpBackend');
  });

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('#resend() without email', function () {
    it('throws an error since no email is given', function () {
      expect(function () {
        resend();
      }).toThrow();
    });
  });

  describe('#resend(email)', function () {
    beforeEach(function () {
      this.promise = resend('user@example.com');
    });

    it('sends data as expected by Gatekeeper', function () {
      $httpBackend.expectPOST(
        '//be.contentful.com:443/confirmation',
        'user%5Bemail%5D=user%40example.com'
      ).respond();
      $httpBackend.flush();
    });

    it('sends headers as expected by Gatekeeper', function () {
      $httpBackend.expectPOST(
        '//be.contentful.com:443/confirmation',
        undefined,
        function (headers) {
          expect(headers['Content-Type']).toBe('application/x-www-form-urlencoded');
          return true;
        }
      ).respond();
      $httpBackend.flush();
    });

    describe('returned promise', function () {
      var rejected, resolved;
      beforeEach(function () {
        rejected = sinon.spy();
        resolved = sinon.spy();
        this.promise.then(resolved, rejected);
        this.route = $httpBackend.whenPOST('//be.contentful.com:443/confirmation');
      });

      it('gets resolved on Gatekeeper success (2xx) response', function () {
        this.route.respond(200, 'OK');
        $httpBackend.flush();
        sinon.assert.calledWithExactly(resolved, undefined);
        sinon.assert.notCalled(rejected);
      });

      it('gets rejected on Gatekeeper client error (4xx) response', function () {
        this.route.respond(418, 'I\'m a teapot');
        $httpBackend.flush();
        sinon.assert.notCalled(resolved);
        sinon.assert.calledWithExactly(rejected, sinon.match.instanceOf(Error));
      });

      it('gets rejected on Gatekeeper server error (5xx) response', function () {
        this.route.respond(500, 'Internal Server Error');
        $httpBackend.flush();
        sinon.assert.notCalled(resolved);
        sinon.assert.calledWithExactly(rejected, sinon.match.instanceOf(Error));
      });
    });
  });
});
