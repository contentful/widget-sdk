'use strict';

describe('cfLinkEditorSearch Directive', function () {
  var element, scope, stubs, compileElement, searchField;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'localizedField',
        'publishedEntryName',
        'publishedType',
        'entryTitle'
      ]);

      $provide.removeDirectives('cfTokenizedSearch');
      $provide.removeControllers('cfLinkEditorSearchController');
    });

    inject(function ($compile, $rootScope) {
      scope = $rootScope.$new();

      scope.locale = {
        code: 'en-US'
      };

      scope.permissionController = {
        createEntry: {
          shouldHide: false,
          shouldDisable: false
        },
        createAsset: {
          shouldHide: false,
          shouldDisable: false
        }
      };

      scope.spaceContext = {
        localizedField: stubs.localizedField,
        publishedTypeForEntry: stubs.publishedType
      };

      compileElement = function () {
        element = $compile('<div cf-link-editor-search></div>')(scope);
        scope.$digest();
        searchField = element.find('.l-search-w-autocomplete');
      };
    });
  });

  describe('shows new button for link to entries with no validation', function () {
    var newButton;
    beforeEach(function () {
      scope.entityType = 'Entry';
      scope.addableContentTypes = [
        {
          getId:   _.constant('herp'),
          getName: _.constant('Herp')
        },
        {
          getId:   _.constant('derp'),
          getName: _.constant('Derp')
        }
      ];

      compileElement();
      newButton = element.find('button:contains("Add New")');
    });

    it('to have button', function () {
      expect(newButton.get(0)).toBeDefined();
    });

    it('gets the name of the content type', function () {
      expect(element.text()).toMatch('Herp');
      expect(element.text()).toMatch('Derp');
    });

  });

  describe('shows new button for link to entries with validations', function () {
    var newButton;
    beforeEach(function () {
      scope.entityType = 'Entry';
      scope.addableContentTypes = [
        {
          getId:   _.constant('herp'),
          getName: _.constant('Herp')
        }
      ];

      compileElement();
      newButton = element.find('button:contains("Add New")');
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
      scope.entityType = 'Asset';

      compileElement();
      newButton = element.find('button:contains("Add New")');
    });

    it('to have button', function () {
      expect(newButton.get(0)).toBeDefined();
    });

    it('has action on button', function () {
      expect(newButton.attr('ng-click')).toMatch('addNewAsset');
    });
  });

  describe('for asset links', function () {
    beforeEach(function () {
      scope.otEditable = true;
      scope.linkedEntities = [];
      scope.entities = [];
      scope.entityType = 'Asset';
      compileElement();
    });

    it('shows cf-link-editor-search', function () {
      expect(element.find('.link-editor__controls')).not.toBeNgHidden();
    });

    it('results are not shown', function () {
      expect(element.find('.search-results')).toBeNgHidden();
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

      it('has 2 assets', function () {
        expect(element.find('.cell-preview').length).toBe(2);
      });

      it('first asset is selected', function () {
        expect(element.find('.cell-preview').eq(0).parent()).toHaveClass('selected');
      });

      it('shows only one cf-thumbnail', function(){
        expect(element.find('.cf-thumbnail').size()).toBe(1);
      });

      it('file type is not shown for first asset', function () {
        expect(element.find('.cell-type p').eq(0)).toBeNgHidden();
      });

      it('file type is shown for second asset', function () {
        expect(element.find('.cell-type p').eq(1)).not.toBeNgHidden();
      });

      it('localizedField is called for first asset file', function () {
        sinon.assert.calledWith(stubs.localizedField, scope.entities[0], 'data.fields.file', 'en-US');
      });

      it('localizedField is called for second asset file', function () {
        sinon.assert.calledWith(stubs.localizedField, scope.entities[1], 'data.fields.file', 'en-US');
      });

      it('localizedField is called for first asset title', function () {
        sinon.assert.calledWith(stubs.localizedField, scope.entities[0], 'data.fields.title', 'en-US');
      });

      it('localizedField is called for second asset title', function () {
        sinon.assert.calledWith(stubs.localizedField, scope.entities[1], 'data.fields.title', 'en-US');
      });

      it('localizedField is called for first asset description', function () {
        sinon.assert.calledWith(stubs.localizedField, scope.entities[0], 'data.fields.description', 'en-US');
      });

      it('localizedField is called for second asset description', function () {
        sinon.assert.calledWith(stubs.localizedField, scope.entities[1], 'data.fields.description', 'en-US');
      });

    });

  });

  describe('for entry links', function () {
    beforeEach(function () {
      scope.otEditable = true;
      scope.linkedEntities = [];
      scope.entities = [];
      scope.entityType = 'Entry';
      compileElement();
    });

    it('shows cf-link-editor-search', function () {
      expect(element.find('.link-editor__controls')).not.toBeNgHidden();
    });

    it('results are not shown', function () {
      expect(element.find('.search-results')).toBeNgHidden();
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

      it('has 2 entry items', function () {
        expect(element.find('.cell-content-type').length).toBe(2);
      });

      it('first entry is selected', function () {
        expect(element.find('.cell-content-type').eq(0).parent()).toHaveClass('selected');
      });

      it('gets published type for first entry', function () {
        sinon.assert.calledWith(stubs.publishedType, scope.entities[0]);
      });

      it('gets published type for second entry', function () {
        sinon.assert.calledWith(stubs.publishedType, scope.entities[1]);
      });

    });
  });

});
