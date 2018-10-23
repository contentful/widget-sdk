import sinon from 'sinon';
import * as versionPicker from './VersionPicker.es6';

describe('snapshots/VersionPicker', () => {
  let picker;

  beforeEach(() => {
    picker = versionPicker.create();
  });

  describe('versionPicker#create()', () => {
    it('does not restore anything', function() {
      expect(picker.getPathsToRestore()).toEqual([]);
    });

    it('has no differences registered', function() {
      expect(picker.getDifferenceCount()).toBe(0);
    });
  });

  describe('#registerPath', () => {
    it('registers differences', function() {
      picker.registerPath({ isDifferent: true });
      picker.registerPath({ isDifferent: false });
      picker.registerPath({ isDifferent: true });
      expect(picker.getDifferenceCount()).toBe(2);
    });

    it('registers "restoring" function', function() {
      const fn1 = sinon.spy();
      const fn2 = sinon.spy();
      picker.registerPath({ restoreFn: fn1 });
      picker.registerPath({ restoreFn: fn2 });
      picker.registerPath({ restoreFn: undefined });
      picker.restoreAll();
      expect(fn1.calledOnce).toBe(true);
      expect(fn2.calledOnce).toBe(true);
    });
  });

  describe('#restore', () => {
    it('marks path as "to be restored"', function() {
      picker.restore(['some', 'path']);
      expect(picker.getPathsToRestore()).toEqual([['some', 'path']]);
      picker.restore(['other', 'path']);
      expect(picker.getPathsToRestore()).toEqual([['some', 'path'], ['other', 'path']]);
    });

    it('does not add duplicates', function() {
      picker.restore(['some', 'path']);
      picker.restore(['some', 'path']);
      expect(picker.getPathsToRestore()).toEqual([['some', 'path']]);
    });
  });

  describe('#keep', () => {
    it('removes path from list of "paths to be restored"', function() {
      picker.restore(['path', 'one']);
      picker.restore(['path', 'two']);
      picker.keep(['path', 'one']);
      expect(picker.getPathsToRestore()).toEqual([['path', 'two']]);
    });

    it('ignores when marking as kept twice', function() {
      picker.restore(['some', 'path']);
      picker.keep(['some', 'path']);
      picker.keep(['some', 'path']);
      expect(picker.getPathsToRestore()).toEqual([]);
    });

    it('marks all as kept when using #keepAll', function() {
      picker.restore(['some', 'path']);
      picker.keepAll();
      expect(picker.getPathsToRestore()).toEqual([]);
    });
  });
});
