'use strict';

describe('cfLinkEditor Directive', function () {
  var element, scope;
  var compileElement;
  var searchField;
  var stubs;

  function ControllerMock() {
  }

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'can',
        'localizedField',
        'publishedEntryName',
        'publishedType',
        'entryTitle'
      ]);

      $provide.value('fileTypeFilter', function () {return '';});
      $provide.value('fileExtensionFilter', function () {return '';});

      $provide.removeDirectives('cfThumbnail', 'relative');
    });

    inject(function ($compile, $rootScope, cfLinkEditorDirective) {
      cfLinkEditorDirective[0].controller = ControllerMock;
      scope = $rootScope.$new();
      scope.can = stubs.can;
      scope.fieldData = { value: {
        sys: {id: 123}
      }};

      scope.field = {
        items: {}
      };

      scope.locale = {
        code: 'en-US'
      };

      stubs.publishedType.returns({
        getName: stubs.publishedEntryName
      });
      scope.spaceContext = {
        space: {
          getEntries: sinon.stub(),
          getAssets: sinon.stub()
        },
        localizedField: stubs.localizedField,
        publishedTypeForEntry: stubs.publishedType,
        entryTitle: stubs.entryTitle
      };

      compileElement = function (extra) {
        element = $compile('<div cf-link-editor="field.items.linkType" '+
                           'ng-model="fieldData.value" '+
                           extra+
                           '></div>')(scope);
        scope.$digest();
        searchField = element.find('.search-with-results');
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
      scope.entities = [];
      compileElement();
    });

    it('has a linktype', function () {
      expect(scope.linkType).toBe('Entry');
    });

    it('has a fetchMethod', function () {
      expect(scope.fetchMethod).toBe('getEntries');
    });

    it('does not show links list', function () {
      expect(element.find('.links')).toBeNgHidden();
    });

    it('shows cf-link-editor-search', function () {
      expect(element.find('.cf-link-editor-search .controls')).not.toBeNgHidden();
    });

    it('results are not shown', function () {
      expect(element.find('.results')).toBeNgHidden();
    });

    describe('if search results exist', function () {
      beforeEach(function () {
        scope.selectedEntity = { getId: function(){return 123;}};
        scope.entities = [
          scope.selectedEntity,
          { getId: function(){return Math.random();}}
        ];
        scope.$digest();
      });

      it('has 2 entry items (plus a header)', function () {
        expect(element.find('.cell-content-type').length).toBe(3);
      });

      it('first entry is selected', function () {
        expect(element.find('.cell-content-type').eq(1).parent()).toHaveClass('selected');
      });

      it('gets published type for first entry', function () {
        expect(stubs.publishedType).toBeCalledWith(scope.entities[0]);
      });

      it('gets published type for second entry', function () {
        expect(stubs.publishedType).toBeCalledWith(scope.entities[1]);
      });

      it('gets name for entries', function () {
        expect(stubs.publishedEntryName).toBeCalled();
      });

      it('gets title for first entry', function () {
        expect(stubs.entryTitle).toBeCalledWith(scope.entities[0]);
      });

      it('gets title for second entry', function () {
        expect(stubs.entryTitle).toBeCalledWith(scope.entities[1]);
      });

    });

    describe('if field type is array', function () {
      beforeEach(function () {
        scope.field.type = 'Array';
        scope.linkedEntities = [{}];
        scope.$digest();
      });

      it('shows cf-link-editor-search', function () {
        expect(element.find('.cf-link-editor-search .controls')).not.toBeNgHidden();
      });
    });

    describe('has a known content type', function () {
      beforeEach(function () {
        var nameStub = sinon.stub();
        nameStub.returns('Thing');
        scope.linkContentType = {
          getName: nameStub,
          data: {
            fields: []
          }
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
        expect(element.find('.drag-handle')).toBeNgHidden();
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
        expect(element.find('.links')).not.toBeNgHidden();
      });

      it('does not show cf-link-editor-search', function () {
        expect(element.find('.cf-link-editor-search')).toBeNgHidden();
      });

      it('drag-file is shown because there is multiple links', function () {
        expect(element.find('.drag-handle')).not.toBeNgHidden();
      });

      it('cf-file-info is not shown', function () {
        expect(element.find('.cf-file-info').get(0)).toBeUndefined();
      });

      it('entry-info is shown', function () {
        expect(element.find('.entry-info').get(0)).toBeDefined();
      });

      it('link with description is shown for 1st entity', function () {
        expect(element.find('.entry-info a').eq(0)).not.toBeNgHidden();
      });

      it('link with description is shown for 2nd entity', function () {
        expect(element.find('.entry-info a').eq(1)).not.toBeNgHidden();
      });

      it('link with description is not shown for 3rd entity', function () {
        expect(element.find('.entry-info a').eq(2)).toBeNgHidden();
      });

      it('span with description is not shown for 1st entity', function () {
        expect(element.find('.entry-info span').eq(0)).toBeNgHidden();
      });

      it('span with description is not shown for 2nd entity', function () {
        expect(element.find('.entry-info span').eq(1)).toBeNgHidden();
      });

      it('span with description is shown for 3rd entity', function () {
        expect(element.find('.entry-info span').eq(2)).not.toBeNgHidden();
      });

      it('description method is called for first entity', function () {
        expect(descriptionStub).toBeCalledWith(scope.linkedEntities[0]);
      });

      it('description method is called for second entity', function () {
        expect(descriptionStub).toBeCalledWith(scope.linkedEntities[1]);
      });

      it('description method is called for third entity', function () {
        expect(descriptionStub).toBeCalledWith(scope.linkedEntities[2]);
      });

      it('first entity has no unpublished marker', function () {
        expect(element.find('.entry-info .unpublished').eq(0)).toBeNgHidden();
      });

      it('second entity has unpublished marker', function () {
        expect(element.find('.entry-info .unpublished').eq(1)).not.toBeNgHidden();
      });

      it('third entity has no unpublished marker', function () {
        expect(element.find('.entry-info .unpublished').eq(2)).toBeNgHidden();
      });

    });

  });

  describe('for asset links', function () {
    beforeEach(function () {
      scope.otEditable = true;
      scope.field.items.linkType = 'Asset';
      scope.linkedEntities = [];
      scope.entities = [];
      compileElement();
    });

    it('has a linktype', function () {
      expect(scope.linkType).toBe('Asset');
    });

    it('has a fetchMethod', function () {
      expect(scope.fetchMethod).toBe('getAssets');
    });

    it('does not show links list', function () {
      expect(element.find('.links')).toBeNgHidden();
    });

    it('shows cf-link-editor-search', function () {
      expect(element.find('.cf-link-editor-search .controls')).not.toBeNgHidden();
    });

    it('results are not shown', function () {
      expect(element.find('.results')).toBeNgHidden();
    });

    describe('if search results exist', function () {
      beforeEach(inject(function () {
        scope.selectedEntity = { getId: function(){return 123;}};
        scope.entities = [
          scope.selectedEntity,
          {
            getId: function(){return Math.random();},
            file: {
              url: 'http://url'
            }
          }
        ];
        stubs.localizedField.withArgs(scope.entities[0], 'data.fields.file').returns(null);
        stubs.localizedField.withArgs(scope.entities[1], 'data.fields.file').returns(scope.entities[1].file);
        scope.$digest();
      }));

      it('has 2 assets (plus a header)', function () {
        expect(element.find('.cell-preview').length).toBe(3);
      });

      it('first asset is selected', function () {
        expect(element.find('.cell-preview').eq(1).parent()).toHaveClass('selected');
      });

      it('cf-thumbnail is not shown for first asset', function () {
        expect(element.find('.cf-thumbnail').eq(0)).toBeNgHidden();
      });

      it('cf-thumbnail is shown for second asset', function () {
        expect(element.find('.cf-thumbnail').eq(1)).not.toBeNgHidden();
      });

      it('file type is not shown for first asset', function () {
        expect(element.find('.cell-type p').eq(0)).toBeNgHidden();
      });

      it('file type is shown for second asset', function () {
        expect(element.find('.cell-type p').eq(1)).not.toBeNgHidden();
      });

      it('localizedField is called for first asset file', function () {
        expect(stubs.localizedField).toBeCalledWith(scope.entities[0], 'data.fields.file', 'en-US');
      });

      it('localizedField is called for second asset file', function () {
        expect(stubs.localizedField).toBeCalledWith(scope.entities[1], 'data.fields.file', 'en-US');
      });

      it('localizedField is called for first asset title', function () {
        expect(stubs.localizedField).toBeCalledWith(scope.entities[0], 'data.fields.title', 'en-US');
      });

      it('localizedField is called for second asset title', function () {
        expect(stubs.localizedField).toBeCalledWith(scope.entities[1], 'data.fields.title', 'en-US');
      });

      it('localizedField is called for first asset description', function () {
        expect(stubs.localizedField).toBeCalledWith(scope.entities[0], 'data.fields.description', 'en-US');
      });

      it('localizedField is called for second asset description', function () {
        expect(stubs.localizedField).toBeCalledWith(scope.entities[1], 'data.fields.description', 'en-US');
      });

    });

    describe('if field type is array', function () {
      beforeEach(function () {
        scope.field.type = 'Array';
        scope.linkedEntities = [{}];
        scope.$digest();
      });

      it('shows cf-link-editor-search', function () {
        expect(element.find('.cf-link-editor-search .controls')).not.toBeNgHidden();
      });
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
        expect(element.find('.drag-handle')).toBeNgHidden();
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
        expect(element.find('.links')).not.toBeNgHidden();
      });

      it('does not show cf-link-editor-search', function () {
        expect(element.find('.cf-link-editor-search')).toBeNgHidden();
      });

      it('has asset-link class on list', function () {
        expect(element.find('.links')).toHaveClass('asset-link');
      });

      it('has asset-link class on list items', function () {
        expect(element.find('.links li')).toHaveClass('asset-link');
      });

      it('has drag-file class on drag handle', function () {
        expect(element.find('.drag-handle')).toHaveClass('drag-file');
      });

      it('drag-file is shown because there is multiple links', function () {
        expect(element.find('.drag-handle')).not.toBeNgHidden();
      });

      it('cf-file-info is shown', function () {
        expect(element.find('.cf-file-info').get(0)).toBeDefined();
      });

      it('entry-info is not shown', function () {
        expect(element.find('.entry-info').get(0)).toBeUndefined();
      });

      it('localizedField is called with first entity and title', function () {
        expect(stubs.localizedField).toBeCalledWith(scope.linkedEntities[0], 'data.fields.title', 'en-US');
      });

      it('localizedField is called with second entity and title', function () {
        expect(stubs.localizedField).toBeCalledWith(scope.linkedEntities[1], 'data.fields.title', 'en-US');
      });

      it('localizedField is called with first entity and file', function () {
        expect(stubs.localizedField).toBeCalledWith(scope.linkedEntities[0], 'data.fields.file', 'en-US');
      });

      it('localizedField is called with second entity and file', function () {
        expect(stubs.localizedField).toBeCalledWith(scope.linkedEntities[1], 'data.fields.file', 'en-US');
      });
    });

  });


  describe('shows new button for link to entries with no validation', function () {
    var newButton;
    var nameStub;
    beforeEach(function () {
      scope.field.items.linkType = 'Entry';
      scope.linkContentType = null;
      nameStub = sinon.stub();
      scope.spaceContext.publishedContentTypes = [
        {
          getId: function(){return Math.random();},
          getName: nameStub
        }
      ];

      stubs.can.withArgs('create', 'Entry').returns(true);

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

    it('gets the name of the content type', function () {
      expect(nameStub).toBeCalled();
    });

  });

  describe('shows new button for link to entries with validations', function () {
    var newButton;
    beforeEach(function () {
      scope.field.items.linkType = 'Entry';
      scope.linkContentType = {
        getName: sinon.stub().returns('ContentTypeName'),
        getId: sinon.stub().returns('contentypeId'),
        data: {
          fields: []
        }
      };

      stubs.can.withArgs('create', 'Entry').returns(true);

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
      stubs.can.withArgs('create', 'Asset').returns(true);

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
