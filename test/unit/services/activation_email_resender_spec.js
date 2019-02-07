'use strict';

describe('activationEmailResender', () => {
  let $httpBackend;
  let resend;

  beforeEach(function() {
    this.stubs = {
      logError: sinon.stub()
    };

    module('contentful/test', $provide => {
      $provide.constant('logger', {
        logError: this.stubs.logError
      });
    });

    resend = this.$inject('activationEmailResender').resend;
    $httpBackend = this.$inject('$httpBackend');
  });

  afterEach(() => {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
    $httpBackend = resend = null;
  });

  describe('.resend() without email', () => {
    it('throws an error since no email is given', () => {
      expect(() => {
        resend();
      }).toThrow();
    });
  });

  describe('resend(email)', () => {
    beforeEach(function() {
      this.promise = resend('user@example.com');
      this.respond = $httpBackend.whenPOST('//be.test.com/confirmation').respond;
    });

    it('sends data as expected by Gatekeeper', () => {
      $httpBackend
        .expectPOST('//be.test.com/confirmation', 'user%5Bemail%5D=user%40example.com')
        .respond();
      $httpBackend.flush();
    });

    it('sends headers as expected by Gatekeeper', () => {
      $httpBackend
        .expectPOST('//be.test.com/confirmation', undefined, headers => {
          expect(headers['Content-Type']).toBe('application/x-www-form-urlencoded');
          return true;
        })
        .respond();
      $httpBackend.flush();
    });

    describe('returned promise', () => {
      let rejected, resolved;
      beforeEach(function() {
        rejected = sinon.spy();
        resolved = sinon.spy();
        this.promise.then(resolved, rejected);
      });

      it('gets resolved on Gatekeeper success (2xx) response', function() {
        this.respond(200);
        $httpBackend.flush();
        sinon.assert.calledWithExactly(resolved, undefined);
        sinon.assert.notCalled(rejected);
      });

      it('gets rejected on Gatekeeper client error (4xx) response', function() {
        this.respond(418);
        $httpBackend.flush();
        sinon.assert.notCalled(resolved);
        sinon.assert.calledWithExactly(rejected, sinon.match.instanceOf(Error));
      });

      it('gets rejected on Gatekeeper server error (5xx) response', function() {
        this.respond(500);
        $httpBackend.flush();
        sinon.assert.notCalled(resolved);
        sinon.assert.calledWithExactly(rejected, sinon.match.instanceOf(Error));
      });
    });

    describe('error logging on rejection via `logger.logError()`', () => {
      beforeEach(function() {
        this.respond((method, url, data, headers) => {
          this.request = {
            method: method,
            url: url,
            data: data,
            headers: headers
          };
          return [418, 'tea', {}, "I'm a teapot"];
        });

        $httpBackend.flush();
      });

      it('includes the right message and data', function() {
        sinon.assert.calledWithExactly(
          this.stubs.logError,
          'Failed activation email resend attempt',
          sinon.match({
            data: {
              email: 'user@example.com',
              response: {
                status: 418,
                statusText: "I'm a teapot",
                data: 'tea'
              }
            }
          })
        );
      });
    });
  });
});
