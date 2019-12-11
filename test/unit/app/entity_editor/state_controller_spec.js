import flushPromises from 'test/utils/flushPromises';

import createLocaleStoreMock from 'test/utils/createLocaleStoreMock';
import sinon from 'sinon';
import { $initialize, $inject, $apply } from 'test/utils/ng';
import { it } from 'test/utils/dsl';

describe('entityEditor/StateController', () => {
  beforeEach(async function() {
    this.stubs = {
      goToPreviousSlideOrExit: sinon.stub(),
      showUnpublishedReferencesWarning: sinon.stub().returns(Promise.resolve(true))
    };

    this.registerWarningSpy = sinon.stub();
    this.showWarningsStub = sinon.stub().resolves();

    this.system.set('navigation/SlideInNavigator', {
      goToPreviousSlideOrExit: this.stubs.goToPreviousSlideOrExit
    });

    this.system.set('app/common/ModalLauncher', {
      default: {
        open: sinon.stub().resolves(true)
      }
    });

    this.system.set('app/entity_editor/UnpublishedReferencesWarning', {
      showUnpublishedReferencesWarning: this.stubs.showUnpublishedReferencesWarning
    });

    this.system.set('services/localeStore', {
      default: createLocaleStoreMock()
    });

    this.system.set('analytics/Analytics', {
      track: sinon.stub()
    });

    this.system.set('access_control/AccessChecker', {
      canPerformActionOnEntity: sinon.stub.returns(true)
    });

    this.system.set('app/entity_editor/PublicationWarnings', {
      create: () => ({
        register: this.registerWarningSpy,
        show: this.showWarningsStub
      })
    });

    this.analytics = await this.system.import('analytics/Analytics');
    this.Notification = (await this.system.import('app/entity_editor/Notifications')).Notification;

    await $initialize(this.system);

    const createDocument = $inject('mocks/entityEditor/Document').create;

    this.rootScope = $inject('$rootScope');
    this.scope = this.rootScope.$new();
    this.scope.editorContext = $inject('mocks/entityEditor/Context').create();
    this.scope.entityInfo = {};
    this.scope.editorData = { widgetTrackingContexts: [] };

    this.spaceContext = $inject('spaceContext');
    this.spaceContext.getId = () => 'spaceid';
    this.spaceContext.getEnvironmentId = () => 'envid';

    this.notify = sinon.stub();

    this.assertErrorNotification = function(action, error) {
      sinon.assert.calledOnce(this.notify);
      const arg = this.notify.args[0][0];
      expect(arg).toBeInstanceOf(this.Notification.Error);
      expect(arg.action).toBe(action);
      expect(arg.response).toBe(error);
    };

    this.assertSuccessNotification = function(action) {
      sinon.assert.calledOnce(this.notify);
      const arg = this.notify.args[0][0];
      expect(arg).toBeInstanceOf(this.Notification.Success);
      expect(arg.action).toBe(action);
    };

    this.spaceEndpoint = sinon.stub();
    this.entity = {
      sys: {
        id: 'EID',
        type: 'Entry',
        version: 42
      }
    };
    this.doc = createDocument(this.entity, this.spaceEndpoint);
    this.spaceEndpoint.resolves(this.doc.getData());

    this.validator = this.scope.editorContext.validator;

    const $controller = $inject('$controller');
    this.controller = $controller('entityEditor/StateController', {
      $scope: this.scope,
      notify: this.notify,
      validator: this.validator,
      otDoc: this.doc
    });
  });

  describe('#delete command execution', () => {
    beforeEach(function() {
      this.scope.entityInfo = {
        id: 'abc',
        type: 'Entry'
      };

      this.spaceContext.cma = {
        getEntries: sinon.stub().resolves({ items: [] })
      };
    });

    it('makes delete request', async function() {
      await this.controller.delete.execute();
      $apply();

      sinon.assert.calledWith(
        this.spaceEndpoint,
        sinon.match({
          method: 'DELETE',
          path: ['entries', 'EID'],
          version: 42
        })
      );
    });

    it('sends success notification', async function() {
      await this.controller.delete.execute();

      $apply();

      this.assertSuccessNotification('delete');
    });

    it('sends failure notification with API error', async function() {
      this.spaceEndpoint.rejects('ERROR');
      await this.controller.delete.execute();
      $apply();
      this.assertErrorNotification('delete', 'ERROR');
    });

    it('navigates to the previous slide-in entity or closes the current state as a fallback', async function() {
      await this.controller.delete.execute();
      $apply();
      sinon.assert.calledOnceWith(this.stubs.goToPreviousSlideOrExit, 'delete');
    });
  });

  describe('in published state without changes', () => {
    beforeEach(function() {
      this.doc.setValueAt(['sys'], {
        id: 'EID',
        type: 'Entry',
        version: 42,
        publishedVersion: 43
      });
      $apply();
    });

    it('sets current state to "published"', function() {
      expect(this.controller.current).toEqual('published');
    });

    it('has no primary action', function() {
      expect(this.controller.hidePrimary).toBe(true);
    });

    it('has two secondary actions', function() {
      expect(this.controller.secondary.length).toEqual(2);
    });

    describe('the first secondary action', () => {
      beforeEach(function() {
        this.action = this.controller.secondary[0];
      });

      it('unpublishes and archives the entity', async function() {
        await this.action.execute();
        $apply();

        sinon.assert.calledWith(
          this.spaceEndpoint,
          sinon.match({
            method: 'DELETE',
            path: ['entries', 'EID', 'published'],
            version: 42
          })
        );
        sinon.assert.calledWith(
          this.spaceEndpoint,
          sinon.match({
            method: 'PUT',
            path: ['entries', 'EID', 'archived'],
            version: 42
          })
        );
      });
    });

    describe('the second secondary action', () => {
      beforeEach(function() {
        this.action = this.controller.secondary[1];
      });

      it('unpublishes the entity', async function() {
        await this.action.execute();
        $apply();

        sinon.assert.calledWith(
          this.spaceEndpoint,
          sinon.match({
            method: 'DELETE',
            path: ['entries', 'EID', 'published'],
            version: 42
          })
        );
      });
    });
  });

  describe('in draft state', () => {
    it('sets current state to "draft"', function() {
      expect(this.controller.current).toEqual('draft');
    });

    describe('primary action publish', () => {
      it('publishes entity', async function() {
        await this.controller.primary.execute();

        await flushPromises();
        $apply();

        sinon.assert.calledOnce(this.spaceEndpoint);
        sinon.assert.calledWith(
          this.spaceEndpoint,
          sinon.match({
            method: 'PUT',
            path: ['entries', 'EID', 'published'],

            version: 42
          })
        );
      });

      it('notifies on success', async function() {
        await this.controller.primary.execute();
        await flushPromises();
        $apply();

        this.assertSuccessNotification('publish');
      });

      it('runs the validator', async function() {
        await this.controller.primary.execute();

        await flushPromises();
        $apply();

        sinon.assert.calledOnce(this.validator.run);
      });

      describe('when the entity is an entry', () => {
        beforeEach(function() {
          const contentTypeId = 'foo';
          this.scope.entityInfo = {
            type: 'Entry',
            contentTypeId: contentTypeId
          };
          this.spaceContext.publishedCTs = {
            get: sinon
              .stub()
              .withArgs(contentTypeId)
              .returns({
                data: { name: 'foo' }
              })
          };
        });

        describe('when we are in the bulk editor', () => {
          beforeEach(function() {
            this.scope.bulkEditorContext = {};
          });

          itTracksThePublishEventWithOrigin('bulk-editor');
        });

        describe('when we are in the entry editor', () => {
          beforeEach(function() {
            delete this.scope.bulkEditorContext;
          });

          itTracksThePublishEventWithOrigin('entry-editor');
        });

        function itTracksThePublishEventWithOrigin(eventOrigin) {
          it('tracks the publish event', async function() {
            await this.controller.primary.execute();
            await flushPromises();
            $apply();

            sinon.assert.calledWithExactly(this.analytics.track, 'entry:publish', {
              eventOrigin: eventOrigin,
              contentType: { name: 'foo' },
              response: this.entity,
              widgetTrackingContexts: []
            });
          });
        }
      });

      describe('when the entity is not an entry', () => {
        beforeEach(function() {
          const contentTypeId = 'foo';
          this.scope.entityInfo = {
            type: 'Asset',
            contentTypeId: contentTypeId
          };
          this.spaceContext.publishedCTs = {
            get: sinon.stub()
          };
        });

        it('does not track the publish event', async function() {
          await this.controller.primary.execute();

          await flushPromises();
          $apply();

          sinon.assert.notCalled(this.spaceContext.publishedCTs.get);
          sinon.assert.notCalled(this.analytics.track);
        });
      });

      it('sends notification if validation failed', async function() {
        this.validator.run.returns(false);
        await this.controller.primary.execute();
        await flushPromises();
        $apply();

        sinon.assert.calledWith(
          this.notify,
          sinon.match.instanceOf(this.Notification.ValidationError)
        );
      });

      it('does not publish if validation failed', async function() {
        this.validator.run.returns(false);

        await this.controller.primary.execute();
        await flushPromises();
        $apply();

        sinon.assert.notCalled(this.spaceEndpoint);
      });

      it('sends notification on server error', async function() {
        this.spaceEndpoint.rejects('ERROR');
        await this.controller.primary.execute();

        await flushPromises();
        $apply();

        this.assertErrorNotification('publish', 'ERROR');
      });
    });

    describe('secondary action archive', () => {
      beforeEach(function() {
        this.action = this.controller.secondary[0];
      });

      it('has only one', function() {
        expect(this.controller.secondary.length).toEqual(1);
      });

      it('archives entity', async function() {
        await this.action.execute();
        $apply();

        sinon.assert.calledWith(
          this.spaceEndpoint,
          sinon.match({
            method: 'PUT',
            path: ['entries', 'EID', 'archived'],
            version: 42
          })
        );
      });

      it('notifies on success', async function() {
        await this.action.execute();
        $apply();

        this.assertSuccessNotification('archive');
      });

      it('notifies on failure', async function() {
        this.spaceEndpoint.rejects('ERROR');
        await this.action.execute();
        $apply();

        this.assertErrorNotification('archive', 'ERROR');
      });
    });
  });

  describe('#revertToPrevious command', () => {
    it('is available iff document has changes and the document is editable', function() {
      this.doc.reverter.hasChanges.returns(true);
      this.doc.state.canEdit$.set(true);
      expect(this.controller.revertToPrevious.isAvailable()).toBe(true);

      this.doc.reverter.hasChanges.returns(true);
      this.doc.state.canEdit$.set(false);
      expect(this.controller.revertToPrevious.isAvailable()).toBe(false);

      this.doc.reverter.hasChanges.returns(false);
      this.doc.state.canEdit$.set(true);
      expect(this.controller.revertToPrevious.isAvailable()).toBe(false);
    });

    it('calls notification for successful execution', function() {
      this.doc.reverter.revert.resolves();

      sinon.assert.notCalled(this.doc.reverter.revert);
      this.controller.revertToPrevious.execute();
      $apply();

      sinon.assert.calledOnce(this.doc.reverter.revert);
      this.assertSuccessNotification('revert');
    });

    it('calls notification for failed execution', function() {
      this.doc.reverter.revert.rejects('ERROR');

      sinon.assert.notCalled(this.doc.reverter.revert);
      this.controller.revertToPrevious.execute();
      $apply();

      sinon.assert.calledOnce(this.doc.reverter.revert);
      this.assertErrorNotification('revert', 'ERROR');
    });
  });

  describe('publication warnings', () => {
    it('shows publication warnings before actual action', async function() {
      $apply();
      await this.controller.primary.execute();

      sinon.assert.calledOnce(this.stubs.showUnpublishedReferencesWarning);
    });
  });
});
