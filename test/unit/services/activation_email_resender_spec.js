'use strict';

describe('activationEmailResender', function () {
  let $httpBackend;
  let resend;

  beforeEach(function () {
    module('contentful/test', function (environment) {
      environment.settings.authUrl = '//be.contentful.com:443';
    });

    resend = this.$inject('activationEmailResender').resend;
    $httpBackend = this.$inject('$httpBackend');
  });

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
    $httpBackend = resend = null;
  });

  describe('.resend() without email', function () {
    it('throws an error since no email is given', function () {
      expect(function () {
        resend();
      }).toThrow();
    });
  });

  describe('resend(email)', function () {
    beforeEach(function () {
      this.promise = resend('user@example.com');
      this.respond = $httpBackend.whenPOST(
        '//be.contentful.com:443/confirmation').respond;
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
      let rejected, resolved;
      beforeEach(function () {
        rejected = sinon.spy();
        resolved = sinon.spy();
        this.promise.then(resolved, rejected);
      });

      it('gets resolved on Gatekeeper success (2xx) response', function () {
        this.respond(200);
        $httpBackend.flush();
        sinon.assert.calledWithExactly(resolved, undefined);
        sinon.assert.notCalled(rejected);
      });

      it('gets rejected on Gatekeeper client error (4xx) response', function () {
        this.respond(418);
        $httpBackend.flush();
        sinon.assert.notCalled(resolved);
        sinon.assert.calledWithExactly(rejected, sinon.match.instanceOf(Error));
      });

      it('gets rejected on Gatekeeper server error (5xx) response', function () {
        this.respond(500);
        $httpBackend.flush();
        sinon.assert.notCalled(resolved);
        sinon.assert.calledWithExactly(rejected, sinon.match.instanceOf(Error));
      });
    });

    describe('error logging on rejection via `logger.logError()`', function () {
      let logErrorSpy;
      beforeEach(function () {
        this.respond(function (method, url, data, headers) {
          this.request = {
            method: method, url: url, data: data, headers: headers
          };
          return [418, 'tea', {}, 'I\'m a teapot'];
        }.bind(this));

        $httpBackend.flush();
        logErrorSpy = this.$inject('logger').logError;
      });

      it('includes the right message and data', function () {
        sinon.assert.calledWithExactly(logErrorSpy,
          'Failed activation email resend attempt',
          sinon.match({
            data: {
              email: 'user@example.com',
              response: {
                status: 418,
                statusText: 'I\'m a teapot',
                data: 'tea'
              }
            }
          })
        );
      });
    });
  });
});
