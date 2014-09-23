'use strict';

describe('Field Actions Controller', function () {
  var controller, scope;
  beforeEach(function () {
    module('contentful/test');
    inject(function ($compile, $rootScope, $controller){
      scope = $rootScope.$new();
      controller = $controller('FieldActionsController', {$scope: scope});
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('toggle a field', function () {
    var field;
    beforeEach(function () {
      field = {uiid: 123};
      scope.toggleField(field);
    });

    it('field is open', function () {
      expect(scope.isFieldOpen(field)).toBeTruthy();
    });

    it('field is closed', function () {
      scope.toggleField(field);
      expect(scope.isFieldOpen(field)).toBeFalsy();
    });
  });

  describe('open a field', function () {
    var field;
    beforeEach(function () {
      field = {uiid: 123};
    });

    it('field is closed', function () {
      expect(scope.isFieldOpen(field)).toBeFalsy();
    });

    it('field is open', function () {
      scope.openField(field);
      expect(scope.isFieldOpen(field)).toBeTruthy();
    });
  });

  describe('click a field', function () {
    var field;
    beforeEach(function () {
      field = {uiid: 123};
      scope.openField = sinon.stub();
      scope.fieldClicked(field);
    });

    it('field is opened', function () {
      expect(scope.openField).toBeCalledWith(field);
    });
  });

});
