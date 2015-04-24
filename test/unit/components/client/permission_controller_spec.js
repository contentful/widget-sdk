'use strict';

describe('Permission Controller', function () {
  var scope, controller;

  beforeEach(function () {
    var self = this;
    module('contentful/test', function ($provide) {
      self.enforcementsStubs = {
        determineEnforcement: sinon.stub()
      };
      $provide.value('enforcements', self.enforcementsStubs);

      self.reasonsDeniedStub = sinon.stub();
      $provide.value('reasonsDenied', self.reasonsDeniedStub);

      self.authorizationStubs = {
        setTokenLookup: sinon.stub(),
        setSpace: sinon.stub(),
        authContext: {
          hasSpace: sinon.stub(),
          organization: sinon.stub(),
          can: sinon.stub()
        }
      };
      $provide.value('authorization', self.authorizationStubs);

      self.authorizationStubs.authContext.organization.returns({can: self.authorizationStubs.authContext.can});
    });
    inject(function ($controller, $rootScope, $q){
      this.$q = $q;
      scope = $rootScope.$new();
      controller = $controller('PermissionController', {$scope: scope});
    });
  });

  describe('initialize', function() {
    beforeEach(function() {
      this.spaceContext = {
        can: sinon.stub(),
        reasonsDenied: sinon.stub()
      };
      controller.initialize(this.spaceContext);
    });

    it('has space context', function() {
      expect(controller.spaceContext).toBe(this.spaceContext);
    });

    it('defines entity actions', function() {
      expect(_.keys(controller.entityActions).length > 0).toBe(true);
    });

    it('get entity action permission', function() {
      expect(controller.get('createContentType', 'shouldHide')).toBe(true);
    });

    it('can', function() {
      expect(controller.can('create', 'entity')).toEqual({
        action: 'create',
        entity: 'entity',
        shouldHide: true,
        shouldDisable: false,
        can: undefined,
        reasons: null
      });
    });

    describe('check for enforcements', function() {
      var args, broadcastStub;

      beforeEach(inject(function($rootScope) {
        args = [1, 2];
        broadcastStub = sinon.stub($rootScope, '$broadcast');
        this.spaceContext.can = sinon.stub();
        this.spaceContext.can.returns(false);
      }));

      describe('if there are reasons', function () {
        beforeEach(function () {
          this.enforcementsStubs.determineEnforcement.returns({});
          controller.can(args, {});
        });

        it('enforcement is determined', function () {
          sinon.assert.called(this.enforcementsStubs.determineEnforcement);
        });

        it('reasons are determined', function () {
          sinon.assert.called(this.reasonsDeniedStub);
        });

        it('event is broadcast', function () {
          sinon.assert.called(broadcastStub);
        });
      });

      describe('if there are no reasons', function () {
        beforeEach(function () {
          this.enforcementsStubs.determineEnforcement.returns(false);
          controller.can(args, {});
        });

        it('enforcement is determined', function () {
          sinon.assert.called(this.enforcementsStubs.determineEnforcement);
        });

        it('reasons are determined', function () {
          sinon.assert.called(this.reasonsDeniedStub);
        });

        it('event is not broadcast', function () {
          sinon.assert.notCalled(broadcastStub);
        });
      });
    });

  });

  describe('check if user can select an organization', function() {
    beforeEach(function() {
      scope.user = {
        organizationMemberships: [{
          organization: {
            sys: {
              id: '1234',
              createdBy: {
                sys: {
                  id: '456'
                }
              }
            }
          }
        }]
      };
    });

    it('as an owner', function() {
      scope.user.organizationMemberships[0].role = 'owner';
      expect(controller.canSelectOrg('1234')).toBeTruthy();
    });

    it('as an admin', function() {
      scope.user.organizationMemberships[0].role = 'admin';
      expect(controller.canSelectOrg('1234')).toBeTruthy();
    });

    it('as an user', function() {
      scope.user.organizationMemberships[0].role = 'user';
      expect(controller.canSelectOrg('1234')).toBeFalsy();
    });

    it('with no memberships', function() {
      scope.user.organizationMemberships = [];
      expect(controller.canSelectOrg('1234')).toBeFalsy();
    });
  });

  describe('check if user can create a space in any org', function() {
    beforeEach(function() {
      scope.organizations = [
        {sys: {id: 'abc'}},
        {sys: {id: 'def'}},
      ];
    });

    it('if user cant create spaces in any organizations', function() {
      this.authorizationStubs.authContext.can.returns(false);
      expect(controller.canCreateSpaceInAnyOrg()).toBeFalsy();
    });

    it('if user can create spaces in any organizations', function() {
      this.authorizationStubs.authContext.can.returns(true);
      expect(controller.canCreateSpaceInAnyOrg()).toBeTruthy();
    });
  });

  describe('check if user can create a space', function() {
    it('with no auth context', inject(function(authorization) {
      delete authorization.authContext;
      expect(controller.canCreateSpace()).toBeFalsy();
    }));

    it('with no organizations', function() {
      expect(controller.canCreateSpace()).toBeFalsy();
    });

    it('with zero organizations', function() {
      scope.organizations = [];
      expect(controller.canCreateSpace()).toBeFalsy();
    });

    describe('with organizations', function() {
      beforeEach(function() {
        scope.organizations = [
          {sys: {id: 'abc'}},
          {sys: {id: 'def'}},
        ];
        controller.canCreateSpaceInAnyOrg = sinon.stub();
      });

      it('if user cant create spaces in any organizations', function() {
        controller.canCreateSpaceInAnyOrg.returns(false);
        expect(controller.canCreateSpace()).toBeFalsy();
      });

      it('if authorization allows', function() {
        controller.canCreateSpaceInAnyOrg.returns(true);
        this.authorizationStubs.authContext.can.returns(true);
        expect(controller.canCreateSpace()).toBeTruthy();
      });

      describe('if authorization does not allow', function() {
        var result;
        beforeEach(function() {
          controller.canCreateSpaceInAnyOrg.returns(true);
          var canStub = sinon.stub();
          canStub.returns(true);
          this.authorizationStubs.authContext.organization.returns({can: canStub});
          this.authorizationStubs.authContext.can.returns(false);
          result = controller.canCreateSpace();
        });

        it('result is false', function() {
          expect(result).toBeFalsy();
        });

        it('checks for enforcements', function() {
          sinon.assert.called(this.enforcementsStubs.determineEnforcement);
        });
      });
    });

  });


  describe('check if user can create space in org', function() {

    it('with no auth context', inject(function(authorization) {
      delete authorization.authContext;
      expect(controller.canCreateSpaceInOrg()).toBeFalsy();
    }));

    describe('with an auth context', function() {
      beforeEach(function() {
        controller.canCreateSpaceInOrg('orgid');
      });

      it('gets an organization', function() {
        sinon.assert.calledWith(this.authorizationStubs.authContext.organization, 'orgid');
      });

      it('checks for permission on organization', function() {
        sinon.assert.called(this.authorizationStubs.authContext.can);
      });
    });
  });


});
