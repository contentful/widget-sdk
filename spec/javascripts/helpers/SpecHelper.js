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

var runner = document.createElement('script');
runner.src = "/__spec__/helpers/console-runner.js";
document.head.appendChild(runner);

var starter = document.createElement('script');
starter.innerText = "var console_reporter = new jasmine.ConsoleReporter();"+
                    "jasmine.getEnv().addReporter(new jasmine.TrivialReporter());"+
                    "jasmine.getEnv().addReporter(console_reporter);";
document.head.appendChild(starter);

