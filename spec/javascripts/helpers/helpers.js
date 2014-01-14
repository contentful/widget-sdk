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
    },

    toBeCalled: function () {
      return {
        compare: function (actual) {
          var pass = actual.called;
          var notText = pass ? 'not ' : '';
          return {
            pass: pass,
            message: 'Expected stub ' + notText + 'to be called'
          };
        }
      };
    },

    toBeCalledWith: function () {
      return {
        compare: function (actual) {
          var args = Array.prototype.slice.call(arguments, 1, arguments.length);
          var pass = actual.calledWith.apply(actual, args);
          var notText = pass ? 'not ' : '';
          return {
            pass: pass,
            message: 'Expected stub ' + notText + 'to be called with supplied args'
          };
        }
      };
    },

    toHaveTagName: function () {
      return {
        compare: function (actual, expected) {
          var pass, tag;
          if(actual.tagName){
            tag = actual.tagName.toLowerCase();
          } else if(actual.get && actual.get(0) && actual.get(0).tagName){
            tag = actual.get(0).tagName.toLowerCase();
          }
          pass = tag && tag === expected;
          var notText = pass ? 'not ' : '';
          return {
            pass: pass,
            message: 'Expected element with tag '+tag+' '+notText+'to have tag name '+expected
          };
        }
      };
    },

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
