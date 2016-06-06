'use strict';

describe('ApiNameController', function () {
  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.value('KnowledgeBase/getUrl', sinon.spy());
    });

    var $controller = this.$inject('$controller');

    this.modalDialog = this.$inject('modalDialog');

    this.scope = this.$inject('$rootScope').$new();
    this.scope.field = {id: 'field-id'};

    this.getPublishedField = sinon.stub().returns({id: 'field-id'});
    this.scope.ctEditorController = {
      getPublishedField: this.getPublishedField
    };

    this.apiNameController = $controller('ApiNameController', {$scope: this.scope});
    this.$apply();
  });


  describe('isEditable()', function() {
    it('is true if field not published', function() {
      this.getPublishedField.returns(undefined);
      this.$apply();
      expect(this.apiNameController.isEditable()).toBe(true);
    });

    it('is false if field is published', function () {
      expect(this.apiNameController.isEditable()).toBe(false);
    });

    it('is true after confirmation', function (done) {
      var apiNameController = this.apiNameController;

      this.modalDialog.open = sinon.stub().returns({promise: this.when()});

      apiNameController.unlockEditing()
      .finally(function () {
        expect(apiNameController.isEditable()).toBe(true);
        done();
      });

      this.$apply();
    });

    it('is false after unlock cancel', function (done) {
      var apiNameController = this.apiNameController;

      this.modalDialog.open = sinon.stub().returns({promise: this.reject()});

      apiNameController.unlockEditing()
      .finally(function () {
        expect(apiNameController.isEditable()).toBe(false);
        done();
      });

      this.$apply();
    });
  });

});

