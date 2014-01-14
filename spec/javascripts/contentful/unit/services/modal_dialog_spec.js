'use strict';

describe('Modal dialog service', function () {
  var modalDialog, scope;
  var successStub, errorStub;
  beforeEach(function () {
    module('contentful/test');
    inject(function ($rootScope, _modalDialog_) {
      scope = $rootScope.$new();
      modalDialog = _modalDialog_;
      successStub = sinon.stub();
      errorStub = sinon.stub();
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('create a dialog', function () {
    var dialog;
    beforeEach(function () {
      dialog = modalDialog.open({
        scope: scope,
        message: 'dialog message'
      });
      dialog.then(successStub)
            .catch(errorStub);
      scope.$digest();
    });

    afterEach(function () {
      dialog._cleanup();
    });

    it('creates a dialog', function () {
      expect(dialog).toBeDefined();
    });

    it('dom element property exists', function () {
      expect(dialog.domElement).toBeDefined();
    });

    it('dom element exists', function () {
      expect(dialog.domElement.get(0)).toBeDefined();
    });

    it('sets title', function () {
      expect(dialog.domElement.find('.title').html()).toMatch(dialog.params.title);
    });

    it('sets content', function () {
      expect(dialog.domElement.find('.dialog-content').html()).toMatch(dialog.params.message);
    });

    it('sets confirm label', function () {
      expect(dialog.domElement.find('.confirm').html()).toMatch(dialog.params.confirmLabel);
    });

    it('sets cancel label', function () {
      expect(dialog.domElement.find('.cancel').html()).toMatch(dialog.params.cancelLabel);
    });

    describe('if no cancel is defined', function () {
      beforeEach(function () {
        delete dialog.params.cancelLabel;
        delete dialog.cancelLabel;
        scope.$digest();
      });

      it('do not show cancel', function () {
        expect(dialog.domElement.find('.cancel')).toBeNgHidden();
      });
    });

    describe('closes by clicking on background', function () {
      var event;
      var cancelStub;
      beforeEach(function () {
        event = {};
        event.target = $('.modal-background').get(0);
        cancelStub = sinon.stub(dialog, 'cancel');
      });

      it('cancel is called', function () {
        dialog._closeOnBackground(event);
        expect(cancelStub.called).toBeTruthy();
      });

      it('cancel is not called with html attr', function () {
        $(event.target).attr('no-background-close', true);
        dialog._closeOnBackground(event);
        expect(cancelStub.called).toBeFalsy();
      });

      it('cancel is not called with params attr', function () {
        dialog.params.noBackgroundClose = true;
        dialog._closeOnBackground(event);
        expect(cancelStub.called).toBeFalsy();
      });
    });

    describe('closes via keyboard shortcuts', function () {
      var event;
      var confirmStub, cancelStub;
      beforeEach(function () {
        event = {};
        cancelStub = sinon.stub(dialog, 'cancel');
        confirmStub = sinon.stub(dialog, 'confirm');
      });

      it('cancel is called with ESC key', function () {
        event.keyCode = 27;
        dialog._handleKeys(event);
        dialog.scope.$digest();
        expect(cancelStub.called).toBeTruthy();
      });

      it('cancel is called with Enter key', function () {
        event.keyCode = 13;
        dialog._handleKeys(event);
        dialog.scope.$digest();
        expect(confirmStub.called).toBeTruthy();
      });
    });

    it('calls the success stub', function () {
      dialog.confirm().finally(function () {
        expect(successStub.called).toBeTruthy();
      });
    });

    it('modal background exists', function () {
      expect($('.modal-background').length).toBe(1);
    });

    it('calls the success stub', function () {
      dialog.cancel().finally(function () {
        expect(errorStub.called).toBeTruthy();
      });
    });

    it('dom element gets cleaned up', function () {
      dialog.confirm().finally(function () {
        expect(dialog.domElement).toBeNull();
      });
    });

  });

});
