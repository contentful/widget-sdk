import * as DOM from 'helpers/DOM';
import attachContextMenuHandler from 'ui/ContextMenuHandler';

describe('app/Extensions', () => {
  beforeEach(function () {
    module('contentful/test', $provide => {
      $provide.value('$state', {
        href: () => 'href',
        go: sinon.stub()
      });
    });

    const Extensions = this.$inject('app/Extensions/Extensions').default;

    this.spaceContext = this.$inject('mocks/spaceContext').init();
    this.spaceContext.cma = {
      createExtension: sinon.stub(),
      deleteExtension: sinon.stub()
    };
    this.spaceContext.widgets = {refresh: sinon.stub().resolves([])};

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
  });

  afterEach(function () {
    $(this.container.element).remove();
    this.detachContextMenuHandler();
  });

  describe('no custom widgets', () => {
    it('shows empty message', function () {
      this.spaceContext.widgets.refresh.resolves([]);
      this.init();
      this.container.find('extensions.empty').assertIsVisible();
    });
  });

  describe('custom extensions exist', () => {
    beforeEach(function () {
      const params = {
        parameters: [],
        installationParameters: {definitions: [], values: {}}
      };

      this.spaceContext.widgets.refresh.resolves([
        {
          id: 'builtin',
          name: 'Builtin',
          fieldTypes: ['Boolean']
        },
        {
          custom: true,
          src: 'http://localhost',
          id: 'test',
          name: 'Widget 1',
          fieldTypes: ['Number'],
          ...params
        },
        {
          custom: true,
          srcdoc: '<!doctype html',
          id: 'test2',
          name: 'Widget 2',
          fieldTypes: ['Symbol', 'Text'],
          ...params
        }
      ]);
    });

    it('lists extensions', function () {
      this.init();
      const list = this.container.find('extensions.list');

      [
        'Widget 1', 'Widget 2',
        'Number', 'Symbol, Text',
        'self-hosted', 'Contentful',
        '0 definition', '0 value'
      ].forEach(word => list.assertHasText(word));
    });

    it('navigates to single extension', function () {
      this.init();
      // click the first "Edit" link
      this.container.find('extensions.list').element.querySelector('a').click();
      sinon.assert.calledWith(this.$inject('$state').go, '.detail', {extensionId: 'test'});
    });

    describe('delete extension', () => {
      beforeEach(function () {
        this.delete = function (id) {
          this.container.find(`extensions.delete.${id}`).click();
          this.$flush();
          this.container.find(`extensions.deleteConfirm.${id}`).click();
          this.$flush();
        };
      });

      it('deletes an extension', function () {
        this.spaceContext.cma.deleteExtension.resolves({});
        this.init();
        this.delete('test2');
        sinon.assert.calledWith(this.notification.info, 'Your extension was successfully deleted.');
        // (1) initial refresh (2) refresh after deletion
        sinon.assert.calledTwice(this.spaceContext.widgets.refresh);
      });

      it('handles failure', function () {
        this.spaceContext.cma.deleteExtension.rejects({});
        this.init();
        this.delete('test2');
        sinon.assert.calledWith(this.notification.error, 'There was an error while deleting your extension.');
      });
    });
  });

  describe('create extension', () => {
    beforeEach(function () {
      this.create = function () {
        this.container.find('extensions.add').click();
        this.$flush();
        this.container.find('extensions.add.new').click();
        this.$flush();
      };
    });

    it('creates a new extension', function () {
      this.spaceContext.cma.createExtension.resolves({sys: {id: 'newly-created'}});
      this.init();
      this.create();

      sinon.assert.calledOnce(this.spaceContext.cma.createExtension);
      const {extension} = this.spaceContext.cma.createExtension.lastCall.args[0];
      expect(extension.name).toBe('New extension');
      expect(extension.fieldTypes).toEqual([{ type: 'Symbol' }]);
      expect(extension.srcdoc.includes('https://unpkg.com/contentful-ui-extensions-sdk@3')).toBe(true);

      sinon.assert.calledWith(this.$inject('$state').go, '.detail', {extensionId: 'newly-created'});
      sinon.assert.calledWith(this.notification.info, 'Your new extension was successfully created.');
    });

    it('handles failure', function () {
      this.spaceContext.cma.createExtension.rejects({});
      this.init();
      this.create();
      sinon.assert.calledWith(this.notification.error, 'There was an error while creating your extension.');
    });
  });
});
