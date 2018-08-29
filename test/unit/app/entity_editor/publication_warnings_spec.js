'use strict';

describe('Publication warnings', () => {
  beforeEach(function() {
    module('contentful/test');
    this.warnings = this.$inject('entityEditor/publicationWarnings').create();
  });

  describe('#register', () => {
    it('registers a warning', function() {
      const warning = { shouldShow: _.noop, priority: 1, getData: _.noop };
      this.warnings.register(warning);
      const list = this.warnings.getList();
      expect(list[0]).toEqual(warning);
      expect(list[0]).not.toBe(warning);
    });

    it('uses defaults', function() {
      this.warnings.register({});
      this.warnings.register({ priority: 100, getData: _.constant('data') });
      const list = this.warnings.getList();
      expect(list[0].priority).toBe(0);
      expect(list[0].getData()).toBe(null);
      expect(list[1].priority).toBe(100);
      expect(list[1].getData()).toBe('data');
    });

    it('returns unregister function', function() {
      const unregister = this.warnings.register({});
      expect(this.warnings.getList().length).toBe(1);
      unregister();
      expect(this.warnings.getList().length).toBe(0);
    });
  });

  describe('#show', () => {
    const Y = _.constant(true);
    const N = _.constant(false);

    beforeEach(function() {
      this.stubs = [
        sinon.stub().resolves(),
        sinon.stub().resolves(),
        sinon.stub().resolves(),
        sinon.stub().resolves()
      ];
    });

    it('resolves if no warning was provided', function() {
      return this.warnings.show().then(_.noop, () => {
        expect().fail('Should resolve');
      });
    });

    it('calls warning functions when predicate returns true', function() {
      this.warnings.register({ shouldShow: Y, warnFn: this.stubs[0] });
      this.warnings.register({ shouldShow: N, warnFn: this.stubs[1] });

      return this.warnings.show().then(() => {
        sinon.assert.calledOnce(this.stubs[0]);
        sinon.assert.notCalled(this.stubs[1]);
      });
    });

    it('calls warnings functions in priority order', function() {
      this.warnings.register({ shouldShow: Y, warnFn: this.stubs[0], priority: 10 });
      this.warnings.register({ shouldShow: Y, warnFn: this.stubs[1], priority: 100 });

      return this.warnings.show().then(() => {
        sinon.assert.callOrder(this.stubs[1], this.stubs[0]);
      });
    });

    it('merges warnings in the same group', function() {
      this.warnings.register({ shouldShow: Y, group: 'x', warnFn: this.stubs[0] });
      this.warnings.register({ shouldShow: Y, group: 'x', warnFn: this.stubs[1], priority: 2 });
      this.warnings.register({ shouldShow: Y, warnFn: this.stubs[2] });
      this.warnings.register({ shouldShow: N, group: 'x', warnFn: this.stubs[3] });

      return this.warnings.show().then(() => {
        sinon.assert.callOrder(this.stubs[1], this.stubs[2]);
        sinon.assert.notCalled(this.stubs[0]);
        sinon.assert.notCalled(this.stubs[3]);
      });
    });

    it('does not call merged warning function if none of predicates return true', function() {
      this.warnings.register({ shouldShow: N, group: 'x', warnFn: this.stubs[0] });
      this.warnings.register({ shouldShow: N, group: 'x', warnFn: this.stubs[0] });

      return this.warnings.show().then(() => {
        sinon.assert.notCalled(this.stubs[0]);
      });
    });

    it('calls merged warning function with an array of warning items', function() {
      this.warnings.register({ shouldShow: N, group: 'x' });
      this.warnings.register({
        shouldShow: Y,
        group: 'x',
        getData: _.constant('latter'),
        priority: -1
      });
      this.warnings.register({
        shouldShow: Y,
        group: 'x',
        getData: _.constant('former'),
        warnFn: this.stubs[0]
      });

      return this.warnings.show().then(() => {
        sinon.assert.calledOnce(this.stubs[0].withArgs(['former', 'latter']));
      });
    });
  });
});
