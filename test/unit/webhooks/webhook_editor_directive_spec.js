'use strict';

describe('Webhook Editor directive', () => {
  beforeEach(function () {
    this.go = sinon.stub();

    module('contentful/test', ($provide) => {
      $provide.removeDirectives('uiSref');
      $provide.value('$state', {
        go: this.go
      });
    });

    this.notification = this.mockService('notification');

    this.repo = {
      save: sinon.stub(),
      remove: sinon.stub(),
      logs: {getCalls: sinon.stub().resolves({items: []})}
    };

    this.$inject('WebhookRepository').getInstance = sinon.stub().returns(this.repo);

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

    it('increments "touched" counter, switches "dirty" flag', function () {
      this.compile({isNew: false});
      this.scope.webhook.url = 'http://test.com';
      expect(this.scope.context.dirty).toBe(false);
      this.$apply();
      expect(this.scope.context.dirty).toBe(true);
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
      this.scope.webhook.url = 'http://test.com';
      this.scope.$apply();
      expect(this.scope.context.dirty).toBe(true);
      expect(this.button('Save').get(0).disabled).toBe(false);
    });
  });

  describe('Checks if API has Basic Auth credentials', () => {
    const PASSWORD_FIELD_ID = '#webhook-http-basic-password';

    it('looks for username on initialization', function () {
      this.compile(undefined, {httpBasicUsername: 'jakub'});
      expect(this.scope.apiHasAuthCredentials).toBe(true);
    });

    it('treats null, undefined and empty string as invalid values', function () {
      this.compile(undefined, {httpBasicUsername: ''});
      expect(this.scope.apiHasAuthCredentials).toBe(false);
      this.compile(undefined, {httpBasicUsername: null});
      expect(this.scope.apiHasAuthCredentials).toBe(false);
      this.compile();
      expect(this.scope.apiHasAuthCredentials).toBe(false);
    });

    it('sets placeholder if has credentials and username', function () {
      this.compile({isNew: false}, {httpBasicUsername: 'jakub'});
      const el = this.element.find(PASSWORD_FIELD_ID);
      expect(el.attr('placeholder')).toBe('use previously provided password');
    });

    it('keeps placeholder empty if there is no username', function () {
      this.compile({isNew: false}, undefined);
      const el = this.element.find(PASSWORD_FIELD_ID);
      expect(el.attr('placeholder')).toBe('');
    });

    it('handles changes to model', function () {
      this.compile({isNew: false}, {httpBasicUsername: 'jakub'});
      this.scope.webhook.httpBasicUsername = '';
      this.$apply();
      const el = this.element.find(PASSWORD_FIELD_ID);
      expect(el.attr('placeholder')).toBe('');
    });
  });

  describe('Saving webhook', () => {
    const SUCCESS_MSG = 'Webhook "test" saved successfully.';

    describe('Model handling', () => {
      beforeEach(function () {
        this.compile({isNew: false}, {name: 'test', url: 'http://test.com', topics: ['*.*']});
      });

      it('nullifies username and password', function () {
        this.scope.webhook.httpBasicUsername = '';
        this.scope.webhook.httpBasicPassword = '';
        this.scope.$apply();
        const webhookPreSave = this.scope.webhook;
        this.repo.save.rejects();
        this.button('Save').click();
        sinon.assert.calledOnce(this.repo.save);
        expect(webhookPreSave.httpBasicUsername).toBeNull();
        expect(webhookPreSave.httpBasicPassword).toBeNull();
      });

      it('leaves password as undefined when username is defined', function () {
        this.scope.webhook.httpBasicUsername = 'test';
        this.scope.$apply();
        const webhookPreSave = this.scope.webhook;
        this.repo.save.rejects();
        this.button('Save').click();
        sinon.assert.calledOnce(this.repo.save);
        expect(webhookPreSave.httpBasicUsername).toBe('test');
        expect(webhookPreSave.httpBasicPassword).toBeUndefined();
      });
    });

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
        this.scope.webhook.name = 'test';
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

    describe('Frontend validation', () => {
      beforeEach(function () {
        this.clickSave = (wh) => {
          this.compile({isNew: true}, wh);
          this.button('Save').click();
        };
      });

      it('handles invalid name', function () {
        this.clickSave({url: 'http://test.com', topics: ['*.*']});
        sinon.assert.calledWith(this.notification.error, 'Please provide a valid webhook name.');
      });

      it('handles invalid URL', function () {
        this.clickSave({name: 'test', topics: ['*.*']});
        sinon.assert.calledWith(this.notification.error, 'Please provide a valid webhook URL.');
      });

      it('handles invalid topics', function () {
        this.clickSave({name: 'test', url: 'http://test.com', topics: []});
        sinon.assert.calledOnce(this.notification.error);
        expect(this.notification.error.firstCall.args[0]).toMatch(/triggering event/);
      });
    });

    describe('Server errors', () => {
      beforeEach(function () {
        this.rejectWithError = (err) => {
          this.compile({isNew: true}, {name: 'test', url: 'http://test.com', topics: ['*.*']});
          this.repo.save.rejects({body: {details: {errors: [err]}}});
          this.scope.$apply();
          this.button('Save').click();
        };
      });

      it('handles invalid URL', function () {
        this.rejectWithError({path: 'url', name: 'invalid'});
        sinon.assert.calledWith(this.notification.error, 'Please provide a valid webhook URL.');
      });

      it('handles taken URL', function () {
        this.rejectWithError({path: 'url', name: 'taken'});
        sinon.assert.calledWith(this.notification.error, 'This webhook URL is already used.');
      });

      it('handles Basic Auth credentials errors', function () {
        this.rejectWithError({path: 'http_basic_password'});
        sinon.assert.calledOnce(this.notification.error);
        expect(this.notification.error.firstCall.args[0]).toMatch(/user\/password combination/);
      });

      it('handles and logs server errors', function () {
        const logSpy = sinon.spy();
        this.$inject('logger').logServerWarn = logSpy;
        this.rejectWithError(undefined);

        sinon.assert.calledOnce(this.notification.error);
        expect(this.notification.error.firstCall.args[0]).toMatch(/Error saving webhook/);
        sinon.assert.calledOnce(logSpy);
      });
    });
  });

  describe('Deleting webhook', () => {
    let modal;
    beforeEach(function () {
      modal = this.$inject('modalDialog');
      modal.open = sinon.spy();
      this.compile({isNew: false}, {sys: {id: 'whid'}, url: 'http://test.com', name: 'test'});
      this.button('Remove').click();
      this.args = modal.open.firstCall.args[0];
    });

    it('opens confirmation dialog', function () {
      sinon.assert.calledOnce(modal.open);
      expect(this.args.template).toBe('webhook_removal_confirm_dialog');
      expect(this.args.scopeData.webhook.sys.id).toBe('whid');
    });

    it('calls repository with a webhook object, shows message and redirects to list', async function () {
      this.repo.remove.resolves();

      await this.args.scopeData.remove.execute();

      sinon.assert.calledOnce(this.repo.remove);
      expect(this.repo.remove.firstCall.args[0].sys.id).toBe('whid');
      sinon.assert.calledWith(this.notification.info, 'Webhook "test" deleted successfully.');
      sinon.assert.calledWith(this.go, '^.list');
    });

    it('shows notification when repository call fails', async function () {
      const ReloadNotification = this.$inject('ReloadNotification');
      ReloadNotification.basicErrorHandler = sinon.spy();
      this.repo.remove.rejects();

      await this.args.scopeData.remove.execute();

      sinon.assert.calledOnce(ReloadNotification.basicErrorHandler);
    });
  });
});
