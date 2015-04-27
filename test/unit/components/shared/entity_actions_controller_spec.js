'use strict';

describe('Entity Actions Controller', function () {
  var scope, controller;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeControllers('PermissionController');
    });
    inject(function ($controller, $rootScope) {
      scope = $rootScope.$new();
      scope.permissionController = { can: sinon.stub() };
      scope.entity = {};
      scope.entity.getVersion = sinon.stub().returns(123);

      controller = $controller('EntityActionsController', {
        $scope: scope,
        entityType: 'entity'
      });
      scope.$digest();
    });
  });

  describe('for an entity', function() {

    it('can create an entity', function () {
      scope.permissionController.can.withArgs('create', 'Entity').returns({can: true});
      expect(controller.canDuplicate()).toBe(true);
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
        expect(controller.canDelete()).toBe(true);
      });

      it('can archive an entity', function () {
        scope.permissionController.can.withArgs('archive', scope.entity.data).returns({can: true});
        scope.entity.canArchive = sinon.stub().returns(true);
        expect(controller.canArchive()).toBe(true);
      });

      it('can unarchive an entity', function () {
        scope.permissionController.can.withArgs('unarchive', scope.entity.data).returns({can: true});
        scope.entity.canUnarchive= sinon.stub().returns(true);
        expect(controller.canUnarchive()).toBe(true);
      });

      it('can unpublish an entity', function () {
        scope.permissionController.can.withArgs('unpublish', scope.entity.data).returns({can: true});
        scope.entity.canUnpublish = sinon.stub().returns(true);
        expect(controller.canUnpublish()).toBe(true);
      });

      it('can publish an entity', function () {
        scope.permissionController.can.withArgs('publish', scope.entity.data).returns({can: true});
        scope.entity.canPublish = sinon.stub().returns(true);
        expect(controller.canPublish()).toBe(true);
      });
    });

    describe('on deleted entities', function () {
      beforeEach(function () {
        delete scope.entity.data;
      });

      it('cannot delete an entity', function () {
        scope.permissionController.can.withArgs('delete', undefined).returns({can: false});
        scope.entity.canDelete = sinon.stub().returns(false);
        expect(controller.canDelete()).toBe(false);
      });

      it('cannot archive an entity', function () {
        scope.permissionController.can.withArgs('archive', undefined).returns({can: false});
        scope.entity.canArchive = sinon.stub().returns(false);
        expect(controller.canArchive()).toBe(false);
      });

      it('cannot unarchive an entity', function () {
        scope.permissionController.can.withArgs('unarchive', undefined).returns({can: false});
        scope.entity.canUnarchive= sinon.stub().returns(false);
        expect(controller.canUnarchive()).toBe(false);
      });

      it('cannot unpublish an entity', function () {
        scope.permissionController.can.withArgs('unpublish', undefined).returns({can: false});
        scope.entity.canUnpublish = sinon.stub().returns(false);
        expect(controller.canUnpublish()).toBe(false);
      });

      it('cannot publish an entity', function () {
        scope.permissionController.can.withArgs('publish', undefined).returns({can: false});
        scope.entity.canPublish = sinon.stub().returns(false);
        expect(controller.canPublish()).toBe(false);
      });

    });

  });

});
