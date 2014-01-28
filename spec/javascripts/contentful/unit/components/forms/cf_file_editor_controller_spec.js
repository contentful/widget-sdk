'use strict';

describe('cfFileEditorController', function () {
  var scope, stubs;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs(['fileUploaded', 'fileRemoved']);
    });
    inject(function ($rootScope, $controller) {
      scope = $rootScope.$new();
      scope.$on('fileUploaded', stubs.fileUploaded);
      scope.$on('fileRemoved', stubs.fileRemoved);

      $controller('CfFileEditorCtrl', {$scope: scope});
      scope.$digest();
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  it('fileUploaded not fired initially', function() {
    expect(stubs.fileUploaded).not.toBeCalled();
  });

  it('fileRemoved not fired initially', function() {
    expect(stubs.fileRemoved).not.toBeCalled();
  });

  describe('after setting otDoc', function() {
    beforeEach(function() {
      scope.otDoc = {};
      scope.$digest();
    });

    it('fileUploaded not fired', function() {
      expect(stubs.fileUploaded).not.toBeCalled();
    });

    it('fileRemoved not fired', function() {
      expect(stubs.fileRemoved).not.toBeCalled();
    });

    describe('sets a file object with no url (before processing)', function() {
      beforeEach(function() {
        scope.file = {};
        scope.$digest();
      });

      it('fileUploaded is fired', function() {
        expect(stubs.fileUploaded).toBeCalled();
      });

      it('fileRemoved not fired', function() {
        expect(stubs.fileRemoved).not.toBeCalled();
      });

      describe('removes file after being previously defined', function() {
        beforeEach(function() {
          scope.file = null;
          scope.$digest();
        });

        it('fileRemoved is fired', function() {
          expect(stubs.fileRemoved).toBeCalled();
        });
      });
    });

    describe('sets a file object with url (after processing)', function() {
      beforeEach(function() {
        scope.file = {url: 'http://upload'};
        scope.$digest();
      });

      it('fileUploaded not fired', function() {
        expect(stubs.fileUploaded).not.toBeCalled();
      });

      it('fileRemoved not fired', function() {
        expect(stubs.fileRemoved).not.toBeCalled();
      });
    });
  });


});
