'use strict';

describe('ContentTypeEditor Controller', function () {
  var scope, controller, $q, logger, notification;
  var space, contentType;
  var createContentType;
  beforeEach(function () {
    var self = this;
    module('contentful/test', function ($provide) {
      self.modifiedContentTypeStub = sinon.stub();
      $provide.value('analytics', {
        modifiedContentType: self.modifiedContentTypeStub
      });

      self.modalDialogOpenStub = sinon.stub();
      $provide.value('modalDialog', {
        open: self.modalDialogOpenStub
      });

      $provide.removeControllers('PermissionController', 'EntityActionsController');
    });

    inject(function ($rootScope, $controller, cfStub, $injector){
      this.$rootScope = $rootScope;
      this.$q = $injector.get('$q');
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
        scope.contentType = contentType;
        scope.closeState = sinon.stub();
        scope.context = {};
        controller = $controller('ContentTypeEditorController', {$scope: scope});
        scope.$digest();
      };
    });

    scope.editingInterface = {
      data: {widgets: []}
    };
  });

  describe('on load, with no fields', function() {
    beforeEach(function() {
      createContentType();
    });

    it('sets contentType on the scope', function () {
      expect(scope.contentType).toEqual(contentType);
    });

    it('has no title field', function() {
      expect(scope.contentType.data.displayField).toBeUndefined();
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

    describe('uses first added text field as title', function() {
      it('ignores non-text fields', function() {
        scope.contentType.data.fields.push({id: 1, type: 'Number'});
        scope.$digest();
        expect(scope.contentType.data.displayField).toBeUndefined();
      });

      ['Symbol', 'Text'].forEach(function(type) {
        it('catches up "' + type + '" fields', function() {
          var id = type + '_field';
          scope.contentType.data.fields.push({id: id, type: type});
          scope.$digest();
          expect(scope.contentType.data.displayField).toEqual(id);
        });
      });
    });

    describe('tries to select title field when current is deleted', function() {
      it('clears "displayField" property when no field was found', function() {
        var data = scope.contentType.data;
        data.fields.push({id: 1, type: 'Text'});
        scope.$digest();
        expect(data.displayField).toEqual(1);
        data.fields.pop();
        scope.$digest();
        expect(data.displayField).toBeUndefined();
      });

      it('gets the next one when available', function() {
        var data = scope.contentType.data;
        data.fields.push({id: 1, type: 'Text'});
        scope.$digest();
        expect(data.displayField).toEqual(1);
        data.fields.push({id: 1.5, type: 'Text', disabled: true});
        data.fields.push({id: 2, type: 'Symbol'});
        data.fields.shift();
        scope.$digest();
        expect(data.displayField).toEqual(2);
      });
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

    describe('loads published content type', function () {
      var publishedCT;
      beforeEach(inject(function (cfStub){
        var newContentType = cfStub.contentType(space, 'contentType2', 'Content Type 2');
        publishedCT = {published:true};
        newContentType.getPublishedStatus = sinon.stub().returns($q.when(publishedCT));
        scope.contentType = newContentType;
        scope.$digest();
      }));

      it('gets published status', function () {
        sinon.assert.called(scope.contentType.getPublishedStatus);
      });

      it('sets the published content type', function () {
        expect(scope.publishedContentType).toEqual(publishedCT);
      });
    });

    describe('sets a dirty tab marker', function () {
      beforeEach(function () {
        scope.contentType.getPublishedVersion = sinon.stub();
        scope.contentType.getVersion = sinon.stub();
        scope.contentTypeForm.$dirty = false;
      });

      it('unset if version one ahead of published', function () {
        scope.contentType.getPublishedVersion.returns(1);
        scope.contentType.getVersion.returns(2);
        scope.$digest();
        expect(scope.context.dirty).toBe(false);
      });


      it('set if version is higher than published version', function () {
        scope.contentType.getPublishedVersion.returns(1);
        scope.contentType.getVersion.returns(4);
        scope.$digest();
        expect(scope.context.dirty).toBe(true);
      });

      it('set if form is dirty', function () {
        scope.contentType.getPublishedVersion.returns(1);
        scope.contentType.getVersion.returns(2);
        scope.contentTypeForm.$dirty = true;
        scope.$digest();
        expect(scope.context.dirty).toBe(true);
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
          }
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

    it('#showMetadataDialog', function() {
      this.modalDialogOpenStub.returns({promise: this.$q.when()});
      scope.showMetadataDialog();
      sinon.assert.called(this.modalDialogOpenStub);
    });

    describe('#showNewFieldDialog', function() {
      beforeEach(function() {
        this.newField = {};
        this.modalDialogOpenStub.returns({promise: this.when(this.newField)});
        this.broadcastStub = sinon.stub(scope, '$broadcast');
        scope.showNewFieldDialog();
      });

      afterEach(function() {
        this.broadcastStub.restore();
      });

      it('opens dialog', function() {
        sinon.assert.called(this.modalDialogOpenStub);
      });

      it('adds field to content type', function() {
        expect(scope.contentType.data.fields[0]).toBeUndefined();
        scope.$digest();
        expect(scope.contentType.data.fields[0]).toBeDefined();
      });

      it('broadcasts event', function () {
        scope.$digest();
        sinon.assert.called(this.broadcastStub, 'fieldAdded');
      });

      it('fires analytics event', function () {
        scope.$digest();
        sinon.assert.called(this.modifiedContentTypeStub);
      });

      it('adds field to editing interface', function () {
        expect(scope.editingInterface.data.widgets.length).toEqual(0);
        scope.$digest();
        expect(scope.editingInterface.data.widgets.length).toEqual(1);
      });

    });

  });

  describe('on load, with fields', function() {
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

  describe('handles entityDeleted event', function() {
    beforeEach(function() {
      createContentType([{}]);
      this.$rootScope.$broadcast('entityDeleted', scope.contentType);
    });

    it('closes tab', function() {
      sinon.assert.called(scope.closeState);
    });
  });

});
