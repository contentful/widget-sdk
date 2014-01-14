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

  jasmine.addMatchers({

    toLookEqual: function() {
      return {
        compare: function (actual, expected) {
          return {
            pass: angular.equals(actual, expected),
            message: 'Expected ' + actual + ' to look equal to ' + expected
          };
        }
      };
    },

    toHaveClass: function () {
      return {
        compare: function (actual, expected) {
          var pass = actual.hasClass(expected);
          var notText = pass ? 'not ' : '';
          return {
            pass: pass,
            message: 'Expected element ' + notText + 'to have class '+expected
          };
        }
      };
    },

    toBeNgHidden: function () {
      return {
        compare: function (actual) {
          var pass = actual.hasClass('ng-hide');
          var notText = pass ? 'not ' : '';
          return {
            pass: pass,
            message: 'Expected element ' + notText + 'to be ng-hidden'
          };
        }
      };
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
