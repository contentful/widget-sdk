import * as DOM from 'helpers/DOM';
import attachContextMenuHandler from 'ui/ContextMenuHandler';

describe('app/UiExtensions', function () {

  beforeEach(function () {
    module('contentful/test');

    const Template = this.$inject('app/UiExtensions/Template').default;
    const Controller = this.$inject('app/UiExtensions/Controller').default;

    this.spaceContext = this.$inject('spaceContext');
    this.spaceContext.cma = {deleteExtension: sinon.stub()};

    this.widgets = this.$inject('widgets');
    this.widgets.getCustom = sinon.stub();
    this.widgets.refresh = sinon.stub().resolves();

    this.notification = this.$inject('notification');
    this.notification.info = sinon.stub();
    this.notification.error = sinon.stub();

    this.detachContextMenuHandler = attachContextMenuHandler(this.$inject('$document'));


    this.init = function () {
      this.container = DOM.createView($('<div class=client>').get(0));
      $(this.container.element).appendTo('body');

      this.$compileWith(Template(), ($scope) => {
        Controller($scope);
      }).appendTo(this.container.element);

      this.$flush();
    };

    this.delete = function (id) {
      this.container.find(`extensions.delete.${id}`).click();
      this.$flush();
      this.container.find(`extensions.deleteConfirm.${id}`).click();
      this.$flush();
    };
  });

  describe('custom extensions exist', function () {
    beforeEach(function () {
      this.widgets.getCustom.returns({
        'test': {id: 'test', name: 'Widget 1'},
        'test2': {id: 'test2', name: 'Widget 2'}
      });
    });

    it('lists extensions', function () {
      this.init();
      const list = this.container.find('extensions.list');
      list.assertHasText('Widget 1');
      list.assertHasText('Widget 2');
    });

    describe('delete extension', function () {
      describe('delete success', function () {
        beforeEach(function () {
          this.spaceContext.cma.deleteExtension.resolves({});
          this.init();
          this.delete('test2');
        });

        it('shows notification', function () {
          sinon.assert.calledWith(this.notification.info, 'Extension successfully deleted');
        });

        it('refetches widget list', function () {
          sinon.assert.calledTwice(this.widgets.getCustom);
        });
      });

      describe('delete fail', function () {
        it('shows error notification', function () {
          this.spaceContext.cma.deleteExtension.rejects({});
          this.init();
          this.delete('test2');
          sinon.assert.calledWith(this.notification.error, 'Error deleting extension');
        });
      });
    });
  });

  describe('no custom widgets', function () {
    it('shows empty message', function () {
      this.widgets.getCustom.returns({});
      this.init();
      expect(this.container.find('extensions.empty').element).toBeTruthy();
    });
  });

  afterEach(function () {
    $(this.container.element).remove();
    this.detachContextMenuHandler();
  });
});
