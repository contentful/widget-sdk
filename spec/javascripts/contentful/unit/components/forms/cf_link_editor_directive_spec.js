'use strict';

describe('cfLinkEditor Directive', function () {
  var element, scope;
  var compileElement;
  var searchField, canStub, localizedFieldStub;

  function ControllerMock() {
  }

  beforeEach(function () {
    module('contentful/test');
    inject(function ($compile, $rootScope, cfLinkEditorDirective) {
      cfLinkEditorDirective[0].controller = ControllerMock;
      scope = $rootScope.$new();
      canStub = sinon.stub();
      scope.can = canStub;
      scope.fieldData = { value: {
        sys: {id: 123}
      }};

      scope.field = {
        items: {}
      };

      localizedFieldStub = sinon.stub();
      scope.spaceContext = {
        space: {
          getEntries: sinon.stub(),
          getAssets: sinon.stub()
        },
        localizedField: localizedFieldStub
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


  describe('updating the model manually', function () {
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
      scope.otEditable = true;
      scope.field.items.linkType = 'Entry';
      scope.linkedEntities = [];
      compileElement();
    });

    it('has a linktype', function () {
      expect(scope.linkType).toBe('Entry');
    });

    it('has a fetchMethod', function () {
      expect(scope.fetchMethod).toBe('getEntries');
    });

    it('does not show links list', function () {
      expect(element.find('.links').hasClass('ng-hide')).toBeTruthy();
    });

    it('shows cf-link-editor-search', function () {
      expect(element.find('.cf-link-editor-search .controls').hasClass('ng-hide')).toBeFalsy();
    });

    describe('has a known content type', function () {
      beforeEach(function () {
        var nameStub = sinon.stub();
        nameStub.returns('Thing');
        scope.linkContentType = {
          getName: nameStub
        };

        scope.$digest();
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

    describe('has one link with no array field', function () {
      beforeEach(function () {
        scope.field.type = 'Link';
        scope.linkedEntities = [{}];
        scope.$digest();
      });

      it('drag-file is hidden because there is only one link', function () {
        expect(element.find('.drag-handle').hasClass('ng-hide')).toBeTruthy();
      });
    });

    describe('has multiple links with no array field', function () {
      var descriptionStub;
      beforeEach(function () {
        scope.field.type = 'Link';
        var publishStub = sinon.stub();
        publishStub.returns(true);
        scope.linkedEntities = [
          {data: '1'},
          {data: '2', canPublish: publishStub},
          {}
        ];
        descriptionStub = sinon.stub();
        scope.linkDescription = descriptionStub;
        scope.$digest();
      });

      it('shows links list', function () {
        expect(element.find('.links').hasClass('ng-hide')).toBeFalsy();
      });

      it('does not show cf-link-editor-search', function () {
        expect(element.find('.cf-link-editor-search .controls').hasClass('ng-hide')).toBeTruthy();
      });

      it('drag-file is shown because there is multiple links', function () {
        expect(element.find('.drag-handle').hasClass('ng-hide')).toBeFalsy();
      });

      it('cf-file-info is not shown', function () {
        expect(element.find('.cf-file-info').get(0)).toBeUndefined();
      });

      it('entry-info is shown', function () {
        expect(element.find('.entry-info').get(0)).toBeDefined();
      });

      it('link with description is shown for 1st entity', function () {
        expect(element.find('.entry-info a').eq(0).hasClass('ng-hide')).toBeFalsy();
      });

      it('link with description is shown for 2nd entity', function () {
        expect(element.find('.entry-info a').eq(1).hasClass('ng-hide')).toBeFalsy();
      });

      it('link with description is not shown for 3rd entity', function () {
        expect(element.find('.entry-info a').eq(2).hasClass('ng-hide')).toBeTruthy();
      });

      it('span with description is not shown for 1st entity', function () {
        expect(element.find('.entry-info span').eq(0).hasClass('ng-hide')).toBeTruthy();
      });

      it('span with description is not shown for 2nd entity', function () {
        expect(element.find('.entry-info span').eq(1).hasClass('ng-hide')).toBeTruthy();
      });

      it('span with description is shown for 3rd entity', function () {
        expect(element.find('.entry-info span').eq(2).hasClass('ng-hide')).toBeFalsy();
      });

      it('description method is called for first entity', function () {
        expect(descriptionStub.calledWith(scope.linkedEntities[0])).toBeTruthy();
      });

      it('description method is called for second entity', function () {
        expect(descriptionStub.calledWith(scope.linkedEntities[1])).toBeTruthy();
      });

      it('description method is called for third entity', function () {
        expect(descriptionStub.calledWith(scope.linkedEntities[2])).toBeTruthy();
      });

      it('first entity has no unpublished marker', function () {
        expect(element.find('.entry-info .unpublished').eq(0).hasClass('ng-hide')).toBeTruthy();
      });

      it('second entity has unpublished marker', function () {
        expect(element.find('.entry-info .unpublished').eq(1).hasClass('ng-hide')).toBeFalsy();
      });

      it('third entity has no unpublished marker', function () {
        expect(element.find('.entry-info .unpublished').eq(2).hasClass('ng-hide')).toBeTruthy();
      });


    });

  });

  describe('for asset links', function () {
    beforeEach(function () {
      scope.otEditable = true;
      scope.field.items.linkType = 'Asset';
      scope.linkedEntities = [];
      compileElement();
    });

    it('has a linktype', function () {
      expect(scope.linkType).toBe('Asset');
    });

    it('has a fetchMethod', function () {
      expect(scope.fetchMethod).toBe('getAssets');
    });

    it('does not show links list', function () {
      expect(element.find('.links').hasClass('ng-hide')).toBeTruthy();
    });

    it('shows cf-link-editor-search', function () {
      expect(element.find('.cf-link-editor-search .controls').hasClass('ng-hide')).toBeFalsy();
    });

    describe('has a known asset mimetype', function () {
      beforeEach(function () {
        scope.linkMimetypeGroup = 'image';
        scope.$digest();
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

    describe('has one link with no array field', function () {
      beforeEach(function () {
        scope.field.type = 'Link';
        scope.linkedEntities = [{}];
        scope.$digest();
      });

      it('drag-file is hidden because there is only one link', function () {
        expect(element.find('.drag-handle').hasClass('ng-hide')).toBeTruthy();
      });
    });

    describe('has multiple links with no array field', function () {
      beforeEach(function () {
        scope.field.type = 'Link';
        scope.linkedEntities = [
          {data: '1'},
          {data: '2'}
        ];
        scope.$digest();
      });

      it('shows links list', function () {
        expect(element.find('.links').hasClass('ng-hide')).toBeFalsy();
      });

      it('does not show cf-link-editor-search', function () {
        expect(element.find('.cf-link-editor-search .controls').hasClass('ng-hide')).toBeTruthy();
      });

      it('has asset-link class on list', function () {
        expect(element.find('.links').hasClass('asset-link')).toBeTruthy();
      });

      it('has asset-link class on list items', function () {
        expect(element.find('.links li').hasClass('asset-link')).toBeTruthy();
      });

      it('has drag-file class on drag handle', function () {
        expect(element.find('.drag-handle').hasClass('drag-file')).toBeTruthy();
      });

      it('drag-file is shown because there is multiple links', function () {
        expect(element.find('.drag-handle').hasClass('ng-hide')).toBeFalsy();
      });

      it('cf-file-info is shown', function () {
        expect(element.find('.cf-file-info').get(0)).toBeDefined();
      });

      it('entry-info is not shown', function () {
        expect(element.find('.entry-info').get(0)).toBeUndefined();
      });

      it('localizedField is called with first entity and title', function () {
        expect(localizedFieldStub.calledWith(scope.linkedEntities[0], 'data.fields.title')).toBeTruthy();
      });

      it('localizedField is called with second entity and title', function () {
        expect(localizedFieldStub.calledWith(scope.linkedEntities[1], 'data.fields.title')).toBeTruthy();
      });

      it('localizedField is called with first entity and file', function () {
        expect(localizedFieldStub.calledWith(scope.linkedEntities[0], 'data.fields.file')).toBeTruthy();
      });

      it('localizedField is called with second entity and file', function () {
        expect(localizedFieldStub.calledWith(scope.linkedEntities[1], 'data.fields.file')).toBeTruthy();
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
