import { useMemo } from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { id as randomId } from 'utils/Random';
import { useSelection } from './useSelection';

const entry = () => ({ sys: { type: 'Entry', id: randomId() } });

/*
  For this test we rely on useMemo to avoid infinite re-renders
*/
describe('useSelection hook', () => {
  it('should expose the interface', () => {
    const entries = new Array(10).fill(0).map(() => entry());
    const { result } = renderHook(() => {
      const entities = useMemo(() => entries, []);
      return useSelection({
        entities,
        multipleSelection: true,
      });
    });

    const { lastToggledIndex, toggle, isSelected, selectedEntities } = result.current;

    expect(lastToggledIndex).toBeUndefined();
    expect(typeof toggle).toBe('function');
    expect(typeof isSelected).toBe('function');
    expect(typeof selectedEntities).toBe('object');
  });

  describe('toggle', () => {
    it('should toggle the given entity [single mode]', () => {
      const entries = [entry()];
      const { result } = renderHook(() => {
        return useSelection({
          multipleSelection: false,
        });
      });

      act(() => {
        const { toggle } = result.current;
        const selectedEntities = toggle(entries[0]);
        expect(selectedEntities).toEqual(entries);
      });

      const { selectedEntities, isSelected } = result.current;

      expect(selectedEntities).toEqual(entries);
      expect(isSelected(entries[0])).toEqual(true);

      act(() => {
        const { toggle } = result.current;
        const selectedEntities = toggle(entries[0]);
        expect(selectedEntities).toEqual([]);
      });

      expect(result.current.selectedEntities).toEqual([]);
      expect(result.current.isSelected(entries[0])).toEqual(false);
    });

    describe('multiSelection: false', () => {
      it('should throw if attempted to select multiple items', () => {
        const entries = [entry(), entry()];
        const { result } = renderHook(() => {
          return useSelection({
            multipleSelection: false,
          });
        });

        act(() => {
          const { toggle, isSelected, selectedEntities } = result.current;
          expect(() => {
            toggle(entries);
          }).toThrowError('Attempted to select multiple entities with multiSelection: false');
          expect(selectedEntities).toEqual([]);
          expect(isSelected(entries[0])).toBe(false);
          expect(isSelected(entries[1])).toBe(false);
        });
      });
    });

    describe('multiSelection: true', () => {
      it('should allow to toggle only one item', () => {
        const entries = [entry()];
        const { result } = renderHook(() => {
          return useSelection({
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
          return useSelection({
            multipleSelection: true,
          });
        });

        act(() => {
          const { toggle } = result.current;
          const selectedEntities = toggle(entries.slice(0, 2), 0);
          expect(selectedEntities).toEqual(entries.slice(0, 2));
        });

        expect(result.current.lastToggledIndex).toBe(0);
        expect(result.current.selectedEntities).toEqual(entries.slice(0, 2));
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
        expect(result.current.selectedEntities).toEqual(entries);
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
        expect(result.current.selectedEntities).toEqual(entries.slice(1));
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
        expect(result.current.selectedEntities).toEqual([entries[3]]);
        expect(result.current.isSelected(entries[0])).toBe(false);
        expect(result.current.isSelected(entries[1])).toBe(false);
        expect(result.current.isSelected(entries[2])).toBe(false);
        expect(result.current.isSelected(entries[3])).toBe(true);
      });
    });

    it('should keep the order in which the items were selected', () => {
      const entries = [entry(), entry(), entry(), entry()];
      const { result } = renderHook(() => {
        return useSelection({
          multipleSelection: true,
        });
      });

      // selecting last item
      act(() => {
        const { toggle } = result.current;
        const selectedEntities = toggle(entries[entries.length - 1], entries.length - 1);
        expect(selectedEntities).toEqual([entries[entries.length - 1]]);
      });

      expect(result.current.selectedEntities).toEqual([entries[entries.length - 1]]);

      // batch selecting items 1, 2
      act(() => {
        const { toggle } = result.current;
        const selectedEntities = toggle(entries.slice(1, 3), 1);
        expect(selectedEntities).toEqual([entries[entries.length - 1], entries[1], entries[2]]);
      });

      expect(result.current.selectedEntities).toEqual([
        entries[entries.length - 1],
        entries[1],
        entries[2],
      ]);

      // selecting item 0
      act(() => {
        const { toggle } = result.current;
        const selectedEntities = toggle(entries[0], 0);
        expect(selectedEntities).toEqual([
          entries[entries.length - 1],
          entries[1],
          entries[2],
          entries[0],
        ]);
      });

      expect(result.current.selectedEntities).toEqual([
        entries[entries.length - 1],
        entries[1],
        entries[2],
        entries[0],
      ]);

      // deselecting item 2
      act(() => {
        const { toggle } = result.current;
        const selectedEntities = toggle(entries[2], 2);
        expect(selectedEntities).toEqual([entries[entries.length - 1], entries[1], entries[0]]);
      });

      expect(result.current.selectedEntities).toEqual([
        entries[entries.length - 1],
        entries[1],
        entries[0],
      ]);

      // batch selecting items 2 and checking that it's added to the end of the selected array
      act(() => {
        const { toggle } = result.current;
        const selectedEntities = toggle(entries[2], 2);
        expect(selectedEntities).toEqual([
          entries[entries.length - 1],
          entries[1],
          entries[0],
          entries[2],
        ]);
      });

      expect(result.current.selectedEntities).toEqual([
        entries[entries.length - 1],
        entries[1],
        entries[0],
        entries[2],
      ]);

      // deselecting item 2 to switch into DESELECT mode
      act(() => {
        const { toggle } = result.current;
        const selectedEntities = toggle(entries[2], 2);
        expect(selectedEntities).toEqual([entries[entries.length - 1], entries[1], entries[0]]);
      });

      expect(result.current.selectedEntities).toEqual([
        entries[entries.length - 1],
        entries[1],
        entries[0],
      ]);

      // batch deselecting items 0, 1, 2
      act(() => {
        const { toggle } = result.current;
        const selectedEntities = toggle(entries.slice(0, 3), 0);
        expect(selectedEntities).toEqual([entries[entries.length - 1]]);
      });

      expect(result.current.selectedEntities).toEqual([entries[entries.length - 1]]);
    });
  });

  describe('isSelected', () => {
    it('should return false if entity is not an entity', () => {
      const { result } = renderHook(() => {
        return useSelection({
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
