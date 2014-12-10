'use strict';

describe('The ContentType editor directive', function () {

  var container, scope;
  var compileElement;

  beforeEach(function () {
    module('contentful/test', function ($provide, $controllerProvider) {
      $provide.value('ShareJS', {
        connection: {},
        peek: sinon.stub(),
        mkpath: sinon.stub()
      });
      $provide.removeDirectives('otDocFor', 'otDocPresence', 'otSubdoc', 'otBindText', 'otPath', 'saveStatus', 'contentTypeFieldList');
      $provide.removeControllers('PermissionController');
      var controllerMock = angular.noop;
      controllerMock.prototype.canPublish = sinon.stub();
      $controllerProvider.register('ContentTypeEditorController', controllerMock);
    });

    inject(function ($rootScope, $compile) {
      scope = $rootScope.$new();

      scope.otEditable = true;

      scope.permissionController = {
        createContentType: {
          shouldHide: false,
          shouldDisable: false
        }
      };

      compileElement = function () {
        container = $('<div class="content-type-editor"></div>');
        $compile(container)(scope);
        scope.$digest();
      };
    });
  });

  afterEach(inject(function ($log) {
    container.remove();
    $log.assertEmpty();
  }));

  describe('when otEditable is false', function () {
    beforeEach(function () {
      scope.otEditable = false;
      compileElement();
    });

    it('Create Field button should be disabled', function () {
      expect(container.find('.advice button').is(':disabled')).toBe(true);
    });

    it('Add Field button should be disabled', function () {
      expect(container.find('.advice button').is(':disabled')).toBe(true);
    });
  });

  it('textarea is enabled', function () {
    scope.otEditable = true;
    compileElement();
    expect(container.find('.l-form-row').eq(1).find('textarea').attr('disabled')).toBeFalsy();
  });

  it('textarea is enabled', function () {
    scope.otEditable = false;
    compileElement();
    expect(container.find('.l-form-row').eq(1).find('textarea').attr('disabled')).toBeTruthy();
  });

  describe('if fields exist', function () {
    beforeEach(function () {
      scope.hasFields = true;
      compileElement();
    });

    it('field list is shown', function () {
      expect(container.find('.content-type-field-list')).not.toBeNgHidden();
    });

    it('advice is not shown', function () {
      expect(container.find('.advice')).toBeNgHidden();
    });

    it('fields dropdown is shown', function () {
      expect(container.find('.form-controls > .dropdown-btn')).not.toBeNgHidden();
    });
  });

  describe('if no fields exist', function () {
    beforeEach(function () {
      scope.hasFields = false;
      compileElement();
    });

    it('field list is not shown', function () {
      expect(container.find('.content-type-field-list')).toBeNgHidden();
    });

    it('advice is shown', function () {
      expect(container.find('.advice')).not.toBeNgHidden();
    });

    it('fields dropdown is not shown', function () {
      expect(container.find('.l-form-controls > .dropdown-btn')).toBeNgHidden();
    });
  });


});
