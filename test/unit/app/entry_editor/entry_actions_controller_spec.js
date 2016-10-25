'use strict';

describe('Entry Actions Controller', function () {
  beforeEach(function () {
    module('contentful/test');
    const cfStub = this.$inject('cfStub');

    const space = cfStub.space('spaceid');
    // TODO this should be possible without the space
    const entry = cfStub.entry(space, 'entryid', 'typeid');

    const $rootScope = this.$inject('$rootScope');
    this.scope = $rootScope.$new();
    this.$state = this.$inject('$state');
    this.scope.spaceContext = {space: {}};
    this.scope.entry = entry;
    this.notify = {};

    const $controller = this.$inject('$controller');
    this.controller = $controller('EntryActionsController', {
      $scope: this.scope,
      notify: this.notify
    });
  });

  describe('#duplicate command', function () {
    beforeEach(function () {
      this.createEntry = sinon.stub();
      this.scope.spaceContext.space.createEntry = this.createEntry;
    });

    describe('fails with an error', function () {
      beforeEach(function () {
        this.notify.duplicateFail = sinon.stub();
        this.createEntry.rejects({error: true});
        this.controller.duplicate.execute();
        this.$apply();
      });

      it('calls action', function () {
        sinon.assert.calledWith(this.createEntry, 'typeid');
      });

      it('sends notification', function () {
        sinon.assert.called(this.notify.duplicateFail);
      });
    });

    describe('succeeds', function () {
      beforeEach(function () {
        this.createEntry.resolves(this.scope.entry);
        this.$state.go = sinon.stub();
        this.controller.duplicate.execute();
        this.$apply();
      });

      it('calls action', function () {
        sinon.assert.calledWith(this.createEntry, 'typeid');
      });

      it('opens the editor', function () {
        sinon.assert.calledWith(this.$state.go, 'spaces.detail.entries.detail', {
          entryId: this.scope.entry.getId(),
          notALinkedEntity: true
        });
      });
    });
  });
});
