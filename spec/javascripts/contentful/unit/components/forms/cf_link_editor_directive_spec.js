'use strict';

describe('cfLinkEditor Directve', function () {
  var element, scope;
  var compileElement;
  var searchField;
  beforeEach(module('contentful/test'));

  beforeEach(inject(function ($compile, $rootScope) {
    scope = $rootScope.$new();
    scope.fieldData = { value: {}};
    scope.field = {
      items: {}
    };
    scope.spaceContext = {
    };

    compileElement = function () {
      element = $compile('<div cf-link-editor="field.items.linkType" ng-model="fieldData.value"></div>')(scope);
      scope.$digest();
      searchField = element.find('.search-field');
    };
  }));

  describe('links entries', function () {
    beforeEach(function () {
      scope.field.items.linkType = 'Entry';
      compileElement();
    });

    it('has a linktype', function () {
      expect(scope.linkType).toBe('Entry');
    });

    describe('has a known content type', function () {
      beforeEach(function () {
        var nameStub = sinon.stub();
        nameStub.returns('Thing');
        scope.linkContentType = {
          getName: nameStub
        };

        compileElement();
      });

      it('sets the entity name', function () {
        expect(scope.entityName).toBe('Thing');
      });

      it('has entity name in placeholder', function () {
        expect(searchField.attr('placeholder')).toMatch(/Thing/);
      });

      it('has entity name in placeholder', function () {
        expect(searchField.attr('tooltip')).toMatch(/Thing/);
      });

    });

    describe('has no known content type', function () {
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

  describe('links assets', function () {
    beforeEach(function () {
      scope.field.items.linkType = 'Asset';
      compileElement();
    });

    it('has a linktype', function () {
      expect(scope.linkType).toBe('Asset');
    });

    describe('has a known asset mimetype', function () {
      beforeEach(function () {
        scope.linkMimetypeGroup = 'image';

        compileElement();
      });

      it('sets the entity name', function () {
        expect(scope.entityName).toBe('Image');
      });

      it('has entity name in placeholder', function () {
        expect(searchField.attr('placeholder')).toMatch(/Image/);
      });

      it('has entity name in placeholder', function () {
        expect(searchField.attr('tooltip')).toMatch(/Image/);
      });

    });

    describe('has no known asset mime type', function () {
      it('sets the entity name', function () {
        expect(scope.entityName).toBe('Asset');
      });

      it('has entity name in placeholder', function () {
        expect(searchField.attr('placeholder')).toMatch(/Asset/);
      });

      it('has entity name in placeholder', function () {
        expect(searchField.attr('tooltip')).toMatch(/Asset/);
      });

    });
  });


});
