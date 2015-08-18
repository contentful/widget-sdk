'use strict';

describe('otDocPresenceController', function(){

  function makeOtDoc() {
    return {
      shout: sinon.stub(),
      on: sinon.stub().yieldsAsync([]),
      removeListener: sinon.stub()
    };
  }

  beforeEach(function(){
    module('contentful/test');
    this.$scope = this.$inject('$rootScope').$new();
    this.$scope.otDoc = {};

    this.$scope.user = {
      sys: { id: 'ownUser' }
    };

    this.controller = this.$inject('$controller')('otDocPresenceController', {$scope: this.$scope});
  });

  it('has no otPresence on scope', function(){
    expect(this.$scope.otPresence).not.toBeDefined();
  });

  it('presence watcher creates otPresence on scope', function(){
    this.$scope.otDoc = makeOtDoc();
    this.$scope.otDoc.on = sinon.stub().yieldsAsync([]);
    this.$scope.$digest();
    expect(this.$scope.otPresence).toBeDefined();
  });

  describe('presence defines a source user (from)', function(){
    beforeEach(function(done){
      this.$scope.otDoc = makeOtDoc();
      this.$scope.otDoc.on = sinon.stub().yieldsAsync([ '', 'sourceUser']);
      this.$scope.$digest();
      // defer due to $apply on shoutHandler
      _.defer(function () { done(); });
    });

    it('creates otPresence on scope', function(){
      expect(this.$scope.otPresence.users[0].sys.id).toEqual('sourceUser');
    });
  });

  describe('otDoc watcher', function(){
    beforeEach(function(){
      this.$scope.otDoc = makeOtDoc();
      this.$scope.$digest();
    });

    it('shouts about user opening a doc', function(){
      sinon.assert.called(this.$scope.otDoc.shout);
    });

    it('listens for further shout events on doc', function(){
      sinon.assert.called(this.$scope.otDoc.on);
    });
  });

  describe('handles focus shout', function(){
    beforeEach(function(done){
      this.$scope.otDoc = makeOtDoc();
      this.$scope.otDoc.on = sinon.stub().yieldsAsync(['focus', 'sourceUser', 'fieldId']);
      this.$scope.$digest();
      // defer due to $apply on shoutHandler
      _.defer(function () { done(); });
    });

    it('field focus has been declared', function(){
      expect(this.$scope.otPresence.fields.fieldId).toBeDefined();
    });

    it('user id present in field focus', function(){
      expect(this.$scope.otPresence.fields.fieldId.users[0].sys.id).toBe('sourceUser');
    });
  });

  describe('handles open shout', function(){
    describe('with a focused field', function(){
      beforeEach(function(done){
        this.controller.focus('fieldId');
        this.$scope.otDoc = makeOtDoc();
        this.$scope.otDoc.on = sinon.stub().yieldsAsync(['open', 'ownUser']);
        this.$scope.$digest();
        // defer due to $apply on shoutHandler
        _.defer(function () { done(); });
      });

      it('shouts focus', function(){
        sinon.assert.calledWith(this.$scope.otDoc.shout, ['focus', 'ownUser', 'fieldId']);
      });
    });

    describe('with no focused field', function(){
      beforeEach(function(done){
        this.$scope.otDoc = makeOtDoc();
        this.$scope.otDoc.on = sinon.stub().yieldsAsync(['open']);
        this.$scope.$digest();
        // defer due to $apply on shoutHandler
        _.defer(function () { done(); });
      });

      it('shouts focus', function(){
        sinon.assert.calledWith(this.$scope.otDoc.shout, ['ping', 'ownUser']);
      });
    });
  });

  describe('handles close shout', function(){
    beforeEach(function(done){
      this.$scope.otDoc = makeOtDoc();
      this.$scope.otDoc.on = sinon.stub().yieldsAsync(['', 'sourceUser']);
      this.$scope.$digest();
      this.$scope.otDoc = makeOtDoc();
      this.$scope.otDoc.on = sinon.stub().yieldsAsync(['close', 'sourceUser']);
      this.$scope.$digest();
      // defer due to $apply on shoutHandler
      _.defer(function () { done(); });
    });

    it('previously created user has been removed', function(){
      expect(this.$scope.otPresence.users.length).toBe(0);
    });
  });

});
