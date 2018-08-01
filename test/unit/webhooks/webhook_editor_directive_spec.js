'use strict';

describe('Webhook Editor directive', () => {
  beforeEach(function () {
    this.go = sinon.stub();
    this.repo = {
      save: sinon.stub(),
      remove: sinon.stub(),
      logs: {getCalls: sinon.stub().resolves([])},
      hasValidBodyTransformation: () => true
    };

    module('contentful/test', ($provide) => {
      $provide.removeDirectives('uiSref');
      $provide.value('$state', {go: this.go});
      $provide.value('spaceContext', {webhookRepo: this.repo});
    });

    this.notification = this.mockService('notification');

    this.compile = (context, webhook) => {
      const data = {context: context || {}, webhook: webhook || {headers: [], topics: ['*.*']}};
      data.webhook.sys = data.webhook.sys || {};
      this.element = this.$compile('<div cf-ui-tab><cf-webhook-editor /></div>', data);
      this.scope = this.element.scope();
      this.scope.tabController.activate('settings');
      this.$apply();
    };

    this.button = (label) => this.element.find(`button:contains("${label}")`).first();
  });

  describe('Editor new and dirty state', () => {
    it('marks as dirty for a new webhook', function () {
      this.compile({isNew: true});
      expect(this.scope.context.dirty).toBe(true);
    });

    it('marks as non-dirty for a fetched webhook', function () {
      this.compile({isNew: false});
      expect(this.scope.context.dirty).toBe(false);
    });
  });

  describe('WebhookForm props', function () {
    it('has a copy of webhook data without sys', function () {
      const shouldBeCloned = {};
      this.compile({isNew: false}, {name: 'test', shouldBeCloned, sys: {test: true}});
      expect(this.scope.props.webhook).toEqual({name: 'test', shouldBeCloned});
      expect(this.scope.props.webhook.shouldBeCloned).not.toBe(shouldBeCloned);
    });

    it('has method for merging changes into a scope webhook', function () {
      this.compile({isNew: false}, {});
      const webhook = this.scope.webhook;
      webhook.name = 'hello';
      this.scope.props.onChange({url: 'http://test'});
      expect(this.scope.webhook).toBe(webhook);
      expect(this.scope.webhook.url).toBe('http://test');
    });

    it('has flag indicating if credentials are stored', function () {
      this.compile({isNew: false}, {name: 'test', httpBasicUsername: 'jakub'});
      expect(this.scope.props.hasHttpBasicStored).toBe(true);

      this.compile({isNew: false}, {name: 'test'});
      expect(this.scope.props.hasHttpBasicStored).toBe(false);
    });

    it('allows to clear stored credentials', function () {
      this.compile({isNew: false}, {name: 'test', httpBasicUsername: 'jakub'});
      expect(this.scope.props.hasHttpBasicStored).toBe(true);
      this.scope.props.onChange({httpBasicUsername: null});
      expect(this.scope.props.hasHttpBasicStored).toBe(false);
    });
  });

  describe('Action buttons', () => {
    it('hides "delete" button for new webhooks', function () {
      this.compile({isNew: true});
      expect(this.button('Remove')).toBeNgHidden();
    });

    it('disables "save" button when not dirty', function () {
      this.compile({isNew: false});
      expect(this.scope.context.dirty).toBe(false);
      expect(this.button('Save').get(0).disabled).toBe(true);
    });

    it('enables "save" button when dirty', function () {
      this.compile({isNew: false});
      this.scope.props.onChange({...this.scope.webhook, url: 'http://test.com'});
      this.scope.$apply();
      expect(this.scope.context.dirty).toBe(true);
      expect(this.button('Save').get(0).disabled).toBe(false);
    });
  });

  describe('Saving webhook', () => {
    const SUCCESS_MSG = 'Webhook "test" saved successfully.';

    describe('New webhook', () => {
      beforeEach(function () {
        this.compile({isNew: true}, {name: 'test', url: 'http://test.com', topics: ['*.*']});
        const saved = _.cloneDeep(this.scope.webhook);
        saved.sys.id = 'whid';
        this.repo.save.resolves(saved);
        this.scope.$apply();
        this.button('Save').click();
      });

      it('calls "save" method of repository', function () {
        sinon.assert.calledOnce(this.repo.save);
      });

      it('redirects from /new to /:id page', function () {
        sinon.assert.calledWith(this.go, '^.detail', { webhookId: 'whid' });
      });

      it('shows success notification', function () {
        sinon.assert.calledOnce(this.notification.info);
        sinon.assert.calledWith(this.notification.info, SUCCESS_MSG);
      });
    });

    describe('Existing webhook', () => {
      beforeEach(function () {
        this.compile({isNew: false}, {sys: {id: 'whid'}, name: 'old', url: 'http://test.com', topics: ['*.*']});
        this.scope.props.onChange({...this.scope.webhook, name: 'test'});
        const response = _.cloneDeep(this.scope.webhook);
        response.sys.version = 2;
        this.repo.save.resolves(response);
        this.scope.$apply();
        this.button('Save').click();
      });

      it('calls "save" method of repository', function () {
        sinon.assert.calledOnce(this.repo.save);
      });

      it('sets dirty state and entity', function () {
        expect(this.scope.context.dirty).toBe(false);
        expect(this.scope.webhook.sys.version).toBe(2);
      });

      it('shows success notification', function () {
        sinon.assert.calledOnce(this.notification.info);
        sinon.assert.calledWith(this.notification.info, SUCCESS_MSG);
      });
    });
  });

  describe('Deleting webhook', () => {
    beforeEach(function () {
      this.promise = new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });

      this.modal = this.$inject('modalDialog');
      this.modal.open = sinon.stub().returns({promise: this.promise});
      this.compile({isNew: false}, {sys: {id: 'whid'}, url: 'http://test.com', name: 'test'});
      this.button('Remove').click();
      this.args = this.modal.open.firstCall.args[0];
    });

    it('opens confirmation dialog', function () {
      sinon.assert.calledOnce(this.modal.open);
      expect(this.args.template.includes('app/Webhooks/WebhookRemovalDialog')).toBe(true);
      const scope = {};
      this.args.controller(scope);
      expect(scope.props.webhookUrl).toBe('http://test.com');
    });

    it('calls repository with a webhook object, ', async function () {
      this.repo.remove.resolves();
      const scope = {};
      this.args.controller(scope);
      await scope.props.remove();
      sinon.assert.calledOnce(this.repo.remove);
      expect(this.repo.remove.firstCall.args[0].sys.id).toBe('whid');
    });

    it('shows message and redirects to list when webhook is removed', async function () {
      this.resolve();
      await this.promise;
      sinon.assert.calledWith(this.notification.info, 'Webhook "test" deleted successfully.');
      sinon.assert.calledWith(this.go, '^.list');
    });

    it('shows notification when webhook failed to remove', async function () {
      const ReloadNotification = this.$inject('ReloadNotification');
      ReloadNotification.basicErrorHandler = sinon.spy();
      this.reject(new Error('failed'));

      try {
        await this.promise;
      } catch (err) {
        sinon.assert.calledOnce(ReloadNotification.basicErrorHandler);
        return;
      }

      throw new Error('should not end up here');
    });

    it('does nothing if canceled', async function () {
      const ReloadNotification = this.$inject('ReloadNotification');
      ReloadNotification.basicErrorHandler = sinon.spy();
      this.reject();

      try {
        await this.promise;
      } catch (err) {
        sinon.assert.notCalled(ReloadNotification.basicErrorHandler);
        return;
      }

      throw new Error('should not end up here');
    });
  });
});
