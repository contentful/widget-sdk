if (navigator.userAgent.match(/phantomjs/i)) {
  jasmine.getEnv().addReporter(new jasmine.TrivialReporter());
  var console_reporter = new jasmine.ConsoleReporter();
  jasmine.getEnv().addReporter(console_reporter);
}
