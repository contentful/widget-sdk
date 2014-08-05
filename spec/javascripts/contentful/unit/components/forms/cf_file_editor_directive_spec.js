'use strict';

describe('cfFileEditor Directive', function () {
  var element, scope;
  var stubs;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'pick', 'then', 'serverError'
      ]);
      $provide.stubDirective('otPath', {
        controller: function () {}
      });
      $provide.removeDirectives('cfFileDrop');
      $provide.value('filepicker', {
        pick: stubs.pick
      });
      $provide.value('notification', {
        serverError: stubs.serverError
      });
      stubs.pick.returns({then: stubs.then});
    });

    inject(function ($compile, $rootScope, cfFileEditorDirective) {
      scope = $rootScope.$new();
      cfFileEditorDirective[0].controller = function () {};

      scope.fieldData = {
        fileName: 'file.jpg',
        fileType: 'image/jpeg'
      };

      element = $compile('<div ot-path=""><div class="cf-file-editor" ng-model="fieldData"></div></div>')(scope);
      scope.$digest();
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  it('file is defined', function() {
    expect(scope.file).toBeDefined();
  });

  it('toggles meta info', function() {
    scope.toggleMeta();
    expect(scope.showMeta).toBeTruthy();
  });

  describe('uploading a file succeeds', function() {
    beforeEach(function() {
      stubs.then.callsArgWith(0, {
        url: 'newurl',
        filename: 'newfilename',
        mimetype: 'newmimetype'
      });
      scope.otChangeValue = sinon.stub();
    });

    describe('and updating the otDoc value succeeds', function() {
      beforeEach(function() {
        scope.uploadFile();
        sinon.stub(scope, '$emit');
        scope.otChangeValue.yield(null);
      });

      it('calls filepickers pick', function() {
        expect(stubs.pick).toBeCalled();
      });

      it('calls otchangevalue', function() {
        expect(scope.otChangeValue).toBeCalled();
      });

      it('file now has url', function() {
        expect(scope.file.upload).toEqual('newurl');
      });

      it('file now has new name', function() {
        expect(scope.file.fileName).toEqual('newfilename');
      });

      it('file now has new mimetype', function() {
        expect(scope.file.contentType).toEqual('newmimetype');
      });

      it('emits fileUploaded event', function() {
        expect(scope.$emit).toBeCalledWith('fileUploaded');
        expect(scope.$emit.args[0][1]).toEqual({
          upload: 'newurl',
          fileName: 'newfilename',
          contentType: 'newmimetype'
        });
        expect(scope.$emit.args[0][2]).toEqual(scope.locale);
      });
    });

    describe('and updating the otDoc value fails', function() {
      beforeEach(function() {
        scope.otChangeValue.callsArgWith(1, {});
        scope.uploadFile();
      });

      it('calls filepickers pick', function() {
        expect(stubs.pick).toBeCalled();
      });

      it('calls otchangevalue', function() {
        expect(scope.otChangeValue).toBeCalled();
      });

      it('calls error notification', function() {
        expect(stubs.serverError).toBeCalled();
      });
    });
  });

  describe('uploading a file fails because validation', function() {
    beforeEach(function() {
      scope.validate = sinon.stub();
      stubs.then.callsArgWith(1, {code: 101});
    });

    it('does not throw on call', function() {
      expect(scope.uploadFile).not.toThrow();
    });

    it('validate gets called', function() {
      scope.uploadFile();
      expect(scope.validate).toBeCalled();
    });
  });

  describe('uploading a file fails because reasons', function() {
    beforeEach(function() {
      scope.validate = sinon.stub();
      stubs.then.callsArgWith(1, {code: 500});
    });

    it('throws on call', function() {
      expect(scope.uploadFile).toThrow();
    });

    it('validate does not get called', function() {
      expect(scope.validate).not.toBeCalled();
    });
  });

  describe('deleting a file succeeds', function() {
    beforeEach(function() {
      scope.validate = sinon.stub();
      scope.otChangeValue = sinon.stub();
    });

    describe('and updating the otDoc value succeeds', function() {
      beforeEach(function() {
        scope.otChangeValue.callsArgWith(1, null);
        scope.deleteFile();
      });

      it('validates scope', function() {
        expect(scope.validate).toBeCalled();
      });

      it('calls otchangevalue', function() {
        expect(scope.otChangeValue).toBeCalled();
      });

      it('file is null', function() {
        expect(scope.file).toBeNull();
      });
    });

    describe('and updating the otDoc value fails', function() {
      beforeEach(function() {
        scope.otChangeValue.callsArgWith(1, {});
        scope.deleteFile();
      });

      it('calls otchangevalue', function() {
        expect(scope.otChangeValue).toBeCalled();
      });

      it('calls error notification', function() {
        expect(stubs.serverError).toBeCalled();
      });
    });
  });

  describe('uploading a file via drop succeeds', function() {
    beforeEach(function() {
      scope.otChangeValue = sinon.stub();
    });

    describe('and updating the otDoc value succeeds', function() {
      beforeEach(function() {
        scope.otChangeValue.callsArgWith(1, null);
        scope.$broadcast('cfFileDropped', {
          url: 'newurl',
          filename: 'newfilename',
          mimetype: 'newmimetype'
        });
      });

      it('calls otchangevalue', function() {
        expect(scope.otChangeValue).toBeCalled();
      });

      it('file now has url', function() {
        expect(scope.file.upload).toEqual('newurl');
      });

      it('file now has new name', function() {
        expect(scope.file.fileName).toEqual('newfilename');
      });

      it('file now has new mimetype', function() {
        expect(scope.file.contentType).toEqual('newmimetype');
      });
    });

    describe('and updating the otDoc value fails', function() {
      beforeEach(function() {
        scope.otChangeValue.callsArgWith(1, {});
        scope.$broadcast('cfFileDropped', {
          url: 'newurl',
          filename: 'newfilename',
          mimetype: 'newmimetype'
        });
      });

      it('calls otchangevalue', function() {
        expect(scope.otChangeValue).toBeCalled();
      });

      it('calls error notification', function() {
        expect(stubs.serverError).toBeCalled();
      });
    });
  });


});
