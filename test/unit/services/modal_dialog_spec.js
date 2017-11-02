import * as sinon from 'helpers/sinon';

describe('Modal dialog service', function () {
  let modalDialog, scope;
  let successStub, errorStub;
  beforeEach(function () {
    module('contentful/test');
    scope = this.$inject('$rootScope').$new();
    modalDialog = this.$inject('modalDialog');
    successStub = sinon.stub();
    errorStub = sinon.stub();
  });

  describe('create a dialog', function () {
    let dialog;
    beforeEach(function () {
      $('<div class="client"></div>').appendTo('body');
      dialog = modalDialog.open({
        scope: scope,
        message: 'dialog message',
        title: 'TITLE'
      });
      dialog.promise.then(successStub)
                    .catch(errorStub);
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
      expect(dialog.domElement.find('header h1').html()).toMatch('TITLE');
    });

    it('sets content', function () {
      expect(dialog.domElement.find('.modal-dialog__content').html()).toMatch(dialog.params.message);
    });

    describe('closes by clicking on background', function () {
      let event;
      let cancelStub;
      beforeEach(function () {
        event = {};
        event.target = $('.modal-background').get(0);
        cancelStub = sinon.stub(dialog, 'cancel');
      });

      it('cancel is called', function () {
        dialog._closeOnBackground(event);
        sinon.assert.called(cancelStub);
      });

      it('modal can be closed', function () {
        dialog._closeOnBackground(event);
        sinon.assert.called(cancelStub);
      });

      it('cancel is not called with params attr', function () {
        dialog.params.backgroundClose = false;
        dialog._closeOnBackground(event);
        sinon.assert.notCalled(cancelStub);
      });
    });

    describe('closes via keyboard shortcuts', function () {
      let event;
      let confirmStub, cancelStub;
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
        dialog.params.ignoreEnter = false;
        dialog._handleKeys(event);
        dialog.scope.$digest();
        sinon.assert.called(confirmStub);
      });
    });

    describe('with a scope', function () {
      beforeEach(function () {
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
        let result;
        dialog.confirm('foo');
        dialog.promise.then(function (value) { result = value; });
        scope.$apply();
        expect(result).toBe('foo');
      });

      it('cancels with values', function () {
        let result;
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

      it('calls the success stub', function* () {
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

  describe('#closeAll()', function () {
    beforeEach(function () {
      _.times(2, function () {
        modalDialog.open({
          message: 'test'
        }).promise
        .then(function () {})
        .catch(errorStub);
      });
    });

    it('closes all opened dialogs by default', function () {
      expect(modalDialog.getOpened().length).toBe(2);
      modalDialog.closeAll();
      scope.$apply();
      sinon.assert.calledTwice(errorStub);
      expect(modalDialog.getOpened().length).toBe(0);
    });

    it('does not close modals with `persistOnNavigation` =  true', function () {
      modalDialog.open({
        message: 'yo',
        persistOnNavigation: true
      }).promise
      .then(function () {})
      .catch(errorStub);

      expect(modalDialog.getOpened().length).toBe(3);
      modalDialog.closeAll();
      scope.$apply();
      sinon.assert.calledTwice(errorStub);
      expect(modalDialog.getOpened().length).toBe(1);
    });
  });
});
