'use strict';

describe('cfLinkEditor Directve', function () {
  var element, scope;
  var compileElement;
  var getCTStub;
  var searchField;
  beforeEach(module('contentful/test'));

  beforeEach(inject(function ($compile, $rootScope) {
    getCTStub = sinon.stub();

    scope = $rootScope.$new();
    scope.fieldData = { value: {}};
    scope.field = {
      items: {
        linkType: 'Entry'
      },
      type: 'Array'
    };
    scope.spaceContext = {
      getContentType: getCTStub
    };

    compileElement = function () {
      return $compile('<div cf-link-editor="field.items.linkType" ng-model="fieldData.value"></div>')(scope);
    };
    element = compileElement();
    scope.$digest();
    searchField = element.find('.search-field');
  }));

  it('has a linktype', function () {
    expect(scope.linkType).toBe('Entry');
  });

  describe('has validations', function () {
    beforeEach(function () {
      scope.field.validations = [
        {linkContentType: 'contentTypeId'}
      ];

      var nameStub = sinon.stub();
      nameStub.returns('Thing');
      getCTStub.withArgs('contentTypeId').returns({
        getName: nameStub
      });

      element = compileElement();
      scope.$digest();
      searchField = element.find('.search-field');
    });

    it('gets the validation', function () {
      expect(getCTStub.calledWith('contentTypeId')).toBe(true);
    });

    it('sets the entity name', function () {
      expect(scope.entityName).toBe('Thing');
    });

    it('has entity name in placeholder', function () {
      expect(searchField.attr('placeholder')).toMatch(/Thing/);
    });

    it('has entity name in placeholder', function () {
      debugger;
      expect(searchField.attr('tooltip')).toMatch(/Thing/);
    });

  });

  describe('has no validations', function () {
    it('gets no validation', function () {
      expect(getCTStub.calledWith('contentTypeId')).toBe(false);
    });

    it('sets the entity name', function () {
      expect(scope.entityName).toBe('Entry');
    });

    it('has entity name in placeholder', function () {
      expect(searchField.attr('placeholder')).toMatch(/Entry/);
    });

    it('has entity name in placeholder', function () {
      expect(searchField.attr('tooltip')).toMatch(/Entry/);
    });

  });



});
