'use strict';

describe('navigation/DocumentTitle', () => {
  beforeEach(function() {
    this.currentState = {};
    this.document = { title: 'initial' };

    module('contentful/test', $provide => {
      $provide.value('$state', { current: this.currentState });
      $provide.value('$document', [this.document]);
    });

    this.dt = this.$inject('navigation/DocumentTitle');
  });

  describe('#init', () => {
    it('does not set title if not initialized', function() {
      this.currentState.label = 'boo';
      this.$apply();
      expect(this.document.title).toBe('initial');
    });

    it('sets the title if initialized', function() {
      this.currentState.label = 'boo';
      this.dt.init();
      this.$apply();
      expect(this.document.title).toBe('boo');
    });

    it('changes titles after initialization', function() {
      this.dt.init();
      this.currentState.label = 'foo';
      this.$apply();
      expect(this.document.title).toBe('foo');
      this.currentState.label = 'bar';
      this.$apply();
      expect(this.document.title).toBe('bar');
    });
  });

  describe('#setTitle', () => {
    it('sets the title', function() {
      this.dt.setTitle('xxx');
      expect(this.document.title).toBe('xxx');
      this.dt.setTitle('yyy');
      expect(this.document.title).toBe('yyy');
    });

    it('falls back to the app name', function() {
      this.dt.setTitle(undefined);
      expect(this.document.title).toBe('Contentful');
    });
  });

  describe('#maybeOverride', () => {
    it('overrides the title if string', function() {
      expect(this.document.title).not.toBe('test');
      this.dt.maybeOverride('test');
      expect(this.document.title).toBe('test');
    });

    it('does not override if not a valid title', function() {
      this.dt.setTitle('hello');
      this.dt.maybeOverride(null);
      expect(this.document.title).toBe('hello');
    });
  });
});
