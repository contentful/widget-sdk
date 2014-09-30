'use strict';

describe('cfLinkEditorSearch Directive', function () {
  var element, scope, stubs, compileElement;

  function ControllerMock() {
  }

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'can'
      ]);

      $provide.removeDirectives('cfTokenizedSearch');
    });

    inject(function ($compile, $rootScope, cfLinkEditorSearchDirective) {
      cfLinkEditorSearchDirective[0].controller = ControllerMock;
      scope = $rootScope.$new();
      compileElement = function () {
        element = $compile('<div class="cf-link-editor-search"></div>')(scope);
        scope.$digest();
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

});
