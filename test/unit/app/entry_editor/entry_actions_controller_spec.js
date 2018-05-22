import * as K from 'helpers/mocks/kefir';

describe('Entry Actions Controller', function () {
  beforeEach(function () {
    module('contentful/test');

    const $rootScope = this.$inject('$rootScope');
    this.scope = $rootScope.$new();
    this.$state = this.$inject('$state');
    this.notify = sinon.stub();
    this.fields$ = K.createMockProperty({});

    this.analytics = this.$inject('analytics/Analytics');
    this.analytics.track = sinon.stub();

    const $controller = this.$inject('$controller');
    const spaceContext = this.$inject('mocks/spaceContext').init();
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
      get: sinon.stub().withArgs(this.entityInfo).returns({
        data: { name: 'foo' }
      })
    };
  });

  describe('#add and #duplicate', function () {
    beforeEach(function () {
      this.$state.go = sinon.stub();
    });

    ['add', 'duplicate'].forEach(itCreatesTheEntryWithReportingAndErrors);

    function itCreatesTheEntryWithReportingAndErrors (action) {
      let executeActionAndApplyScope;
      const response = { getId: _.constant('NEW ID') };

      beforeEach(function () {
        executeActionAndApplyScope = () => {
          this.controller[action].execute();
          this.$apply();
        };
      });

      describe(`#${action}`, function () {
        if (action === 'add') {
          it('tracks the entry_editor:created_with_same_ct event', function () {
            this.createEntry.resolves(response);
            executeActionAndApplyScope();
            const { contentTypeId, id: entryId } = this.entityInfo;
            sinon.assert.calledWithExactly(
              this.analytics.track,
              'entry_editor:created_with_same_ct',
              { contentTypeId, entryId }
            );
          });
        }

        describe('on success', function () {
          beforeEach(function () {
            this.createEntry.resolves(response);
            executeActionAndApplyScope();
          });

          itCallsTheAction();

          it('tracks the event', function () {
            sinon.assert.calledWithExactly(
              this.analytics.track,
              'entry:create',
              {
                eventOrigin: (
                  action === 'add'
                    ? 'entry-editor'
                    : 'entry-editor__duplicate'
                ),
                contentType: { data: { name: 'foo' } },
                response: response
              }
            );
          });

          it('opens the editor', function () {
            sinon.assert.calledWith(
              this.$state.go,
              '^.detail',
              {
                entryId: 'NEW ID',
                slideIn: '',
                addToContext: false
              }
            );
          });
        });

        describe('on error', function () {
          beforeEach(function () {
            this.createEntry.rejects();
            executeActionAndApplyScope();
          });

          itCallsTheAction();

          it('sends the error notification', function () {
            sinon.assert.calledWith(
              this.notify,
              sinon.match({ action })
            );
          });
        });

        function itCallsTheAction () {
          it('calls the action', function () {
            sinon.assert.calledWith(this.createEntry, 'CID');
          });
        }
      });
    }
  });
});
