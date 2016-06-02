'use strict';

describe('subscriptionPlanRecommender', function () {

  var $httpBackend;
  var recommend;

  var HOST = 'be.contentful.com:443';
  var TEST_ORG_ID = 'TEST_ORG_ID';
  var TEST_TOKEN = 'TEST_TOKEN';
  var ENDPOINT = '//' + HOST + '/account/organizations/' + TEST_ORG_ID +
    '/z_subscription_plans/recommended';
  var REQUEST = ENDPOINT + '?access_token=' + TEST_TOKEN;

  var PLAN_CLASS = {'class': 'z-subscription-plan'};
  var REASON_CLASS = {'class': 'z-subscription-plan-recommendation-reason'};

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.constant('environment', {
        settings: { base_host: HOST }
      });
      $provide.value('authentication', {
        token: TEST_TOKEN
      });
    });

    recommend = this.$inject('subscriptionPlanRecommender').recommend;
    $httpBackend = this.$inject('$httpBackend');
  });

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
    $httpBackend = recommend = null;
  });

  describe('.recommend(organizationId)', function () {
    beforeEach(function () {
      this.promise = recommend(TEST_ORG_ID);
      this.respond = $httpBackend.whenGET(REQUEST).respond;
    });

    it('requests the organization`s recommended plan card on GK', function () {
      $httpBackend.expectGET(REQUEST).respond();
      $httpBackend.flush();
    });

    describe('returned promise', function () {
      var rejected, resolved;
      beforeEach(function () {
        rejected = sinon.spy();
        resolved = sinon.spy();
        this.promise.then(resolved, rejected);
      });

      it('gets rejected if Gatekeeper does not know the organization', function () {
        this.respond(404);
        $httpBackend.flush();
        sinon.assert.calledWithExactly(rejected, sinon.match.instanceOf(Error));
      });

      it('gets rejected on Gatekeeper server failure', function () {
        this.respond(500);
        $httpBackend.flush();
        assertRejected();
      });

      var plan = $('<article>', PLAN_CLASS).text('_PLAN_');
      var reason = $('<p>', REASON_CLASS).text('_REASON_');

      describeSuccessOnResponseBody('containing a plan only',
        responseBody(plan),
        plan);

      describeSuccessOnResponseBody('containing a plan and unrelated elements',
        responseBody($('<p>'), plan, $('<p>')),
        plan );

      describeSuccessOnResponseBody('containing a plan and reason',
        responseBody(plan, reason),
        plan, reason);

      describeSuccessOnResponseBody('containing a reason and a plan',
        responseBody(reason, plan),
        plan, reason);

      describeSuccessOnResponseBody('with an element containing a plan only',
        responseBody($('<div>').append(plan)),
        plan);

      describeSuccessOnResponseBody('with an element containing a reason and a plan',
        responseBody($('<div>').append(reason, plan)),
        plan, reason);

      describeFailureOnResponseBody('containing a reason only',
        responseBody(reason));

      describeFailureOnResponseBody('which is empty',
        responseBody());

      function describeSuccessOnResponseBody (msg, responseBody, plan, reason) {
        describe('on response body' + msg, function () {
          beforeEach(function () {
            this.respond(200, responseBody);
            $httpBackend.flush();
          });

          it('gets resolved', function () {
            sinon.assert.notCalled(rejected);
            sinon.assert.calledWithExactly(resolved, sinon.match.object);
          });

          it('contains a `plan` HTMLElement', function () {
            sinon.assert.calledWithExactly(resolved, sinon.match({
              plan: sinon.match.instanceOf(HTMLElement).and(sinon.match({
                nodeName: plan.prop('tagName'),
                innerHTML: plan.html()
              }))
            }));
          });

          if (reason) {
            it('contains a `reason` HTMLElement', function () {
              sinon.assert.calledWithExactly(resolved, sinon.match({
                reason: sinon.match.instanceOf(HTMLElement).and(sinon.match({
                  nodeName: reason.prop('tagName'),
                  innerHTML: reason.html()
                }))
              }));
            });
          }
        });
      }

      function describeFailureOnResponseBody (msg, responseBody) {
        describe('on response body' + msg, function () {
          beforeEach(function () {
            var data = responseBody;
            this.respond(200, data);
            $httpBackend.flush();
          });

          it('gets rejected', assertRejected);
        });
      }

      function responseBody () {
        var body = $('<body>');
        body.append.apply(body, arguments);
        return $('<html>').append(body).html();
      }

      function assertRejected () {
        sinon.assert.calledWithExactly(rejected, sinon.match.instanceOf(Error));
      }
    });
  });
});
