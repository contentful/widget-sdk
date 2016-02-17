'use strict';

describe('ContentTypeEditor Controller', function () {
  var scope;
  var contentType;
  var createContentType;

  beforeEach(function () {
    var self = this;
    module('contentful/test', function ($provide) {
      self.trackContentTypeChangeStub = sinon.stub();
      $provide.value('analyticsEvents', {
        trackContentTypeChange: self.trackContentTypeChangeStub
      });

      self.modalDialogOpenStub = sinon.stub();
      $provide.value('modalDialog', {
        open: self.modalDialogOpenStub
      });
    });

    var cfStub = this.$inject('cfStub');
    var $rootScope = this.$inject('$rootScope');

    scope = $rootScope.$new();

    _.extend(scope, {
      contentTypeForm: {
        $setDirty: sinon.stub()
      },
      context: {},
    });


    var $controller = this.$inject('$controller');
    createContentType = function (fields) {
      var space = cfStub.space('space');
      contentType = cfStub.contentType(space, 'contentType', 'Content Type', fields);
      scope.contentType = contentType;
      var controller = $controller('ContentTypeEditorController', {$scope: scope});
      $rootScope.$apply();
      return controller;
    };
  });

  describe('on load, with no fields', function() {
    beforeEach(function() {
      scope.validate = sinon.stub();
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

    describe('#showNewFieldDialog', function() {
      beforeEach(function() {
        this.newField = {};
        this.modalDialogOpenStub.returns({promise: this.when(this.newField)});
        this.broadcastStub = sinon.stub(scope, '$broadcast');
        scope.editingInterface = {data: {widgets: []}};
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
        sinon.assert.called(this.trackContentTypeChangeStub);
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

    it('has fields', function () {
      expect(scope.hasFields).toBeTruthy();
    });
  });

  it('closesState if entityDeleted event is broadcast', function() {
    scope.closeState = sinon.stub();
    createContentType([{}]);
    var $rootScope = this.$inject('$rootScope');
    $rootScope.$broadcast('entityDeleted', scope.contentType);
    sinon.assert.calledOnce(scope.closeState);
  });

  describe('#deleteField(id)', function () {
    beforeEach(function () {
      this.controller = createContentType([{id: 'FID'}]);
      scope.publishedContentType = {
        data: scope.contentType.data
      };
      this.modalDialog = this.$inject('modalDialog');
      this.modalDialog.open = sinon.stub();
    });

    describe('without entries', function () {
      beforeEach(function () {
        this.controller.countEntries = sinon.stub().resolves(0);
      });

      it('removes the field', function () {
        expect(contentType.data.fields.length).toEqual(1);

        this.controller.deleteField('FID');
        this.$apply();
        expect(contentType.data.fields.length).toEqual(0);
      });
    });

    describe('with entries', function () {
      beforeEach(function () {
        this.controller.countEntries = sinon.stub().resolves(1);
      });

      it('notifies the user if there are entries', function () {
        expect(contentType.data.fields.length).toEqual(1);

        this.controller.deleteField('FID');
        this.$apply();
        sinon.assert.called(this.modalDialog.open);
        expect(contentType.data.fields.length).toEqual(1);
      });

      it('deletes the field if it is not published', function () {
        scope.publishedContentType.data = {fields: []};
        expect(contentType.data.fields.length).toEqual(1);

        this.controller.deleteField('FID');
        this.$apply();
        expect(contentType.data.fields.length).toEqual(0);
      });
    });
  });

  describe('metadata dialog', function() {
    var metadataDialog;
    beforeEach(function() {
      metadataDialog = this.$inject('contentTypeEditor/metadataDialog');
      metadataDialog.openCreateDialog = sinon.stub();
      metadataDialog.openEditDialog = sinon.stub();
    });


    describe('when context is "isNew"', function () {
      beforeEach(function () {
        scope.context.isNew = true;
      });

      it('opens the metadata dialog', function () {
        metadataDialog.openCreateDialog.resolves({});
        createContentType();
        sinon.assert.calledOnce(metadataDialog.openCreateDialog);
      });

      it('updates the metdata from the dialog', function () {
        var metadata = {
          name: 'NAME',
          description: 'DESCRIPTION',
          id: 'ID'
        };
        metadataDialog.openCreateDialog.resolves(metadata);
        createContentType();

        expect(contentType.data.name).toEqual('NAME');
        expect(contentType.data.description).toEqual('DESCRIPTION');
        expect(contentType.data.sys.id).toEqual('ID');
      });
    });

    describe('#showMetadataDialog()', function() {
      beforeEach(function () {
        createContentType();
      });

      it('opens the edit metadata dialog', function() {
        metadataDialog.openEditDialog.resolves({});
        scope.showMetadataDialog();
        sinon.assert.calledOnce(metadataDialog.openEditDialog);
      });

      it('updates the metdata from the dialog', function () {
        var metadata = {
          name: 'NAME',
          description: 'DESCRIPTION',
          id: 'ID'
        };
        metadataDialog.openEditDialog.resolves(metadata);
        scope.showMetadataDialog();
        this.$apply();

        expect(contentType.data.name).toEqual('NAME');
        expect(contentType.data.description).toEqual('DESCRIPTION');
        expect(contentType.data.sys.id).not.toEqual('ID');
      });
    });
  });

});
