'use strict';

describe('LinkContentTypeValidationController', function(){
  var scope, controller;

  beforeEach(function(){
    module('contentful/test');
    inject(function($rootScope, $controller){
      scope = $rootScope.$new();
      scope.validation = {linkContentType: null};
      scope.spaceContext = {
        publishedContentTypes: [
          {getId: _.constant('foo')},
          {getId: _.constant('bar')},
        ]
      };
      scope.updateDoc = sinon.stub();
      controller = $controller('LinkContentTypeValidationController', {$scope: scope});
    });
  });

  it('initializes the list with selected content types', function () {
    scope.validation.linkContentType = ['foo'];
    scope.$apply();
    expect(controller.contentTypes).toEqual({foo: true, bar: false});
  });

  it('initializes the list with null', function () {
    scope.validation.linkContentType = null;
    scope.$apply();
    expect(controller.contentTypes).toEqual({foo: false, bar: false});
  });

  describe('changes', function(){
    beforeEach(function(){
      scope.validation.linkContentType = ['foo'];
      scope.$apply();
    });

    it('updates the object when an id is added to the list', function () {
      scope.validation.linkContentType.push('bar');
      scope.$apply();
      expect(controller.contentTypes).toEqual({foo: true, bar: true});
    });

    it('updates the object when an id is removed from the list', function () {
      scope.validation.linkContentType.pop();
      scope.$apply();
      expect(controller.contentTypes).toEqual({foo: false, bar: false});
    });

    it('updates the list when an id is added to the object', function () {
      controller.contentTypes.bar = true;
      controller.updateValidation();
      expect(scope.validation.linkContentType).toEqual(['foo', 'bar']);
      expect(scope.updateDoc).toBeCalled();
    });

    it('updates the list when an id is removed from the object', function () {
      controller.contentTypes.foo = false;
      controller.updateValidation();
      expect(scope.validation.linkContentType).toEqual([]);
      expect(scope.updateDoc).toBeCalled();
    });
  });

  it('updates the object if the "list" is still a string (old format)', function () {
    scope.validation.linkContentType = 'foo';
    scope.$apply();
    expect(controller.contentTypes).toEqual({foo: true, bar: false});
    controller.updateValidation();
    expect(scope.validation.linkContentType).toEqual(['foo']);
    expect(scope.updateDoc).toBeCalled();
  });
});

