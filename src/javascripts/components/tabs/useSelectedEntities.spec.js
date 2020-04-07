import { renderHook, act } from '@testing-library/react-hooks';
import useSelectedEntities from './useSelectedEntities';

const initial = [
  { id: '1', getId: () => '1' },
  { id: '2', getId: () => '2' },
  { id: '3', getId: () => '3' },
  { id: '4', getId: () => '4' },
];

const initHook = (initialEntities) => {
  return renderHook((entities = initialEntities) => useSelectedEntities({ entities }));
};

describe('useSelectedEntities', () => {
  it('should initialize the selected entities', () => {
    const { result } = initHook(initial);

    const [{ selected, allSelected }] = result.current;

    expect(allSelected).toBe(false);
    expect(selected).toEqual([]);
  });

  it('should omit non existing entity ids in selected', () => {
    const { result, rerender } = initHook(initial);

    const [, actions] = result.current;
    act(actions.toggleAllSelected);

    expect(result.current[0].allSelected).toBe(true);
    expect(result.current[0].selected).toEqual(initial);

    const lessEntities = [initial[0], initial[2]];
    rerender(lessEntities);
    expect(result.current[0].allSelected).toBe(true);
    expect(result.current[0].selected).toEqual(lessEntities);

    rerender(initial);
    expect(result.current[0].allSelected).toBe(false);
    expect(result.current[0].selected).toEqual(lessEntities);
  });

  it('should toggle all selected', () => {
    const { result } = initHook(initial);

    expect(result.current[0].allSelected).toBe(false);
    expect(result.current[0].selected).toEqual([]);

    act(result.current[1].toggleAllSelected);

    expect(result.current[0].allSelected).toBe(true);
    expect(result.current[0].selected).toEqual(initial);

    act(result.current[1].toggleAllSelected);

    expect(result.current[0].allSelected).toBe(false);
    expect(result.current[0].selected).toEqual([]);
  });

  it('should toggle one but leave others selected', () => {
    const { result } = initHook(initial);

    expect(result.current[0].allSelected).toBe(false);
    expect(result.current[0].selected).toEqual([]);

    const [, entityOne, entityTwo] = initial;
    act(() => result.current[1].toggleSelected(entityOne));

    expect(result.current[0].allSelected).toBe(false);
    expect(result.current[0].selected).toEqual([entityOne]);
    expect(result.current[1].isSelected(entityOne)).toBe(true);

    act(() => result.current[1].toggleSelected(entityTwo));

    expect(result.current[0].allSelected).toBe(false);
    expect(result.current[0].selected).toEqual([entityOne, entityTwo]);
    expect(result.current[1].isSelected(entityOne)).toBe(true);
    expect(result.current[1].isSelected(entityTwo)).toBe(true);

    act(() => result.current[1].toggleSelected(entityOne));

    expect(result.current[0].allSelected).toBe(false);
    expect(result.current[0].selected).toEqual([entityTwo]);
    expect(result.current[1].isSelected(entityOne)).toBe(false);
    expect(result.current[1].isSelected(entityTwo)).toBe(true);
  });
});
