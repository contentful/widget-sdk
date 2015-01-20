'use strict';

describe('userCache', function(){
  beforeEach(function(){
    module('contentful/test');
    this.cache = this.$inject('userCache');
    this.$q    = this.$inject('$q');
    this.space = {
      getUsers: sinon.stub()
    };
  });

  it('returns a user from remote', function(){
    this.space.getUsers.returns(this.$q.when([
      {getId: _.constant('alice')},
      {getId: _.constant('bob')}
    ]));

    this.cache.get(this.space, 'alice')
    .then(function(user){
      expect(user.getId()).toBe('alice');
    });
    
    this.$apply();
  });
});

