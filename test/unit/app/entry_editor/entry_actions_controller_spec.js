'use strict';

describe('Entry Actions Controller', function () {
  beforeEach(function () {
    module('contentful/test');
    var cfStub = this.$inject('cfStub');

    var space = cfStub.space('spaceid');
    // TODO this should be possible without the space
    var entry = cfStub.entry(space, 'entryid', 'typeid');

    var $rootScope = this.$inject('$rootScope');
    this.scope = $rootScope.$new();
    this.scope.spaceContext = {space: {}};
    this.scope.entry = entry;
    this.notify = {};

    var $controller = this.$inject('$controller');
    this.controller = $controller('EntryActionsController', {
      $scope: this.scope,
      notify: this.notify
    });
  });


  describe('#duplicate command', function() {
    beforeEach(function() {
      this.createEntry = sinon.stub();
      this.scope.spaceContext.space.createEntry = this.createEntry;
    });

    describe('fails with an error', function() {
      beforeEach(function() {
        this.notify.duplicateFail = sinon.stub();
        this.createEntry.rejects({error: true});
        this.controller.duplicate.execute();
        this.$apply();
      });

      it('calls action', function() {
        sinon.assert.calledWith(this.createEntry, 'typeid');
      });

      it('sends notification', function() {
        sinon.assert.called(this.notify.duplicateFail);
      });
    });

    describe('succeeds', function() {
      beforeEach(function() {
        this.createEntry.resolves(this.scope.entry);
        this.scope.$state.go = sinon.stub();
        this.controller.duplicate.execute();
        this.$apply();
      });

      it('calls action', function() {
        sinon.assert.calledWith(this.createEntry, 'typeid');
      });

      it('opens the editor', function() {
        sinon.assert.calledWith(this.scope.$state.go, 'spaces.detail.entries.detail', {
          entryId: this.scope.entry.getId(),
          addToContext: true
        });
      });
    });
  });


});
