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

      var contentTypePreview = sinon.stub();
      contentTypePreview.fromData = sinon.stub();
      $provide.value('contentTypePreview', contentTypePreview);
    });

    inject(function ($rootScope, $compile, $controller, contentTypePreview) {
      contentTypePreview.returns(this.reject());
      contentTypePreview.fromData.returns(this.reject());
      scope = $rootScope.$new();

      scope.permissionController = {
        createContentType: {
          shouldHide: false,
          shouldDisable: false
        }
      };

      scope.tabController = $controller('UiTabController');

      compileElement = function () {
        container = $('<div cf-content-type-editor></div>');
        $compile(container)(scope);
        scope.$digest();
      };
    });
  });

  afterEach(function () {
    container.remove();
  });

  describe('if fields exist', function () {
    beforeEach(function () {
      scope.hasFields = true;
      compileElement();
    });

    it('field list is shown', function () {
      expect(container.find('.content-type-fields')).not.toBeNgHidden();
    });

    it('empty field list is not shown', function () {
      expect(container.find('.content-type-no-fields')).toBeNgHidden();
    });
  });

  describe('if no fields exist', function () {
    beforeEach(function () {
      scope.hasFields = false;
      compileElement();
    });

    it('field list is not shown', function () {
      expect(container.find('.content-type-fields')).toBeNgHidden();
    });

    it('empty field list is shown', function () {
      expect(container.find('.content-type-no-fields')).not.toBeNgHidden();
    });
  });


});
