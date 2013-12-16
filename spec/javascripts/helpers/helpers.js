/*global performance*/
'use strict';

// uncomment for gathering spec performance
/*
window.specPerformance = window.specPerformance || {
  results: [],
  sorted: function () {
    return window.specPerformance.results.sort(function(a,b){return a.time > b.time;});
  }
};
*/


beforeEach(function() {
  this.addMatchers({
    toLookEqual: function (other) {
      return angular.equals(this.actual, other);
    }
  });
  if(window.specPerformance){
    this.performanceStart = performance.now();
  }
});

afterEach(function() {
  function specName(spec) {
    var name = '';
    if(spec.suite.description){
      name += spec.suite.description;
    }
    var parent, previousParent;
    while(parent = (spec.suite && spec.suite.parentSuite || parent && parent.parentSuite)){
      if(parent && previousParent && parent.description == previousParent.description) break;
      previousParent = parent;
      name = parent.description+ ' ' +name;
    }
    return name + ' ' + spec.description;
  }

  if(window.specPerformance){
    var spec = {
      desc: specName(jasmine.getEnv().currentSpec),
      time: (performance.now() - this.performanceStart)/1000
    };
    window.specPerformance.results.push(spec);
    console.log(spec.desc, spec.time);
  }
});

window.scope = function(elem) {
  return angular.element(elem).scope();
};

