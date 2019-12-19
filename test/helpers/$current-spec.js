beforeEach(function() {
  window.$$currentSpec = this;
});

afterEach(function() {
  window.$$currentSpec = undefined;
});
