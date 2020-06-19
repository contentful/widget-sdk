import { useReducer } from 'react';

type HistoryStates<T> = { past: T[]; future: T[]; present: T | null };
type Action<T> = { type: 'push'; state: T } | { type: 'back' } | { type: 'forward' };

function reduce<T>(prevState: HistoryStates<T>, action: Action<T>): HistoryStates<T> {
  const { present, past, future } = prevState;
  const hasPast = past.length > 0;
  const hasFuture = future.length > 0;
  const hasPresent = present !== null;

  switch (action.type) {
    case 'push':
      return {
        present: action.state,
        past: hasPresent ? [...past, present!] : past,
        future: [],
      };
    case 'back':
      return {
        present: hasPast ? past[past.length - 1] : present,
        past: past.slice(0, past.length - 1),
        future: hasPresent && hasPast ? [...future, present!] : future,
      };
    case 'forward':
      return {
        present: hasFuture ? future[future.length - 1] : present,
        past: hasPresent && hasFuture ? [...past, present!] : past,
        future: future.slice(0, future.length - 1),
      };
    default:
      return prevState;
  }
}

function useHistoryReducer<T>(initialValue?: T) {
  return useReducer(reduce, {
    past: [],
    future: [],
    present: initialValue || null,
  });
}

export { useHistoryReducer, reduce };
