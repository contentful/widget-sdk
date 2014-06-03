/*global performance*/
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

    toBeCalledOnce: function () {
      return {
        compare: function (actual) {
          var pass = actual.calledOnce;
          var notText = pass ? 'not ' : '';
          return {
            pass: pass,
            message: 'Expected stub ' + notText + 'to be called once'
          };
        }
      };
    },

    toBeCalledTwice: function () {
      return {
        compare: function (actual) {
          var pass = actual.calledTwice;
          var notText = pass ? 'not ' : '';
          return {
            pass: pass,
            message: 'Expected stub ' + notText + 'to be called twice'
          };
        }
      };
    },

    toBeCalledThrice: function () {
      return {
        compare: function (actual) {
          var pass = actual.calledThrice;
          var notText = pass ? 'not ' : '';
          return {
            pass: pass,
            message: 'Expected stub ' + notText + 'to be called thrice'
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
            message: 'Expected stub ' + notText + 'to be called with '+args+' but was called with '+actual.args
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
});
