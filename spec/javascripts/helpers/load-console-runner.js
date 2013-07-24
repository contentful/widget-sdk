jasmine.getEnv().addReporter(new jasmine.TrivialReporter());
if (navigator.userAgent.match(/phantomjs/i)) {
  var console_reporter = new jasmine.ConsoleReporter();
  jasmine.getEnv().addReporter(console_reporter);
}
