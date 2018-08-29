'use strict';
import $q from '$q';
import {create as createDocument} from 'helpers/mocks/entity_editor_document';

describe('entityEditor/StateController', () => {
  const SLIDE_IN_EDITOR_FEATURE_FLAG_VALUE = 2; // Enabled with multiple levels.

  beforeEach(function () {
    const closeStateSpy = this.closeStateSpy = sinon.spy();

    module('contentful/test', $provide => {
      $provide.value('navigation/closeState', closeStateSpy);
      $provide.factory('TheLocaleStore', ['mocks/TheLocaleStore', _.identity]);
    });

    const LD = this.$inject('utils/LaunchDarkly');
    LD.onFeatureFlag = sinon.stub().callsFake((_1, _2, cb) => {
      cb(SLIDE_IN_EDITOR_FEATURE_FLAG_VALUE);
    });

    this.rootScope = this.$inject('$rootScope');
    this.scope = this.rootScope.$new();
    this.scope.editorContext = this.$inject('mocks/entityEditor/Context').create();
    this.scope.entityInfo = {};

    this.spaceContext = this.$inject('spaceContext');

    this.$inject('access_control/AccessChecker').canPerformActionOnEntity = sinon.stub().returns(true);

    const dialogDefer = $q.defer();
    this.$inject('modalDialog').open = sinon.stub().returns({ promise: dialogDefer.promise });
    dialogDefer.resolve();

    const warnings = this.$inject('entityEditor/publicationWarnings');
    warnings.create = sinon.stub().returns({
      register: this.registerWarningSpy = sinon.spy(),
      show: this.showWarningsStub = sinon.stub().resolves()
    });

    this.analytics = this.$inject('analytics/Analytics');
    this.analytics.track = sinon.stub();

    const N = this.$inject('app/entity_editor/Notifications');
    this.Notification = N.Notification;
    this.notify = sinon.stub();

    this.assertErrorNotification = function (action, error) {
      sinon.assert.calledOnce(this.notify);
      const arg = this.notify.args[0][0];
      expect(arg).toBeInstanceOf(N.Notification.Error);
      expect(arg.action).toBe(action);
      expect(arg.response).toBe(error);
    };

    this.assertSuccessNotification = function (action) {
      sinon.assert.calledOnce(this.notify);
      const arg = this.notify.args[0][0];
      expect(arg).toBeInstanceOf(N.Notification.Success);
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

    this.slideInNavigator = this.$inject('navigation/SlideInNavigator');
    this.slideInNavigator.goToPreviousSlideOrExit = sinon.stub();

    this.validator = this.scope.editorContext.validator;

    const $controller = this.$inject('$controller');
    this.controller = $controller('entityEditor/StateController', {
      $scope: this.scope,
      notify: this.notify,
      validator: this.validator,
      otDoc: this.doc
    });
  });

  describe('#delete command execution', () => {
    beforeEach(function () {
      this.scope.entityInfo = {
        id: 'abc',
        type: 'Entry'
      };

      this.spaceContext.cma = {
        getEntries: sinon.stub().resolves({ items: [] })
      };
    });

    it('makes delete request', function () {
      this.controller.delete.execute();
      this.$apply();
      sinon.assert.calledWith(
        this.spaceEndpoint,
        sinon.match({
          method: 'DELETE',
          path: ['entries', 'EID'],
          version: 42
        })
      );
    });

    it('send success notification', function () {
      this.controller.delete.execute();
      this.$apply();
      this.assertSuccessNotification('delete');
    });

    it('sends failure notification with API error', function () {
      this.spaceEndpoint.rejects('ERROR');
      this.controller.delete.execute();
      this.$apply();
      this.assertErrorNotification('delete', 'ERROR');
    });

    it(`navigates to the previous slide-in entity or
        closes the current state as a fallback`, function () {
      this.controller.delete.execute();
      this.$apply();
      sinon.assert.calledOnceWith(
        this.slideInNavigator.goToPreviousSlideOrExit,
        SLIDE_IN_EDITOR_FEATURE_FLAG_VALUE,
        'delete',
        this.closeStateSpy
      );
    });
  });

  describe('in published state without changes', () => {
    beforeEach(function () {
      this.doc.setValueAt(['sys'], {
        id: 'EID',
        type: 'Entry',
        version: 42,
        publishedVersion: 43
      });
      this.$apply();
    });

    it('sets current state to "published"', function () {
      expect(this.controller.current).toEqual('published');
    });

    it('has no primary action', function () {
      expect(this.controller.hidePrimary).toBe(true);
    });

    it('has two secondary actions', function () {
      expect(this.controller.secondary.length).toEqual(2);
    });

    describe('the first secondary action', () => {
      beforeEach(function () {
        this.action = this.controller.secondary[0];
      });

      it('unpublishes and archives the entity', function () {
        this.action.execute();
        this.$apply();
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
      beforeEach(function () {
        this.action = this.controller.secondary[1];
      });

      it('unpublishes the entity', function () {
        this.action.execute();
        this.$apply();
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
    it('sets current state to "draft"', function () {
      expect(this.controller.current).toEqual('draft');
    });

    describe('primary action publish', () => {
      it('publishes entity', function () {
        this.controller.primary.execute();
        this.$apply();
        sinon.assert.calledWith(
          this.spaceEndpoint,
          sinon.match({
            method: 'PUT',
            path: ['entries', 'EID', 'published'],
            version: 42
          })
        );
      });

      it('notifies on success', function () {
        this.controller.primary.execute();
        this.$apply();
        this.assertSuccessNotification('publish');
      });

      it('runs the validator', function () {
        this.controller.primary.execute();
        this.$apply();
        sinon.assert.calledOnce(this.validator.run);
      });

      describe('when the entity is an entry', () => {
        beforeEach(function () {
          const contentTypeId = 'foo';
          this.scope.entityInfo = {
            type: 'Entry',
            contentTypeId: contentTypeId
          };
          this.spaceContext.publishedCTs = {
            get: sinon.stub().withArgs(contentTypeId).returns({
              data: { name: 'foo' }
            })
          };
        });

        describe('when we are in the bulk editor', () => {
          beforeEach(function () {
            this.scope.bulkEditorContext = {};
          });

          itTracksThePublishEventWithOrigin('bulk-editor');
        });

        describe('when we are in the entry editor', () => {
          beforeEach(function () {
            delete this.scope.bulkEditorContext;
          });

          itTracksThePublishEventWithOrigin('entry-editor');
        });

        function itTracksThePublishEventWithOrigin (eventOrigin) {
          it('tracks the publish event', function () {
            this.controller.primary.execute();
            this.$apply();
            sinon.assert.calledWithExactly(
              this.analytics.track,
              'entry:publish',
              {
                eventOrigin: eventOrigin,
                contentType: { data: { name: 'foo' } },
                response: { data: this.entity },
                customWidgets: []
              }
            );
          });
        }
      });

      describe('when the entity is not an entry', () => {
        beforeEach(function () {
          const contentTypeId = 'foo';
          this.scope.entityInfo = {
            type: 'Asset',
            contentTypeId: contentTypeId
          };
          this.spaceContext.publishedCTs = {
            get: sinon.stub()
          };
        });

        it('does not track the publish event', function () {
          this.controller.primary.execute();
          this.$apply();
          sinon.assert.notCalled(this.spaceContext.publishedCTs.get);
          sinon.assert.notCalled(this.analytics.track);
        });
      });

      it('sends notification if validation failed', function () {
        this.validator.run.returns(false);
        this.controller.primary.execute();
        this.$apply();
        sinon.assert.calledWith(
          this.notify,
          sinon.match.instanceOf(this.Notification.ValidationError)
        );
      });

      it('does not publish if validation failed', function () {
        this.validator.run.returns(false);

        this.controller.primary.execute();
        this.$apply();
        sinon.assert.notCalled(this.spaceEndpoint);
      });

      it('sends notification on server error', function () {
        this.spaceEndpoint.rejects('ERROR');
        this.controller.primary.execute();
        this.$apply();
        this.assertErrorNotification('publish', 'ERROR');
      });
    });

    describe('secondary action archive', () => {
      beforeEach(function () {
        this.action = this.controller.secondary[0];
      });

      it('has only one', function () {
        expect(this.controller.secondary.length).toEqual(1);
      });

      it('archives entity', function () {
        this.action.execute();
        this.$apply();
        sinon.assert.calledWith(
          this.spaceEndpoint,
          sinon.match({
            method: 'PUT',
            path: ['entries', 'EID', 'archived'],
            version: 42
          })
        );
      });

      it('notifies on success', function () {
        this.action.execute();
        this.$apply();
        this.assertSuccessNotification('archive');
      });

      it('notifies on failure', function () {
        this.spaceEndpoint.rejects('ERROR');
        this.action.execute();
        this.$apply();
        this.assertErrorNotification('archive', 'ERROR');
      });
    });
  });

  describe('#revertToPrevious command', () => {
    it('is available iff document has changes and the document is editable', function () {
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

    it('calls notification for successful execution', function () {
      this.doc.reverter.revert.resolves();

      sinon.assert.notCalled(this.doc.reverter.revert);
      this.controller.revertToPrevious.execute();
      this.$apply();

      sinon.assert.calledOnce(this.doc.reverter.revert);
      this.assertSuccessNotification('revert');
    });

    it('calls notification for failed execution', function () {
      this.doc.reverter.revert.rejects('ERROR');

      sinon.assert.notCalled(this.doc.reverter.revert);
      this.controller.revertToPrevious.execute();
      this.$apply();

      sinon.assert.calledOnce(this.doc.reverter.revert);
      this.assertErrorNotification('revert', 'ERROR');
    });
  });

  describe('publication warnings', () => {
    it('allows publication warnings registration', function () {
      const warning = {};
      this.controller.registerPublicationWarning(warning);
      sinon.assert.calledOnce(this.registerWarningSpy.withArgs(warning));
    });

    it('shows publication warnings before actual action', function () {
      this.$apply();
      this.controller.primary.execute();
      sinon.assert.calledOnce(this.showWarningsStub);
    });
  });
});
