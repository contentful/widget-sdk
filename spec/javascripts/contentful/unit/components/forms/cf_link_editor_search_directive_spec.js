'use strict';

describe('cfLinkEditorSearch Directive', function () {
  var element, scope, stubs, compileElement, searchField;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'can',
        'localizedField',
        'publishedEntryName',
        'publishedType',
        'entryTitle'
      ]);

      $provide.removeDirectives('cfTokenizedSearch');
    });

    inject(function ($compile, $rootScope, cfLinkEditorSearchDirective) {
      cfLinkEditorSearchDirective[0].controller = angular.noop;
      scope = $rootScope.$new();

      scope.locale = {
        code: 'en-US'
      };

      scope.spaceContext = {
        localizedField: stubs.localizedField,
        publishedTypeForEntry: stubs.publishedType
      };

      compileElement = function () {
        element = $compile('<div class="cf-link-editor-search"></div>')(scope);
        scope.$digest();
        searchField = element.find('.search-with-results');
      };
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

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
      expect(newButton.text()).toMatch('Herp');
      expect(newButton.text()).toMatch('Derp');
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
      scope.entityType = 'Asset';
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

  describe('for asset links', function () {
    beforeEach(function () {
      scope.otEditable = true;
      scope.linkedEntities = [];
      scope.entities = [];
      scope.entityType = 'Asset';
      compileElement();
    });

    it('shows cf-link-editor-search', function () {
      expect(element.find('.controls')).not.toBeNgHidden();
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
      expect(element.find('.controls')).not.toBeNgHidden();
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

    });
  });

});
