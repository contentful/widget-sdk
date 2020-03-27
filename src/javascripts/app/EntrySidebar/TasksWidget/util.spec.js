import { onStoreFetchingStatusChange } from './util';
import * as K from '../../../../../test/utils/kefir';

const initialStatus = {
  isLoading: true,
  data: null,
  error: null,
};
const loadedEmptyStatus = {
  isLoading: false,
  data: [],
  error: null,
};
const createErrorStatus = (error) => ({
  isLoading: false,
  data: null,
  error,
});

describe('onStoreFetchingStatusChange(store, onChange)', () => {
  let store, onChange;

  beforeEach(() => {
    const items$ = K.createMockProperty(null);
    store = { items$ };
    onChange = jest.fn();
  });

  describe('with store still fetching', () => {
    beforeEach(() => {
      onStoreFetchingStatusChange(store, onChange);
    });

    it('invokes `onChange` immediately', () => {
      expect(onChange).toBeCalledTimes(1);
      expect(onChange).toBeCalledWith(initialStatus);
    });
  });

  describe('with store that has already successfully fetched', () => {
    const items = [{ a: 1 }, { b: 2 }, { c: 3 }];
    const initialStatus = {
      ...loadedEmptyStatus,
      data: items,
    };

    beforeEach(() => {
      store.items$.set(items);
      onStoreFetchingStatusChange(store, onChange);
    });

    it('invokes `onChange` immediately with `status.data`', () => {
      expect(onChange).toBeCalledTimes(1);
      expect(onChange).toBeCalledWith(initialStatus);
    });

    it('does not invoke `onChange` for equivalent status', () => {
      const duplicateItems = [...items];
      store.items$.set(duplicateItems);
      expect(onChange).toBeCalledTimes(1);
    });

    it('does not reset `status.data` on subsequent error', () => {
      onChange.mockClear();

      const error = new Error('Some bad fetching error!');
      store.items$.error(error);

      expect(onChange).toBeCalledTimes(1);
      expect(onChange).toBeCalledWith({
        ...initialStatus,
        error,
      });
    });
  });

  describe('with store that has already errored', () => {
    const error = new Error('Some bad fetching error!');
    const initialStatus = createErrorStatus(error);

    beforeEach(() => {
      store.items$.error(error);
      onStoreFetchingStatusChange(store, onChange);
    });

    it('invokes `onChange` immediately with `status.error`', () => {
      expect(onChange).toBeCalledTimes(1);
      expect(onChange).toBeCalledWith(initialStatus);
    });

    it('resets error after successful fetching by store', () => {
      onChange.mockClear();

      const items = ['foo', 'bar'];
      store.items$.set(items);

      expect(onChange).toBeCalledTimes(1);
      expect(onChange).toBeCalledWith({
        ...initialStatus,
        data: items,
        error: null,
      });
    });
  });

  it('returns a off() function to unsubscribe', () => {
    const off1 = onStoreFetchingStatusChange(store, onChange);
    const _off = onStoreFetchingStatusChange(store, onChange);

    expect(off1).toBeInstanceOf(Function);
    expect(onChange).toBeCalledTimes(2);

    off1();
    store.items$.set(['new-value']);

    expect(onChange).toBeCalledTimes(3); // not 4 because of off1()
  });
});
