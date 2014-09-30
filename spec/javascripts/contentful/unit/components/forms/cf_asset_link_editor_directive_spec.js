'use strict';

describe('cfAssetLinkEditor Directive', function () {
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

    inject(function ($compile, $rootScope, cfAssetLinkEditorDirective) {
      cfAssetLinkEditorDirective[0].controller = ControllerMock;
      scope = $rootScope.$new();
      scope.can = stubs.can;
      scope.linkType = 'Asset';
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
          getAssets: sinon.stub()
        },
        localizedField: stubs.localizedField,
        publishedTypeForEntry: stubs.publishedType
      };

      compileElement = function (extra) {
        element = $compile('<div cf-asset-link-editor cf-link-editor="field.items.linkType" '+
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

    it('first link is updated', function () {
      expect(scope.links[0].sys.id).toBe(456);
    });

    it('second link is updated', function () {
      expect(scope.links[1].sys.id).toBe(789);
    });
  });


  describe('updating the model manually', function () {
    beforeEach(function () {
      scope.linkSingle = true;
      compileElement();
      scope.links = [{ sys: {id: 456} }];
      scope.updateModel();
    });

    it('updates the fieldData', function () {
      expect(scope.fieldData.value).toEqual({ sys: {id: 456} });
    });
  });


  describe('for asset links', function () {
    beforeEach(function () {
      scope.otEditable = true;
      scope.field.items.linkType = 'Asset';
      scope.linkType = 'Asset';
      scope.linkedEntities = [];
      scope.entities = [];
      compileElement();
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


});
