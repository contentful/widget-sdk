import _ from 'lodash';
import { create as createWarning } from 'app/entity_editor/PublicationWarnings.es6';

describe('Publication warnings', () => {
  let warnings;
  beforeEach(function() {
    warnings = createWarning();
  });

  describe('#register', () => {
    it('registers a warning', function() {
      const warning = { shouldShow: _.noop, priority: 1, getData: _.noop };
      warnings.register(warning);
      const list = warnings.getList();
      expect(list[0]).toEqual(warning);
      expect(list[0]).not.toBe(warning);
    });

    it('uses defaults', function() {
      warnings.register({});
      warnings.register({ priority: 100, getData: _.constant('data') });
      const list = warnings.getList();
      expect(list[0].priority).toBe(0);
      expect(list[0].getData()).toBeNull();
      expect(list[1].priority).toBe(100);
      expect(list[1].getData()).toBe('data');
    });

    it('returns unregister function', function() {
      const unregister = warnings.register({});
      expect(warnings.getList()).toHaveLength(1);
      unregister();
      expect(warnings.getList()).toHaveLength(0);
    });
  });

  describe('#show', () => {
    const Y = _.constant(true);
    const N = _.constant(false);
    let stubs;

    beforeEach(function() {
      stubs = [
        jest.fn(() => Promise.resolve()),
        jest.fn(() => Promise.resolve()),
        jest.fn(() => Promise.resolve()),
        jest.fn(() => Promise.resolve())
      ];
    });

    it('resolves if no warning was provided', function() {
      expect(warnings.show()).resolves.toEqual(undefined);
    });

    it('calls warning functions when predicate returns true', function() {
      warnings.register({ shouldShow: Y, warnFn: stubs[0] });
      warnings.register({ shouldShow: N, warnFn: stubs[1] });

      return warnings.show().then(() => {
        expect(stubs[0]).toBeCalledTimes(1);
        expect(stubs[1]).not.toBeCalled();
      });
    });

    it('calls warnings functions in priority order', async () => {
      warnings.register({ shouldShow: Y, warnFn: stubs[0], priority: 10 });
      warnings.register({ shouldShow: Y, warnFn: stubs[1], priority: 100 });

      await expect(warnings.show()).resolves.toEqual(undefined);

      expect(stubs[1]).toHaveBeenCalledBefore(stubs[0]);
    });

    it('merges warnings in the same group', async () => {
      warnings.register({ shouldShow: Y, group: 'x', warnFn: stubs[0] });
      warnings.register({ shouldShow: Y, group: 'x', warnFn: stubs[1], priority: 2 });
      warnings.register({ shouldShow: Y, warnFn: stubs[2] });
      warnings.register({ shouldShow: N, group: 'x', warnFn: stubs[3] });

      await expect(warnings.show()).resolves.toEqual(undefined);

      expect(stubs[1]).toHaveBeenCalledBefore(stubs[2]);
      expect(stubs[0]).not.toHaveBeenCalled();
      expect(stubs[3]).not.toHaveBeenCalled();
    });

    it('does not call merged warning function if none of predicates return true', async () => {
      warnings.register({ shouldShow: N, group: 'x', warnFn: stubs[0] });
      warnings.register({ shouldShow: N, group: 'x', warnFn: stubs[0] });

      await expect(warnings.show()).resolves.toEqual(undefined);

      expect(stubs[0]).not.toHaveBeenCalled();
    });

    it('calls merged warning function with an array of warning items', async () => {
      warnings.register({ shouldShow: N, group: 'x' });
      warnings.register({
        shouldShow: Y,
        group: 'x',
        getData: _.constant('latter'),
        priority: -1
      });
      warnings.register({
        shouldShow: Y,
        group: 'x',
        getData: _.constant('former'),
        warnFn: stubs[0]
      });

      await expect(warnings.show()).resolves.toEqual(undefined);

      expect(stubs[0]).toHaveBeenCalledWith(['former', 'latter']);
    });
  });
});
