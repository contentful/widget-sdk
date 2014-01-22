'use strict';

describe('cfFileInfo Directive', function () {
  var element, scope, parentScope;
  var stubs;
  var compileElement;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'canPublish'
      ]);
      $provide.removeDirectives('cfFileDrop');
    });

    inject(function ($compile, $rootScope) {
      parentScope = $rootScope.$new();

      parentScope.fileData = null;
      parentScope.someTitle = null;
      parentScope.entity = {
        canPublish: stubs.canPublish
      };

      compileElement = function () {
        element = $compile('<div class="cf-file-info" file="fileData" entity-title="someTitle">')(parentScope);
        parentScope.$digest();
        scope = element.scope();
      };
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

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
        expect(element.find('.file-preview .vcenter')).toBeNgHidden();
      });

      it('unpublished marker', function() {
        expect(element.find('.file-preview .unpublished')).toBeNgHidden();
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
      expect(element.find('.go-to-asset')).not.toBeNgHidden();
    });

    it('metadata button is hidden', function() {
      expect(element.find('.show-metadata')).toBeNgHidden();
    });

    it('delete button is hidden', function() {
      expect(element.find('.delete-file')).toBeNgHidden();
    });

    it('remove link button is hidden', function() {
      expect(element.find('.remove-link')).toBeNgHidden();
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
        expect(element.find('.go-to-asset')).toBeNgHidden();
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


  describe('file exists', function() {
    beforeEach(function() {
      parentScope.fileData = {
        fileName: 'file.jpg',
        fileType: 'image/jpeg',
        url: 'http://url'
      };

      stubs.canPublish.returns(true);
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
      expect(element.find('.file-progress')).toBeNgHidden();
    });

    it('file is not processing', function() {
      scope.file.upload = 'http://uploadurl';
      scope.$digest();
      expect(element.find('.file-progress')).not.toBeNgHidden();
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
      expect(element.find('.download-file')).not.toBeNgHidden();
    });

    it('download button is hidden', function() {
      delete scope.file.url;
      scope.$digest();
      expect(element.find('.download-file')).toBeNgHidden();
    });

    it('metadata button is shown', function() {
      expect(element.find('.show-metadata')).not.toBeNgHidden();
    });

    it('delete button is shown', function() {
      scope.deleteFile = function () {};
      scope.$digest();
      expect(element.find('.delete-file')).not.toBeNgHidden();
    });

    it('remove link button is shown', function() {
      scope.removeLink = function () {};
      scope.$digest();
      expect(element.find('.remove-link')).not.toBeNgHidden();
    });


  });

});
