/*global performance */
'use strict';

// uncomment for gathering spec performance
// jasmine.getEnv().addReporter(createTimingReporter());

// jshint unused: false
function createTimingReporter () {
  return {
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

  function printThing(thing) {
    if (thing.children) {
      console.groupCollapsed(format(thing.length, thing.description));
      _.each(thing.children, printThing);
      console.groupEnd();
    } else {
      console.log(format(thing.length, thing.description));
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

  function format (timing, desc) {
    var seconds = timing / 1000;
    return seconds.toFixed(3) + 's: ' + desc;
  }

}
