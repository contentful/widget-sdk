/*global performance */
'use strict';

var timingReporter = {
  suites: [{
    id: 'root',
    description: 'Entire Suite',
    children: []
  }],
  getCurrentSuite: function () {
    return _.last(this.suites);
  },
  jasmineStarted: function(){
    this.getCurrentSuite().start = performance.now();
  },
  jasmineDone: function(){
    this.lastSuite.stop = performance.now();
    this.lastSuite.length = this.lastSuite.stop - this.lastSuite.start;
    sortChildren(this.lastSuite);
    printThing(this.lastSuite);

    function printThing(thing) {
      if (thing.children) {
        console.groupCollapsed('%ims %o', thing.length, thing.description);
        _.each(thing.children, printThing);
        console.groupEnd();
      } else {
        console.log('%ims %o', thing.length, thing.description);
      }
    }

    function sortChildren(thing) {
      if (thing.children) {
        thing.children = _.sortBy(thing.children, function (child) {
          return -child.length;
        });
        _.each(thing.children, function (child) {
          sortChildren(child);
        });
      }
    }
  },
  suiteStarted: function(result){
    result.start = performance.now();
    result.children = [];
    this.getCurrentSuite().children.push(result);
    this.suites.push(result);
  },
  suiteDone: function(result){
    result.stop = performance.now();
    result.length = result.stop - result.start;
    this.lastSuite = this.suites.pop();
  },
  specStarted: function(result){
    var suite = this.getCurrentSuite();
    result.start = performance.now();
    suite.children.push(result);
  },
  specDone: function(result){
    result.stop = performance.now();
    result.length = result.stop - result.start;
  },
};

// uncomment for gathering spec performance
//jasmine.getEnv().addReporter(timingReporter);

beforeEach(function() {

  this.$inject = function(serviceName){
    if (!this.$injector) {
      var self = this;
      inject(function($injector){
        self.$injector = $injector;
      });
    }
    return this.$injector.get(serviceName);
  };

  this.$apply = function(){
    this.$inject('$rootScope').$apply();
  };

  this.when = function(val){
    return this.$inject('$q').when(val);
  };

  this.reject = function(val){
    return this.$inject('$q').reject(val);
  };

  jasmine.addMatchers({

    toLookEqual: function() {
      return {
        compare: function (actual, expected) {
          return {
            pass: angular.equals(actual, expected),
            message: 'Expected ' + JSON.stringify(actual) + ' to look equal to ' + JSON.stringify(expected)
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

    toBeInstanceOf: function() {
      return {
        compare: function(actual, expected) {
          var pass, notText;

          pass    = (actual instanceof expected);
          notText = pass ? ' not' : '';

          return {
            pass    : pass,
            message : 'Expected ' + actual.constructor.name + notText + ' to be an instance of ' + expected.name
          };
        }
      };
    },

    toEqualObj: function () {
      var KINDS = {
        'N': 'newly added property/element',
        'D': 'property/element was deleted',
        'E': 'property/element was edited',
        'A': 'change occurred within an array'
      };

      function formatDiff(objdiff) {
        return objdiff.map(function (diff) {
          return '\t'+diff.kind +' at '+ diff.path.join('.') +'\n'+
                 '\t'+diff.actual +' should be '+ diff.expected;
        }).join('\n\n');
      }

      return {
        compare: function (actual, expected) {
          var objdiff = (deepDiff(expected, actual) || []).map(function (diff) {
            return {
              kind: KINDS[diff.kind],
              path: diff.path,
              expected: diff.lhs,
              actual: diff.rhs
            };
          });

          //console.log(actual, expected, objdiff);
          return {
            pass    : objdiff.length === 0,
            message : 'Expected object not to have differences\n\n' + formatDiff(objdiff)
          };

        }
      };
    }

  });
});
