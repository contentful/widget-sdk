import * as DOM from 'helpers/DOM';
import attachContextMenuHandler from 'ui/ContextMenuHandler';

describe('app/Extensions', function () {
  beforeEach(function () {
    module('contentful/test');

    const Extensions = this.$inject('app/Extensions/Extensions').default;
    this.$inject('$state').href = () => 'href';

    this.spaceContext = this.$inject('mocks/spaceContext').init();
    this.spaceContext.cma = {deleteExtension: sinon.stub()};
    this.spaceContext.widgets = {getAll: sinon.stub(), refresh: sinon.stub().resolves([])};

    this.notification = this.$inject('notification');
    this.notification.info = sinon.stub();
    this.notification.error = sinon.stub();

    this.detachContextMenuHandler = attachContextMenuHandler(this.$inject('$document'));

    this.init = function () {
      const $el = this.$compileWith('<cf-component-bridge component="component" />', ($scope) => {
        $scope.context = {};
        Extensions($scope);
      });
      $el.appendTo('body');
      this.container = DOM.createView($el.get(0));
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
      const params = {parameters: [], installationParameters: {definitions: [], values: {}}};
      this.spaceContext.widgets.getAll.returns([
        {id: 'builtin', name: 'Builtin', fieldTypes: ['Boolean']},
        {custom: true, id: 'test', name: 'Widget 1', fieldTypes: ['Number'], ...params},
        {custom: true, id: 'test2', name: 'Widget 2', fieldTypes: ['Symbol', 'Text'], ...params}
      ]);
    });

    it('lists extensions', function () {
      this.init();
      const list = this.container.find('extensions.list');
      const words = ['Widget 1', 'Widget 2', 'Number', 'Symbol, Text'];
      words.forEach(word => {
        list.assertHasText(word);
      });
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

        it('refreshes widget list', function () {
          // (1) initial refresh (2) refresh after deletion
          sinon.assert.calledTwice(this.spaceContext.widgets.refresh);
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
      this.spaceContext.widgets.getAll.returns([]);
      this.init();
      this.container.find('extensions.empty').assertIsVisible();
    });
  });

  afterEach(function () {
    $(this.container.element).remove();
    this.detachContextMenuHandler();
  });
});
