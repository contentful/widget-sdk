'use strict';

describe('cfFileEditor Directive', function () {
  var element, scope, stubs;
  var $q;

  beforeEach(function () {
    module('contentful/test', function ($provide) {

      stubs = $provide.makeStubs([
        'pick', 'then', 'serverError', 'parseFPFile'
      ]);
      $provide.removeControllers('NgModelCtrl');
      $provide.stubDirective('otPath', {
        controller: _.noop
      });
      $provide.stubDirective('otBindObjectValue', {
        controller: function ($scope) {
          $scope.otBindObjectValueCommit = sinon.stub().returns($q.resolve());
        }
      });
      $provide.removeDirectives('cfFileDrop');
      $provide.value('filepicker', {
        pick: stubs.pick,
        parseFPFile: stubs.parseFPFile
      });
      $provide.value('notification', {
        serverError: stubs.serverError
      });
      stubs.pick.returns({then: stubs.then});
    });

    var $rootScope = this.$inject('$rootScope');
    var $compile = this.$inject('$compile');
    $q = this.$inject('$q');

    scope = $rootScope.$new();
    scope.otDoc = {doc: {}, state: {}};
    scope.isEditable = _.constant(true);
    scope.fieldData = {
      fileName: 'file.jpg',
      fileType: 'image/jpeg'
    };

    element = $compile('<div ot-path=""><div cf-file-editor cf-file-display ng-model="fieldData" ot-bind-object-value="file"></div></div>')(scope);
    scope.$apply();
  });

  it('toggles meta info', function() {
    scope.toggleMeta();
    expect(scope.showMeta).toBeTruthy();
  });

  describe('uploading a file succeeds', function() {
    var file;
    beforeEach(function() {
      file = {
        url: 'newurl',
        filename: 'newfilename',
        mimetype: 'newmimetype'
      };
      stubs.then.callsArgWith(0, file);
      stubs.parseFPFile.returns({
        upload: 'newurl',
        fileName: 'newfilename',
        contentType: 'newmimetype'
      });
    });

    describe('and updating the otDoc value succeeds', function() {
      beforeEach(function() {
        this.emitStub = sinon.stub(scope, '$emit');
        scope.uploadFile();
        scope.$apply();
      });

      it('calls filepickers pick', function() {
        sinon.assert.called(stubs.pick);
      });

      it('calls otBindObjectValueCommit', function() {
        sinon.assert.called(scope.otBindObjectValueCommit);
      });

      it('file object is parsed', function() {
        sinon.assert.calledWith(stubs.parseFPFile, file);
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
        sinon.assert.calledWith(this.emitStub, 'fileUploaded', {
          upload: 'newurl',
          fileName: 'newfilename',
          contentType: 'newmimetype'
        }, scope.locale);
      });

    });
  });

  describe('uploading a file fails because validation', function() {
    beforeEach(function() {
      scope.validate = sinon.spy();
      stubs.then.callsArgWith(1, {code: 101});
    });

    it('does not throw on call', function() {
      expect(scope.uploadFile).not.toThrow();
    });

    it('validate gets called', function() {
      scope.uploadFile();
      sinon.assert.called(scope.validate);
    });
  });

  describe('uploading a file fails because reasons', function() {
    beforeEach(function() {
      scope.validate = sinon.spy();
      stubs.then.callsArgWith(1, {code: 500});
    });

    it('throws on call', function() {
      expect(scope.uploadFile).toThrow();
    });

    it('validate does not get called', function() {
      sinon.assert.notCalled(scope.validate);
    });
  });

  describe('deleting a file succeeds', function() {
    beforeEach(function() {
      this.emitStub = sinon.stub(scope, '$emit');
      scope.validate = sinon.spy();
      stubs.parseFPFile.withArgs(null).returns(null);
    });

    describe('and updating the otDoc value succeeds', function() {
      beforeEach(function() {
        scope.deleteFile();
        scope.$apply();
      });

      it('calls `parseFPFile()` with null and sets the file to null', function () {
        sinon.assert.calledWith(stubs.parseFPFile, null);
        expect(scope.file).toBe(null);
      });

      it('does not emit `fileUploaded`', function () {
        sinon.assert.notCalled(this.emitStub);
      });

      it('validates scope', function() {
        sinon.assert.called(scope.validate);
      });

      it('calls otBindObjectValueCommit', function() {
        sinon.assert.called(scope.otBindObjectValueCommit);
      });

      it('file is null', function() {
        expect(scope.file).toBeFalsy();
      });
    });
  });

  describe('uploading a file via drop succeeds', function() {
    describe('and updating the otDoc value succeeds', function() {
      beforeEach(function() {
        stubs.parseFPFile.returns({
          upload: 'newurl',
          fileName: 'newfilename',
          contentType: 'newmimetype'
        });
        scope.$broadcast('cfFileDropped', {
          url: 'newurl',
          filename: 'newfilename',
          mimetype: 'newmimetype'
        });
      });

      it('calls otBindObjectValueCommit', function() {
        sinon.assert.called(scope.otBindObjectValueCommit);
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
  });


});
