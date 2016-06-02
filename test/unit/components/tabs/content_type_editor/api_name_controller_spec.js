'use strict';

describe('ApiNameController', function () {
  beforeEach(module('contentful'));

  beforeEach(function () {
    var $controller = this.$inject('$controller');

    this.modalDialog = this.$inject('modalDialog');

    this.scope = this.$inject('$rootScope').$new();
    this.scope.field = {id: 'field-id'};

    this.scope.publishedContentType = {
      data: {
        fields: [{id: 'field-id'}]
      }
    };

    this.apiNameController = $controller('ApiNameController', {$scope: this.scope});
    this.$apply();
  });


  describe('isEditable()', function() {
    it('is true if field not published', function() {
      this.scope.publishedContentType = null;
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

