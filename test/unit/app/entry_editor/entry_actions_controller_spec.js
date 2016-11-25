'use strict';

describe('Entry Actions Controller', function () {
  beforeEach(function () {
    module('contentful/test');

    const $rootScope = this.$inject('$rootScope');
    const K = this.$inject('mocks/kefir');
    this.scope = $rootScope.$new();
    this.$state = this.$inject('$state');
    this.notify = {};
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
    beforeEach(function () {
      this.notify.duplicateFail = sinon.stub();
    });

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
        sinon.assert.called(this.notify.duplicateFail);
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
        sinon.assert.calledWith(this.$state.go, 'spaces.detail.entries.detail', {
          entryId: 'NEW ID',
          notALinkedEntity: true
        });
      });
    });
  });
});
