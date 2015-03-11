'use strict';

describe('ContentTypeEditor Controller', function () {
  var scope, controller, $q, logger, notification;
  var space, contentType;
  var createContentType;
  var modifiedContentTypeStub;
  beforeEach(function () {
    modifiedContentTypeStub = sinon.stub();
    module('contentful/test', function ($provide) {
      $provide.value('analytics', {
        modifiedContentType: modifiedContentTypeStub
      });

      $provide.removeControllers('PermissionController', 'EntityActionsController');
    });

    inject(function ($rootScope, $controller, cfStub, $injector){
      scope = $rootScope.$new();
      space = cfStub.space('space');
      $q = $injector.get('$q');
      logger = $injector.get('logger');
      notification = $injector.get('notification');

      scope.user = {
        features: {}
      };

      scope.permissionController = { can: sinon.stub() };
      scope.permissionController.can.returns({can: true});

      scope.validate = sinon.stub();
      scope.contentTypeForm = {
        $setDirty: sinon.stub()
      };

      createContentType = function (fields) {
        contentType = cfStub.contentType(space, 'contentType', 'Content Type', fields);
        scope.tab = {
          params: {
            contentType: contentType
          }
        };
        controller = $controller('ContentTypeEditorController', {$scope: scope});
        scope.$digest();
      };
    });
  });

  describe('with no fields', function() {
    beforeEach(function() {
      createContentType();
    });

    it('sets contentType on the scope', function () {
      expect(scope.contentType).toEqual(contentType);
    });

    it('fires no initial validation', function() {
      sinon.assert.notCalled(scope.validate);
    });

    it('updates published content type', function () {
      var publishedCT = {published: true};
      scope.updatePublishedContentType(publishedCT);
      expect(scope.publishedContentType).toEqual(publishedCT);
    });

    it('has no fields', function () {
      expect(scope.hasFields).toBeFalsy();
    });

    it('has fields', function () {
      scope.contentType.data = {fields: [1]};
      scope.$digest();
      expect(scope.hasFields).toBeTruthy();
    });

    it('sets tab title from content type', function () {
      expect(scope.tab.title).toBe('Content Type');
    });

    it('doesn\'t try to set the form to dirty', function() {
      sinon.assert.notCalled(scope.contentTypeForm.$setDirty);
    });

    describe('sets the form to dirty if fields change', function() {
      beforeEach(function() {
        scope.contentType.data.fields.push({});
        scope.$digest();
      });

      it('when a new field is added', function() {
        sinon.assert.called(scope.contentTypeForm.$setDirty);
      });

      it('when an existing field is changed', function() {
        scope.contentType.data.fields[0].required = true;
        scope.$digest();
        sinon.assert.calledTwice(scope.contentTypeForm.$setDirty);
      });
    });

    it('sets the form to dirty if displayField changes', function() {
      scope.contentType.data.displayField = 'something';
      scope.$digest();
      sinon.assert.called(scope.contentTypeForm.$setDirty);
    });

    describe('load published content type', function () {
      var publishedCT;
      beforeEach(inject(function (cfStub){
        var newContentType = cfStub.contentType(space, 'contentType2', 'Content Type 2');
        publishedCT = {published:true};
        newContentType.getPublishedStatus = sinon.stub().returns($q.when(publishedCT));
        scope.tab.params.contentType = newContentType;
        scope.$digest();
      }));

      it('gets published status', function () {
        sinon.assert.called(scope.contentType.getPublishedStatus);
      });

      it('sets the published content type', function () {
        expect(scope.publishedContentType).toEqual(publishedCT);
      });
    });

    describe('dirty tab marker', function () {
      beforeEach(function () {
        scope.contentType.getPublishedVersion = sinon.stub();
        scope.contentType.getVersion = sinon.stub();
        scope.contentTypeForm.$dirty = false;
      });

      it('unset if version one ahead of published', function () {
        scope.contentType.getPublishedVersion.returns(1);
        scope.contentType.getVersion.returns(2);
        scope.$digest();
        expect(scope.tab.dirty).toBe(false);
      });


      it('set if version is higher than published version', function () {
        scope.contentType.getPublishedVersion.returns(1);
        scope.contentType.getVersion.returns(4);
        scope.$digest();
        expect(scope.tab.dirty).toBe(true);
      });

      it('set if form is dirty', function () {
        scope.contentType.getPublishedVersion.returns(1);
        scope.contentType.getVersion.returns(2);
        scope.contentTypeForm.$dirty = true;
        scope.$digest();
        expect(scope.tab.dirty).toBe(true);
      });
    });

    describe('sets arrays with published content type info', function () {
      beforeEach(function () {
        scope.publishedContentType = {
          data: {
            fields: [
              {apiName: 'a1', id: 'i1'},
              {apiName: 'a2', id: 'i2'},
              {apiName: 'a3', id: 'i3'}
            ]
          },
        };
        scope.$digest();
      });

      it('for field apiNames', function () {
        expect(scope.publishedApiNames).toEqual(['a1', 'a2', 'a3']);
      });

      it('for field IDs', function () {
        expect(scope.publishedIds).toEqual(['i1', 'i2', 'i3']);
      });
    });

    describe('adds a field to a content type', function () {
      var childScope, eventArg;
      beforeEach(function () {
        childScope = scope.$new();
        childScope.$on('fieldAdded', function (event, arg) {
          eventArg = arg;
        });
      });

      describe('succeeds', function () {
        beforeEach(function () {
          scope.addField({type: 'Text'});
          scope.$digest();
        });

        it('field is added', function () {
          expect(scope.contentType.data.fields[0]).toBeDefined();
        });

        it('field has id', function () {
          expect(typeof scope.contentType.data.fields[0].id).toBe('string');
        });

        it('field has supplied type', function () {
          expect(scope.contentType.data.fields[0].type).toBe('Text');
        });

        it('broadcasts event', function () {
          expect(eventArg).toEqual(0);
        });

        it('fires analytics event', function () {
          sinon.assert.called(modifiedContentTypeStub);
        });
      });

    });
  });

  describe('with fields', function() {
    beforeEach(function() {
      createContentType([{}]);
    });

    it('sets contentType on the scope', function () {
      expect(scope.contentType).toEqual(contentType);
    });

    it('fires initial validation', function() {
      sinon.assert.called(scope.validate);
    });

    it('has fields', function () {
      expect(scope.hasFields).toBeTruthy();
    });

  });

});
