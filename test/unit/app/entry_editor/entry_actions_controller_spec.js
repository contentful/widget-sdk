import * as K from 'test/helpers/mocks/kefir';
import _ from 'lodash';
import sinon from 'sinon';
import { $initializeAndReregister, $inject, $apply } from 'test/helpers/helpers';

describe('Entry Actions Controller', () => {
  beforeEach(async function() {
    this.stubs = {
      track: sinon.stub()
    };

    this.system.set('analytics/Analytics.es6', {
      track: this.stubs.track
    });

    await $initializeAndReregister(this.system, ['app/entry_editor/entryActionsController.es6']);

    const $rootScope = $inject('$rootScope');
    this.scope = $rootScope.$new();
    this.$state = $inject('$state');
    this.notify = sinon.stub();
    this.fields$ = K.createMockProperty({});

    const $controller = $inject('$controller');
    const spaceContext = $inject('mocks/spaceContext').init();
    this.createEntry = sinon.stub();
    spaceContext.space.createEntry = this.createEntry;

    this.entityInfo = {
      id: 'EID',
      contentTypeId: 'CID'
    };

    this.controller = $controller('EntryActionsController', {
      $scope: this.scope,
      notify: this.notify,
      fields$: this.fields$,
      entityInfo: this.entityInfo,
      preferences: {}
    });

    spaceContext.publishedCTs = {
      get: sinon
        .stub()
        .withArgs(this.entityInfo)
        .returns({
          data: { name: 'foo' }
        })
    };
  });

  describe('#add and #duplicate', () => {
    beforeEach(function() {
      this.$state.go = sinon.stub();
    });

    ['add', 'duplicate'].forEach(itCreatesTheEntryWithReportingAndErrors);

    function itCreatesTheEntryWithReportingAndErrors(action) {
      let executeActionAndApplyScope;
      const response = { getId: _.constant('NEW ID'), data: {} };

      beforeEach(function() {
        executeActionAndApplyScope = () => {
          this.controller[action].execute();
          $apply();
        };
      });

      describe(`#${action}`, () => {
        if (action === 'add') {
          it('tracks the entry_editor:created_with_same_ct event', function() {
            this.createEntry.resolves(response);
            executeActionAndApplyScope();
            const { contentTypeId, id: entryId } = this.entityInfo;
            sinon.assert.calledWithExactly(this.stubs.track, 'entry_editor:created_with_same_ct', {
              contentTypeId,
              entryId
            });
          });
        }

        describe('on success', () => {
          beforeEach(function() {
            this.createEntry.resolves(response);
            executeActionAndApplyScope();
          });

          itCallsTheAction();

          it('tracks the event', function() {
            sinon.assert.calledWithExactly(this.stubs.track, 'entry:create', {
              eventOrigin: action === 'add' ? 'entry-editor' : 'entry-editor__duplicate',
              contentType: { name: 'foo' },
              response: response.data
            });
          });

          it('opens the editor', function() {
            sinon.assert.calledWith(this.$state.go, '^.detail', {
              entryId: 'NEW ID',
              previousEntries: '',
              addToContext: false
            });
          });
        });

        describe('on error', () => {
          beforeEach(function() {
            this.createEntry.rejects();
            executeActionAndApplyScope();
          });

          itCallsTheAction();

          it('sends the error notification', function() {
            sinon.assert.calledWith(this.notify, sinon.match({ action }));
          });
        });

        function itCallsTheAction() {
          it('calls the action', function() {
            sinon.assert.calledWith(this.createEntry, 'CID');
          });
        }
      });
    }
  });
});
