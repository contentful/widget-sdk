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

  describe('create a dialog', function () {
    var dialog;
    beforeEach(function () {
      $('<div class="client"></div>').appendTo('body');
      dialog = modalDialog.open({
        scope: scope,
        message: 'dialog message'
      });
      dialog.promise.then(successStub)
                    .catch(errorStub);
      scope.$digest();
    });

    afterEach(function () {
      dialog.destroy();
      $('.client').remove();
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
        sinon.assert.called(cancelStub);
      });

      it('cancel is not called with html attr', function () {
        $(event.target).attr('no-background-close', true);
        dialog._closeOnBackground(event);
        sinon.assert.notCalled(cancelStub);
      });

      it('cancel is not called with params attr', function () {
        dialog.params.noBackgroundClose = true;
        dialog._closeOnBackground(event);
        sinon.assert.notCalled(cancelStub);
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
        event.target = {tagName: ''};
        dialog._handleKeys(event);
        dialog.scope.$digest();
        sinon.assert.called(cancelStub);
      });

      it('confirm is called with Enter key', function () {
        event.keyCode = 13;
        event.target = {tagName: ''};
        dialog._handleKeys(event);
        dialog.scope.$digest();
        sinon.assert.called(confirmStub);
      });

    });

    describe('with a scope', function() {
      beforeEach(function() {
        dialog.scope = {$apply: sinon.stub(), $destroy: sinon.stub()};
      });

      it('properly removes the global event listeners', function () {
        $(window).trigger('keyup');
        sinon.assert.called(dialog.scope.$apply);
        dialog.destroy();
        dialog.scope = {$apply: sinon.stub(), $destroy: sinon.stub()};
        $(window).trigger('keyup');
        sinon.assert.notCalled(dialog.scope.$apply);
      });

      it('confirms with values', function () {
        var result;
        dialog.confirm('foo');
        dialog.promise.then(function (value) { result = value; });
        scope.$apply();
        expect(result).toBe('foo');
      });

      it('cancels with values', function () {
        var result;
        dialog.cancel('bar');
        dialog.promise.catch(function (value) { result = value; });
        scope.$apply();
        expect(result).toBe('bar');
      });

      it('calls the success stub', function () {
        dialog.confirm().promise.finally(function () {
          sinon.assert.called(successStub);
        });
      });

      it('modal background exists', function () {
        expect($('.modal-background').length).toBe(1);
      });

      it('calls the success stub', function () {
        dialog.cancel().promise.finally(function () {
          sinon.assert.called(errorStub);
        });
      });

      it('dom element gets cleaned up', function () {
        dialog.confirm().promise.finally(function () {
          expect(dialog.domElement).toBeNull();
        });
      });
    });

  });

});
