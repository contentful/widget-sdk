'use strict';

describe('Validation dialog service', function () {
  var scope, container;
  var successStub, errorStub;
  var dialog, makeDialog;
  beforeEach(function () {
    module('contentful/test');
    inject(function ($rootScope, $compile) {
      scope = $rootScope.$new();
      successStub = sinon.stub();
      errorStub = sinon.stub();

      scope.field = {
        type: 'Text'
      };

      scope.can = sinon.stub();
      scope.can.returns(true);

      makeDialog = function () {
        container = $('<div class="cf-dialog" dialog-template="validation_dialog"></div>');
        $compile(container)(scope);
        scope.$digest();

        container.click();
        dialog = container.scope().dialog;
        dialog.then(successStub)
              .catch(errorStub);
        scope.$digest();
      };
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('create a dialog', function () {
    beforeEach(function () {
      makeDialog();
    });

    afterEach(function () {
      dialog._cleanup();
    });

    it('creates a dialog', function () {
      expect(dialog).toBeDefined();
    });

    it('dom element property exists', function () {
      expect(dialog.domElement).toBeDefined();
    });

    it('dom element exists', function () {
      expect(dialog.domElement.get(0)).toBeDefined();
    });
  });

  describe('shows advice if no validations are set', function () {
    beforeEach(function () {
      scope.field.validations = [];
      makeDialog();
    });

    afterEach(function () {
      dialog._cleanup();
    });

    it('has advice', function() {
      expect(dialog.domElement.find('.advice')).not.toBeNgHidden();
    });

    it('has no buttons', function() {
      expect(dialog.domElement.find('.buttons')).toBeNgHidden();
    });

    it('create validation button is enabled', function() {
      expect(dialog.domElement.find('.advice .primary-button').attr('disabled')).toBeFalsy();
    });

    it('create validation button is disabled', function() {
      scope.can.returns(false);
      scope.$digest();
      expect(dialog.domElement.find('.advice .primary-button').attr('disabled')).toBeTruthy();
    });

  });

  describe('shows buttons if validations are set', function () {
    beforeEach(function () {
      scope.field.validations = [
        {'Length': {size: {min: null, max: null}}},
      ];
      makeDialog();
    });

    afterEach(function () {
      dialog._cleanup();
    });

    it('has no advice', function() {
      expect(dialog.domElement.find('.advice')).toBeNgHidden();
    });

    it('has buttons', function() {
      expect(dialog.domElement.find('.buttons')).not.toBeNgHidden();
    });

    it('has validation options', function() {
      expect(dialog.domElement.find('.cf-validation-options').length).toBeGreaterThan(0);
    });

    it('add validation button is enabled', function() {
      expect(dialog.domElement.find('.buttons .primary-button').attr('disabled')).toBeFalsy();
    });

    it('add validation button is disabled', function() {
      scope.can.returns(false);
      scope.$digest();
      expect(dialog.domElement.find('.buttons .primary-button').attr('disabled')).toBeTruthy();
    });


  });


});
