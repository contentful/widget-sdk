'use strict';

describe('bugsnag', function(){
  beforeEach(function(){
    module('contentful/test');
    this.bugsnag = this.$inject('bugsnag');
    this.$window = this.$inject('$window');
    this.angularLoad = this.$inject('angularLoad');
    var $q = this.$inject('$q');

    this.BugsnagStub = {
      notify: sinon.stub(),
      notifyException: sinon.stub(),
      refresh: sinon.stub()
    };

    this.angularLoad.loadScript = function () {
      this.$window.Bugsnag = this.BugsnagStub;
      return $q.resolve();
    }.bind(this);
  });

  afterEach(function(){
    delete this.$window.Bugsnag;
  });

  it('should enable', function(done) {
    this.bugsnag.enable().then(function(){
      expect(this.$window.Bugsnag).toBe(this.BugsnagStub);
      done();
    }.bind(this));
    this.$apply();
  });

  pit('should disable', function(){
    this.bugsnag.disable();
    return this.bugsnag.enable()
    .catch(function () {})
    .finally(function(){
      expect(this.$window.Bugsnag).toBe(undefined);
    }.bind(this));
  });

  describe('when script loading fails', function(){
    beforeEach(function(){
      this.angularLoad.loadScript = sinon.stub().rejects();
    });

    it('#notify() does not throw', function(){
      this.bugsnag.enable();
      this.$apply();
      this.bugsnag.notify();
    });
  });

  it('buffers calls to bugsnag and runs them when enabled', function(){
    this.bugsnag.notify('foo');
    this.bugsnag.enable();
    this.$apply(); // Bugsnag done loading
    expect(this.$window.Bugsnag.notify.args[0][0]).toBe('foo');
    this.bugsnag.notify('bar');
    expect(this.$window.Bugsnag.notify.args[1][0]).toBe('bar');
  });
});
