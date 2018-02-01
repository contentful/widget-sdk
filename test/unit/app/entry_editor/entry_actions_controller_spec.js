import * as K from 'helpers/mocks/kefir';

describe('Entry Actions Controller', function () {
  beforeEach(function () {
    module('contentful/test');

    const $rootScope = this.$inject('$rootScope');
    this.scope = $rootScope.$new();
    this.$state = this.$inject('$state');
    this.notify = sinon.stub();
    this.fields$ = K.createMockProperty({});

    const $controller = this.$inject('$controller');
    const spaceContext = this.$inject('mocks/spaceContext').init();
    this.createEntry = sinon.stub();
    spaceContext.space.createEntry = this.createEntry;

    this.controller = $controller('EntryActionsController', {
      $scope: this.scope,
      notify: this.notify,
      fields$: this.fields$,
      entityInfo: {
        id: 'EID',
        contentTypeId: 'CID'
      },
      preferences: {}
    });
  });

  describe('#duplicate command', function () {
    describe('fails with an error', function () {
      beforeEach(function () {
        this.createEntry.rejects();
        this.controller.duplicate.execute();
        this.$apply();
      });

      it('calls action', function () {
        sinon.assert.calledWith(this.createEntry, 'CID');
      });

      it('sends notification', function () {
        sinon.assert.calledWith(
          this.notify,
          sinon.match({action: 'duplicate'})
        );
      });
    });

    describe('succeeds', function () {
      beforeEach(function () {
        this.createEntry.resolves({
          getId: _.constant('NEW ID')
        });
        this.$state.go = sinon.stub();
        this.controller.duplicate.execute();
        this.$apply();
      });

      it('calls action', function () {
        sinon.assert.calledWith(this.createEntry, 'CID');
      });

      it('opens the editor', function () {
        sinon.assert.calledWith(this.$state.go, '^.detail', {
          entryId: 'NEW ID',
          addToContext: false
        });
      });
    });
  });
});
