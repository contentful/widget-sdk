'use strict';

describe('Token store service', function () {

  beforeEach(function(){
    var self = this;
    module('contentful/test', function($provide){
      self.authStubs = {
        getTokenLookup: sinon.stub()
      };
      $provide.value('authentication', self.authStubs);

      self.clientStubs = {
        newSpace: sinon.stub()
      };
      $provide.value('client', self.clientStubs);
    });
    inject(function (tokenStore, $q, $rootScope) {
      this.$q = $q;
      this.$rootScope = $rootScope;
      this.user = {firstName: 'hello'};
      this.spaces = [
        {getId: sinon.stub(), update: sinon.stub(), data: {val: 'data'}}
      ];
      this.rawSpaces = [
        {sys: {id: '123'}, data: {val: 'data'}}
      ];

      this.clientStubs.newSpace.returns(this.spaces[0]);
      this.tokenStore = tokenStore;
    });
  });

  it('has no token in default state', function() {
    expect(this.tokenStore.hasToken()).toBeFalsy();
  });

  describe('updates token from a tokenLookup object with existing spaces', function() {
    var newRawSpace;
    beforeEach(function() {
      this.spaces[0].getId.returns('123');
      this.tokenStore._currentToken = {
        spaces: this.spaces
      };
      newRawSpace = {sys: {id: '123'}, data: {val: 'newdata'}};
      this.tokenStore.updateTokenFromTokenLookup({
        sys: {
          createdBy: this.user
        },
        spaces: [newRawSpace]
      });

      this.listener = sinon.spy();
      this.tokenStore.subscribe(this.listener);
    });

    it('updates token', function() {
      sinon.assert.called(this.listener);
    });

    it('updates with spaces', function() {
      sinon.assert.calledWith(this.spaces[0].update, newRawSpace);
    });
  });

  describe('gets updated token', function() {
    it('returns inflight promise if it exists', function() {
      this.tokenStore._inFlightUpdate = this.$q.when();
      expect(this.tokenStore.getUpdatedToken()).toEqual(this.tokenStore._inFlightUpdate);
    });

    describe('if no inflight exists', function() {
      var tokenLookup;
      var promise;
      beforeEach(function() {
        tokenLookup = {sys:{}};
        this.tokenStore.updateTokenFromTokenLookup = sinon.stub();
        this.authStubs.getTokenLookup.returns(this.$q.when(tokenLookup));
        promise = this.tokenStore.getUpdatedToken();
        this.$rootScope.$digest();
      });

      it('returns promise', function() {
        expect(promise.then).toBeDefined();
      });

      it('updates from token lookup', function() {
        sinon.assert.calledWith(this.tokenStore.updateTokenFromTokenLookup, tokenLookup);
      });
    });
  });

});
