'use strict';

describe('cfLinkEditor Directive', function () {
  var element, scope;
  var compileElement;
  var searchField;
  var canStub;

  beforeEach(function () {
    module('contentful/test');
    inject(function ($compile, $rootScope) {
      scope = $rootScope.$new();
      canStub = sinon.stub();
      scope.can = canStub;
      scope.fieldData = { value: {
        sys: {id: 123}
      }};

      scope.field = {
        items: {}
      };

      scope.spaceContext = {
        space: {
          getEntries: sinon.stub(),
          getAssets: sinon.stub()
        }
      };

      compileElement = function (extra) {
        element = $compile('<div cf-link-editor="field.items.linkType" '+
                           'ng-model="fieldData.value" '+
                           extra+
                           '></div>')(scope);
        scope.$digest();
        searchField = element.find('.search-field');
      };
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));


  describe('model controller gets updated for single links', function () {
    beforeEach(function () {
      compileElement();
      scope.fieldData = { value: {
        sys: {id: 456}
      }};
      scope.$digest();
    });

    it('expects link single to be set', function () {
      expect(scope.linkSingle).toBeTruthy();
    });

    it('expects link multiple to be unset', function () {
      expect(scope.linkMultiple).toBeFalsy();
    });

    it('links is updated', function () {
      expect(scope.links[0].sys.id).toBe(456);
    });
  });

  describe('model controller gets updated with multiple links', function () {
    beforeEach(function () {
      scope.fieldData = { value: [
        { sys: {id: 123} }
      ]};

      compileElement('link-multiple="true"');
      scope.fieldData = { value: [
        { sys: {id: 456} },
        { sys: {id: 789} }
      ]};
      scope.$digest();
    });

    it('expects link single to be unset', function () {
      expect(scope.linkSingle).toBeFalsy();
    });

    it('expects link multiple to be unset', function () {
      expect(scope.linkMultiple).toBeTruthy();
    });

    it('first link is updated', function () {
      expect(scope.links[0].sys.id).toBe(456);
    });

    it('second link is updated', function () {
      expect(scope.links[1].sys.id).toBe(789);
    });
  });


  describe('updating the model', function () {
    beforeEach(function () {
      compileElement();
      scope.links = [{ sys: {id: 456} }];
      scope.updateModel();
    });

    it('updates the fieldData', function () {
      expect(scope.fieldData.value).toEqual({ sys: {id: 456} });
    });
  });


  describe('for entry links', function () {
    beforeEach(function () {
      scope.field.items.linkType = 'Entry';
      compileElement();
    });

    it('has a linktype', function () {
      expect(scope.linkType).toBe('Entry');
    });

    it('has a fetchMethod', function () {
      expect(scope.fetchMethod).toBe('getEntries');
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

  describe('for asset links', function () {
    beforeEach(function () {
      scope.field.items.linkType = 'Asset';
      compileElement();
    });

    it('has a linktype', function () {
      expect(scope.linkType).toBe('Asset');
    });

    it('has a fetchMethod', function () {
      expect(scope.fetchMethod).toBe('getAssets');
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


  describe('shows new button for link to entries with no validation', function () {
    var newButton;
    beforeEach(function () {
      scope.field.items.linkType = 'Entry';
      scope.linkContentType = null;
      scope.spaceContext.publishedContentTypes = [
        {getId: function(){return Math.random();}}
      ];

      canStub.withArgs('create', 'Entry').returns(true);

      compileElement();
      newButton = element.find('.add-new');
    });

    it('to have button', function () {
      expect(newButton.get(0)).toBeDefined();
    });

    it('has dropdown menu', function () {
      expect(newButton.find('.dropdown-menu').get(0)).toBeDefined();
    });

    it('has menu elements', function () {
      expect(newButton.find('.dropdown-menu li').get(0)).toBeDefined();
    });

    it('has action on menu elements', function () {
      expect(newButton.find('.dropdown-menu li').attr('ng-click')).toMatch('addNewEntry');
    });
  });

  describe('shows new button for link to entries with validations', function () {
    var newButton;
    beforeEach(function () {
      scope.field.items.linkType = 'Entry';
      scope.linkContentType = {
        getName: sinon.stub()
      };

      canStub.withArgs('create', 'Entry').returns(true);

      compileElement();
      newButton = element.find('.add-new');
    });

    it('to have button', function () {
      expect(newButton.get(0)).toBeDefined();
    });

    it('has action on button', function () {
      expect(newButton.attr('ng-click')).toMatch('addNewEntry');
    });
  });

  describe('shows new button for link to assets with no validations', function () {
    var newButton;
    beforeEach(function () {
      scope.field.items.linkType = 'Asset';
      canStub.withArgs('create', 'Asset').returns(true);

      compileElement();
      newButton = element.find('.add-new');
    });

    it('to have button', function () {
      expect(newButton.get(0)).toBeDefined();
    });

    it('has action on button', function () {
      expect(newButton.attr('ng-click')).toMatch('addNewAsset');
    });
  });

});
