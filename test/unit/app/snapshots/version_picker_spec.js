'use strict';

describe('versionPicker', () => {
  beforeEach(function () {
    module('contentful/test');
    this.picker = this.$inject('SnapshotComparatorController/versionPicker').create();
  });

  describe('versionPicker#create()', () => {
    it('does not restore anything', function () {
      expect(this.picker.getPathsToRestore()).toEqual([]);
    });

    it('has no differences registered', function () {
      expect(this.picker.getDifferenceCount()).toBe(0);
    });
  });

  describe('#registerPath', () => {
    it('registers differences', function () {
      this.picker.registerPath({isDifferent: true});
      this.picker.registerPath({isDifferent: false});
      this.picker.registerPath({isDifferent: true});
      expect(this.picker.getDifferenceCount()).toBe(2);
    });

    it('registers "restoring" function', function () {
      const fn1 = sinon.spy();
      const fn2 = sinon.spy();
      this.picker.registerPath({restoreFn: fn1});
      this.picker.registerPath({restoreFn: fn2});
      this.picker.registerPath({restoreFn: undefined});
      this.picker.restoreAll();
      sinon.assert.calledOnce(fn1);
      sinon.assert.calledOnce(fn2);
    });
  });

  describe('#restore', () => {
    it('marks path as "to be restored"', function () {
      this.picker.restore(['some', 'path']);
      expect(this.picker.getPathsToRestore()).toEqual([['some', 'path']]);
      this.picker.restore(['other', 'path']);
      expect(this.picker.getPathsToRestore()).toEqual([
        ['some', 'path'],
        ['other', 'path']
      ]);
    });

    it('does not add duplicates', function () {
      this.picker.restore(['some', 'path']);
      this.picker.restore(['some', 'path']);
      expect(this.picker.getPathsToRestore()).toEqual([['some', 'path']]);
    });
  });

  describe('#keep', () => {
    it('removes path from list of "paths to be restored"', function () {
      this.picker.restore(['path', 'one']);
      this.picker.restore(['path', 'two']);
      this.picker.keep(['path', 'one']);
      expect(this.picker.getPathsToRestore()).toEqual([['path', 'two']]);
    });

    it('ignores when marking as kept twice', function () {
      this.picker.restore(['some', 'path']);
      this.picker.keep(['some', 'path']);
      this.picker.keep(['some', 'path']);
      expect(this.picker.getPathsToRestore()).toEqual([]);
    });

    it('marks all as kept when using #keepAll', function () {
      this.picker.restore(['some', 'path']);
      this.picker.keepAll();
      expect(this.picker.getPathsToRestore()).toEqual([]);
    });
  });
});
