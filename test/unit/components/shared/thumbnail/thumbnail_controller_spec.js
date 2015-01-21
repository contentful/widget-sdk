'use strict';

ddescribe('Thumbnail Controller', function () {
  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.constant('mimetype', {
        hasPreview: sinon.stub(),
        getGroupLabel: sinon.stub()
      });
    });
    inject(function ($injector) {
      var $rootScope = $injector.get('$rootScope');
      var $controller = $injector.get('$controller');
      this.mimetype = $injector.get('mimetype');
      this.scope = $rootScope.$new();

      this.controller = $controller('ThumbnailController', {
        $scope: this.scope,
      });
      this.scope.$digest();

      this.childScope = this.scope.$new();
    });
  });

  it('image is not loaded by default', function() {
    expect(this.scope.imageHasLoaded).toBe(false);
  });

  it('image is not loaded if a file does not exist', function() {
    this.scope.file = null;
    this.scope.$digest();
    expect(this.scope.imageHasLoaded).toBe(false);
  });

  describe('with no file', function() {
    it('image is not loaded if an imageLoaded event is emitted', function() {
      this.childScope.$emit('imageLoaded');
      expect(this.scope.imageHasLoaded).toBe(false);
    });

    it('image is not loaded if an imageUnloaded event is emitted', function() {
      this.childScope.$emit('imageUnloaded');
      expect(this.scope.imageHasLoaded).toBe(false);
    });

    it('image has no preview', function() {
      this.mimetype.hasPreview.returns(true);
      expect(this.scope.hasPreview()).toBe(false);
    });

    it('file is not loading', function() {
      expect(this.scope.isFileLoading()).toBe(false);
    });

    it('file is not previewable', function() {
      expect(this.scope.isFileLoading()).toBe(false);
    });
  });

  describe('with a file', function() {
    beforeEach(function() {
      this.scope.file = {};
    });

    it('image is loaded if an event is emitted', function() {
      this.childScope.$emit('imageLoaded');
      expect(this.scope.imageHasLoaded).toBe(true);
    });

    it('image is not loaded if an imageUnloaded event is emitted', function() {
      this.childScope.$emit('imageUnloaded');
      expect(this.scope.imageHasLoaded).toBe(false);
    });

    describe('with a preview', function() {
      beforeEach(function() {
        this.mimetype.hasPreview.returns(true);
      });

      it('image has preview', function() {
        expect(this.scope.hasPreview()).toBe(true);
      });

      it('file is loading', function() {
        expect(this.scope.isFileLoading()).toBe(true);
      });

      it('file is not loading', function() {
        this.scope.imageHasLoaded = true;
        expect(this.scope.isFileLoading()).toBe(false);
      });

      it('file is not previewable', function() {
        expect(this.scope.isFilePreviewable()).toBe(false);
      });

      it('file is previewable', function() {
        this.scope.imageHasLoaded = true;
        expect(this.scope.isFilePreviewable()).toBe(true);
      });

    });

    describe('with no preview', function() {
      beforeEach(function() {
        this.mimetype.hasPreview.returns(false);
      });

      it('image has no preview', function() {
        expect(this.scope.hasPreview()).toBe(false);
      });

      it('file is previewable (because it has an icon instead)', function() {
        expect(this.scope.isFilePreviewable()).toBe(true);
      });
    });

    it('gets an icon name', function() {
      this.mimetype.getGroupLabel.returns('richtext');
      expect(this.scope.getIconName()).toBe('fa fa-file-word-o');
    });

  });

});
