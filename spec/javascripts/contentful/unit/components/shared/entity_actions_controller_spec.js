'use strict';

describe('Entity Actions Controller', function () {
  var scope, controller, createController;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeControllers('PermissionController');
    });
    inject(function ($controller, $rootScope) {
      scope = $rootScope.$new();
      scope.permissionController = { can: sinon.stub() };
      scope.entity = {};

      createController = function(methodOverrides) {
        controller = $controller('EntityActionsController', {
          $scope: scope,
          params: {
            entityType: 'entity',
            methodOverrides: methodOverrides
          }
        });
        scope.$digest();
      };
    });
  });

  describe('for an entity', function() {
    beforeEach(function() {
      createController();
    });

    it('can create an entity', function () {
      scope.permissionController.can.withArgs('create', 'Entity').returns({can: true});
      expect(scope.canDuplicate()).toBe(true);
    });

    describe('on undeleted entities', function () {
      beforeEach(function () {
        scope.entity.data = {};
      });
      afterEach(function () {
        delete scope.entity.data;
      });

      it('can delete an entity', function () {
        scope.permissionController.can.withArgs('delete', scope.entity.data).returns({can: true});
        scope.entity.canDelete = sinon.stub().returns(true);
        expect(scope.canDelete()).toBe(true);
      });

      it('can archive an entity', function () {
        scope.permissionController.can.withArgs('archive', scope.entity.data).returns({can: true});
        scope.entity.canArchive = sinon.stub().returns(true);
        expect(scope.canArchive()).toBe(true);
      });

      it('can unarchive an entity', function () {
        scope.permissionController.can.withArgs('unarchive', scope.entity.data).returns({can: true});
        scope.entity.canUnarchive= sinon.stub().returns(true);
        expect(scope.canUnarchive()).toBe(true);
      });

      it('can unpublish an entity', function () {
        scope.permissionController.can.withArgs('unpublish', scope.entity.data).returns({can: true});
        scope.entity.canUnpublish = sinon.stub().returns(true);
        expect(scope.canUnpublish()).toBe(true);
      });

      it('can publish an entity', function () {
        scope.permissionController.can.withArgs('publish', scope.entity.data).returns({can: true});
        scope.entity.canPublish = sinon.stub().returns(true);
        expect(scope.canPublish()).toBe(true);
      });
    });

    describe('on deleted entities', function () {
      beforeEach(function () {
        delete scope.entity.data;
      });

      it('cannot delete an entity', function () {
        scope.permissionController.can.withArgs('delete', undefined).returns({can: false});
        scope.entity.canDelete = sinon.stub().returns(false);
        expect(scope.canDelete()).toBe(false);
      });

      it('cannot archive an entity', function () {
        scope.permissionController.can.withArgs('archive', undefined).returns({can: false});
        scope.entity.canArchive = sinon.stub().returns(false);
        expect(scope.canArchive()).toBe(false);
      });

      it('cannot unarchive an entity', function () {
        scope.permissionController.can.withArgs('unarchive', undefined).returns({can: false});
        scope.entity.canUnarchive= sinon.stub().returns(false);
        expect(scope.canUnarchive()).toBe(false);
      });

      it('cannot unpublish an entity', function () {
        scope.permissionController.can.withArgs('unpublish', undefined).returns({can: false});
        scope.entity.canUnpublish = sinon.stub().returns(false);
        expect(scope.canUnpublish()).toBe(false);
      });

      it('cannot publish an entity', function () {
        scope.permissionController.can.withArgs('publish', undefined).returns({can: false});
        scope.entity.canPublish = sinon.stub().returns(false);
        expect(scope.canPublish()).toBe(false);
      });

    });

  });

  it('overrides an existing can method', function () {
    var deleteStub = sinon.stub();
    createController({canDelete: deleteStub});
    scope.$digest();
    scope.canDelete();
    expect(deleteStub).toBeCalled();
  });

});
