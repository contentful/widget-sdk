'use strict';

describe('ApiNameController', function () {
  var controller, scope, stubs, logger, notification;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs(['toIdentifier', 'isDisplayableAsTitleFilter']);
      $provide.value('isDisplayableAsTitleFilter', stubs.isDisplayableAsTitleFilter);
      $provide.constant('stringUtils', {toIdentifier: stubs.toIdentifier});
    });
    inject(function ($controller, $rootScope, $injector) {
      logger = $injector.get('logger');
      notification = $injector.get('notification');
      scope = $rootScope.$new();

      scope.field = {};

      scope.publishedContentType = { data: { sys: {revision: 1} } };
      scope.contentType = {
        data: {
          fields: {}
        }
      };

      controller = $controller('ApiNameController', {$scope: scope});
      scope.$digest();
    });
  });

  describe('default state', function() {
    it('is not editable', function() {
      expect(controller.isEditable()).toBe(false);
    });

    it('is not revertable', function() {
      expect(controller.isRevertable()).toBe(false);
    });
  });

  describe('published content type revision is changed', function() {
    beforeEach(function() {
      scope.field.id = 'fieldid';
      scope.publishedContentType = {
        data: {
          sys: {revision: 2},
          fields: {fieldid: {id: 'fieldid', apiName: 'fieldApiName'}}
        }
      };
      scope.$digest();
    });

    it('changes published name', function() {
      expect(controller._publishedApiName).toEqual('fieldApiName');
    });

    it('locks controller with new revision', function() {
      expect(controller._locked).toBeTruthy();
    });
  });

  describe('automatically update apiName from field name change', function() {
    beforeEach(function() {
      scope.isDisplayField = sinon.stub();
      scope.setDisplayField = sinon.stub();
    });

    describe('on the default state updates nothing', function() {
      beforeEach(function() {
        controller.updateFromName();
      });

      it('sets field api name', function() {
        expect(scope.field.apiName).toBeUndefined();
      });

      it('sets no display field', function() {
        sinon.assert.notCalled(scope.setDisplayField);
      });
    });

    describe('updates to current value of field name', function() {
      beforeEach(function() {
        scope.field.id = 'oldfieldid';
        scope.field.apiName = 'fieldid';
        controller._originalFieldName = 'fieldid';
        stubs.toIdentifier.withArgs('fieldid').returns('fieldid');
        stubs.toIdentifier.withArgs('fieldname').returns('fieldname');
        stubs.isDisplayableAsTitleFilter.returns(true);
        scope.field.name = 'fieldname';
        controller.updateFromName();
      });

      it('sets field api name', function() {
        expect(scope.field.apiName).toBe('fieldname');
      });

      it('sets no display field', function() {
        sinon.assert.calledWith(scope.setDisplayField, {id: 'oldfieldid', apiName: 'fieldname', name: 'fieldname'});
      });
    });

  });

});

