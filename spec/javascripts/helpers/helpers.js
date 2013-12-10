'use strict';

beforeEach(function() {
  this.addMatchers({
    toLookEqual: function (other) {
      return angular.equals(this.actual, other);
    }
  });
});

window.scope = function(elem) {
  return angular.element(elem).scope();
};

window.setupCfCanStubs = function ($provide, reasonsStub) {
  $provide.value('reasonsDenied', reasonsStub);
  $provide.value('authorization', {
    spaceContext: {
      space: {
        sys: { createdBy: { sys: {id: 123} } }
      }
    }
  });
  var userStub = sinon.stub();
  userStub.returns({ sys: {id: 123} });
  $provide.value('authentication', {
    getUser: userStub
  });
};
