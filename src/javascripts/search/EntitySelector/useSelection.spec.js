import { useMemo } from 'react';
import { renderHook, cleanup, act } from '@testing-library/react-hooks';
import { id as randomId } from 'utils/Random';
import useSelection from './useSelection';

const entry = () => ({ sys: { type: 'Entry', id: randomId() } });

/*
  For this test we rely on useMemo to avoid infinite re-renders
*/
describe('useSelection hook', () => {
  afterEach(cleanup);

  it('should expose the interface', () => {
    const entries = new Array(10).fill(0).map(() => entry());
    const { result } = renderHook(() => {
      const entities = useMemo(() => entries, []);
      return useSelection({
        entities,
        multipleSelection: true,
      });
    });

    const { lastToggledIndex, toggle, isSelected, getSelectedEntities } = result.current;

    expect(lastToggledIndex).toBeUndefined();
    expect(typeof toggle).toBe('function');
    expect(typeof isSelected).toBe('function');
    expect(typeof getSelectedEntities).toBe('function');
  });

  describe('toggle', () => {
    it('should toggle the given entity [single mode]', () => {
      const entries = [entry()];
      const { result } = renderHook(() => {
        const entities = useMemo(() => entries, []);
        return useSelection({
          entities,
          multipleSelection: false,
        });
      });

      act(() => {
        const { toggle } = result.current;
        const selectedEntities = toggle(entries[0]);
        expect(selectedEntities).toEqual(entries);
      });

      const { getSelectedEntities, isSelected } = result.current;

      expect(getSelectedEntities()).toEqual(entries);
      expect(isSelected(entries[0])).toEqual(true);

      act(() => {
        const { toggle } = result.current;
        const selectedEntities = toggle(entries[0]);
        expect(selectedEntities).toEqual([]);
      });

      expect(result.current.getSelectedEntities()).toEqual([]);
      expect(result.current.isSelected(entries[0])).toEqual(false);
    });

    describe('multiSelection: false', () => {
      it('should throw if attempted to select multiple items', () => {
        const entries = [entry(), entry()];
        const { result } = renderHook(() => {
          const entities = useMemo(() => entries, []);
          return useSelection({
            entities,
            multipleSelection: false,
          });
        });

        act(() => {
          const { toggle, isSelected, getSelectedEntities } = result.current;
          expect(() => {
            toggle(entries);
          }).toThrowError('Attempted to select multiple entities with multiSelection: false');
          expect(getSelectedEntities()).toEqual([]);
          expect(isSelected(entries[0])).toBe(false);
          expect(isSelected(entries[1])).toBe(false);
        });
      });
    });

    describe('multiSelection: true', () => {
      it('should allow to toggle only one item', () => {
        const entries = [entry()];
        const { result } = renderHook(() => {
          const entities = useMemo(() => entries, []);
          return useSelection({
            entities,
            multipleSelection: true,
          });
        });

        act(() => {
          const { toggle } = result.current;
          const selectedEntities = toggle(entries[0]);
          expect(selectedEntities).toEqual(entries);
        });

        act(() => {
          const { toggle } = result.current;
          const selectedEntities = toggle(entries[0]);
          expect(selectedEntities).toEqual([]);
        });
      });

      it('should allow to select multiple items in batches', () => {
        const entries = [entry(), entry(), entry(), entry()];
        const { result } = renderHook(() => {
          const entities = useMemo(() => entries, []);
          return useSelection({
            entities,
            multipleSelection: true,
          });
        });

        act(() => {
          const { toggle } = result.current;
          const selectedEntities = toggle(entries.slice(0, 2), 0);
          expect(selectedEntities).toEqual(entries.slice(0, 2));
        });

        expect(result.current.lastToggledIndex).toBe(0);
        expect(result.current.getSelectedEntities()).toEqual(entries.slice(0, 2));
        expect(result.current.isSelected(entries[0])).toBe(true);
        expect(result.current.isSelected(entries[1])).toBe(true);
        expect(result.current.isSelected(entries[2])).toBe(false);
        expect(result.current.isSelected(entries[3])).toBe(false);

        act(() => {
          const { toggle } = result.current;
          const selectedEntities = toggle(entries.slice(2), 2);
          expect(selectedEntities).toEqual(entries);
        });

        expect(result.current.lastToggledIndex).toBe(2);
        expect(result.current.getSelectedEntities()).toEqual(entries);
        expect(result.current.isSelected(entries[0])).toBe(true);
        expect(result.current.isSelected(entries[1])).toBe(true);
        expect(result.current.isSelected(entries[2])).toBe(true);
        expect(result.current.isSelected(entries[3])).toBe(true);

        act(() => {
          const { toggle } = result.current;
          const selectedEntities = toggle(entries[0], 0);
          expect(selectedEntities).toEqual(entries.slice(1));
        });

        expect(result.current.lastToggledIndex).toBe(0);
        expect(result.current.getSelectedEntities()).toEqual(entries.slice(1));
        expect(result.current.isSelected(entries[0])).toBe(false);
        expect(result.current.isSelected(entries[1])).toBe(true);
        expect(result.current.isSelected(entries[2])).toBe(true);
        expect(result.current.isSelected(entries[3])).toBe(true);

        act(() => {
          const { toggle } = result.current;
          const selectedEntities = toggle(entries.slice(1, 3), 1);
          expect(selectedEntities).toEqual([entries[3]]);
        });

        expect(result.current.lastToggledIndex).toBe(1);
        expect(result.current.getSelectedEntities()).toEqual([entries[3]]);
        expect(result.current.isSelected(entries[0])).toBe(false);
        expect(result.current.isSelected(entries[1])).toBe(false);
        expect(result.current.isSelected(entries[2])).toBe(false);
        expect(result.current.isSelected(entries[3])).toBe(true);
      });
    });
  });

  describe('isSelected', () => {
    it('should return false if entity is not an entity', () => {
      const { result } = renderHook(() => {
        const entities = useMemo(() => [], []);
        return useSelection({
          entities,
          multipleSelection: true,
        });
      });

      const { isSelected } = result.current;

      expect(isSelected(false)).toBe(false);
      expect(isSelected(0)).toBe(false);
      expect(isSelected(undefined)).toBe(false);
      expect(isSelected(null)).toBe(false);
      expect(isSelected(NaN)).toBe(false);
      expect(isSelected(Infinity)).toBe(false);
      expect(isSelected({})).toBe(false);
      expect(
        isSelected({
          sys: null,
        })
      ).toBe(false);
    });
  });
});