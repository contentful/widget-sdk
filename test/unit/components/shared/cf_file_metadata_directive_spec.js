'use strict';

describe('cfFileMetadata Directive', function () {
  var element, scope, parentScope;
  var compileElement;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeDirectives('cfFileDrop', 'cfThumbnail');
      $provide.removeControllers('ThumbnailController');
    });

    inject(function ($compile, $rootScope) {
      parentScope = $rootScope.$new();
      parentScope.otDoc = {doc: {}, state: {}};
      parentScope.isEditable = _.constant(true);

      parentScope.fileData = null;
      parentScope.someTitle = null;
      parentScope.entity = {
        canPublish: sinon.stub()
      };

      parentScope.isFileLoading = sinon.stub();
      parentScope.hasPreview = sinon.stub();

      compileElement = function () {
        element = $compile('<div cf-file-display cf-file-metadata file="fileData" entity-title="someTitle">')(parentScope);
        parentScope.$digest();
        scope = element.scope();
      };
    });
  });

  describe('default state with no attrs set', function() {
    beforeEach(function() {
      compileElement();
    });

    it('file is not defined', function() {
      expect(scope.file).toBeUndefined();
    });

    it('title is not defined', function() {
      expect(scope.title).toBeUndefined();
    });

    it('toggles meta info', function() {
      scope.toggleMeta();
      expect(scope.showMeta).toBeTruthy();
    });

    describe('file preview is hidden', function() {
      it('main container', function() {
        expect(element.find('.file-preview')).toBeNgHidden();
      });

      it('inner container', function() {
        expect(element.find('.file-preview .vcenter')[0]).toBeUndefined();
      });
    });

    it('title overlay is shown', function() {
      expect(element.find('.title-overlay')).not.toBeNgHidden();
    });

    it('message warning of no file is shown', function() {
      expect(element.find('.no-file').eq(0)).not.toBeNgHidden();
    });

    it('message warning of missing asset is hidden', function() {
      expect(element.find('.no-file').eq(1)).toBeNgHidden();
    });

    it('go to asset button is shown hidden', function() {
      expect(element.find('[aria-label="Open Asset"]')).not.toBeNgHidden();
    });

    it('metadata button is hidden', function() {
      expect(element.find('[aria-label="Show file information"]')).toBeNgHidden();
    });

    it('delete button is hidden', function() {
      expect(element.find('[aria-label="Delete file"]')).toBeNgHidden();
    });

    it('remove link button is hidden', function() {
      expect(element.find('[aria-label="Remove Asset"]')).toBeNgHidden();
    });

    it('upload button is hidden', function() {
      expect(element.find('.cf-file-drop')).toBeNgHidden();
    });

    describe('if entity is missing', function() {
      beforeEach(function() {
        scope.entity.isMissing = true;
        scope.$digest();
      });

      it('message warning of missing asset is shown', function() {
        expect(element.find('.no-file').eq(1)).not.toBeNgHidden();
      });

      it('go to asset button is hidden', function() {
        expect(element.find('[aria-label="Open Asset"]')).toBeNgHidden();
      });
    });
  });

  describe('upload mode', function() {
    beforeEach(function() {
      parentScope.enableUpload = true;
      compileElement();
    });

    it('file preview is hidden main container', function() {
      expect(element.find('.file-preview')).toBeNgHidden();
    });

    it('title overlay is hidden', function() {
      expect(element.find('.title-overlay')).toBeNgHidden();
    });

    it('message warning of no file is hidden', function() {
      expect(element.find('.no-file').eq(0)).toBeNgHidden();
    });

    it('message warning of missing asset is hidden', function() {
      expect(element.find('.no-file').eq(1)).toBeNgHidden();
    });

    it('upload button is shown', function() {
      expect(element.find('.cf-file-drop')).not.toBeNgHidden();
    });
  });

  describe('file exists and is processing', function() {
    beforeEach(function() {
      parentScope.fileData = {
        fileName: 'file.jpg',
        fileType: 'image/jpeg',
        upload: 'http://url'
      };

      parentScope.isFileLoading.returns(false);
      compileElement();
    });

    it('container', function() {
      expect(element.find('.file-progress').eq(1)).not.toBeNgHidden();
    });

    it('delete button is shown', function() {
      scope.deleteFile = function () {};
      scope.$digest();
      expect(element.find('[aria-label="Delete file"]')).not.toBeNgHidden();
    });
  });

  describe('file exists and is loading', function() {
    beforeEach(function() {
      parentScope.fileData = {
        fileName: 'file.jpg',
        fileType: 'image/jpeg',
        url: 'http://url'
      };

      parentScope.isFileLoading.returns(true);
      compileElement();
    });

    it('container', function() {
      expect(element.find('.file-progress').eq(0)).not.toBeNgHidden();
    });
  });

  describe('file exists and is visible', function() {
    beforeEach(function() {
      parentScope.fileData = {
        fileName: 'file.jpg',
        fileType: 'image/jpeg',
        url: 'http://url'
      };

      parentScope.entity.canPublish.returns(true);
      compileElement();
    });

    it('file is defined', function() {
      expect(scope.file).toBeDefined();
    });

    it('title is defined', function() {
      expect(scope.file).toBeDefined();
    });

    describe('file preview is not hidden', function() {
      it('main container', function() {
        expect(element.find('.file-preview')).not.toBeNgHidden();
      });

      it('inner container', function() {
        expect(element.find('.file-preview .vcenter')).not.toBeNgHidden();
      });

      it('unpublished marker', function() {
        expect(element.find('.file-preview .unpublished')).not.toBeNgHidden();
      });
    });

    it('file is not processing', function() {
      expect(element.find('.file-progress').eq(1)).toBeNgHidden();
    });

    it('file is not processing', function() {
      scope.file.upload = 'http://uploadurl';
      scope.$digest();
      expect(element.find('.file-progress').eq(1)).not.toBeNgHidden();
    });

    it('hides meta info', function() {
      expect(element.find('.file-metadata')).toBeNgHidden();
    });

    it('shows meta info', function() {
      scope.toggleMeta();
      scope.$digest();
      expect(element.find('.file-metadata')).not.toBeNgHidden();
    });

    it('title overlay is hidden', function() {
      expect(element.find('.title-overlay')).toBeNgHidden();
    });

    it('message warning of no file is hidden', function() {
      expect(element.find('.no-file').eq(0)).toBeNgHidden();
    });

    it('message warning of missing asset is hidden', function() {
      expect(element.find('.no-file').eq(1)).toBeNgHidden();
    });

    it('message warning of missing asset is shown', function() {
      scope.entity.isMissing = true;
      scope.$digest();
      expect(element.find('.no-file').eq(1)).not.toBeNgHidden();
    });

    it('download button is shown', function() {
      expect(element.find('[aria-label="Download file"]')).not.toBeNgHidden();
    });

    it('download button is hidden', function() {
      delete scope.file.url;
      scope.$digest();
      expect(element.find('[aria-label="Download file"]')).toBeNgHidden();
    });

    it('metadata button is shown', function() {
      expect(element.find('[aria-label="Show file information"]')).not.toBeNgHidden();
    });

    it('delete button is shown', function() {
      scope.deleteFile = function () {};
      scope.$digest();
      expect(element.find('[aria-label="Delete file"]')).not.toBeNgHidden();
    });

    it('remove link button is shown', function() {
      scope.removeLink = function () {};
      scope.$digest();
      expect(element.find('[aria-label="Remove Asset"]')).not.toBeNgHidden();
    });


  });

});
