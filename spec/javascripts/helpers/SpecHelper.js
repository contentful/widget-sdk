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


