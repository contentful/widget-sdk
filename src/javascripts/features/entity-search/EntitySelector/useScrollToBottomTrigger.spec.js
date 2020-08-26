import { renderHook } from '@testing-library/react-hooks';
import { useScrollToBottomTrigger } from './useScrollToBottomTrigger';

// because the event handler is throttled
const wait = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 100);
  });

describe('useScrollToBottomTrigger', () => {
  it('should not trigger the handler if target is not withint the expected bounds', async () => {
    const map = {};
    const target = {
      offsetWidth: 100,
      offsetHeight: 600,
      getClientRects: () => 600,
      scrollTop: 0,
      clientHeight: 200,
      scrollHeight: 600,
      addEventListener: jest.fn((event, cb) => {
        map[event] = cb;
      }),
      removeEventListener: jest.fn(),
    };

    const handler = jest.fn();

    renderHook(() =>
      useScrollToBottomTrigger({
        target,
        handler,
      })
    );

    expect(target.addEventListener).toHaveBeenCalled();

    map['scroll']();

    await wait();

    expect(handler).not.toHaveBeenCalled();
  });

  it('should not trigger the handler if the target element is not in the viewport', async () => {
    const map = {};
    const target = {
      offsetWidth: 0,
      offsetHeight: 600,
      getClientRects: () => 600,
      addEventListener: jest.fn((event, cb) => {
        map[event] = cb;
      }),
      removeEventListener: jest.fn(),
    };

    const handler = jest.fn();

    const { rerender } = renderHook(() =>
      useScrollToBottomTrigger({
        target,
        handler,
      })
    );

    map['scroll']();
    await wait();
    expect(handler).not.toHaveBeenCalled();

    rerender({
      target: {
        ...target,
        offsetWidth: 100,
        offsetHeight: 0,
      },
    });

    map['scroll']();
    await wait();
    expect(handler).not.toHaveBeenCalled();

    rerender({
      target: {
        ...target,
        offsetWidth: 100,
        offsetHeight: 600,
        getClientRects: () => 0,
      },
    });

    map['scroll']();
    await wait();
    expect(handler).not.toHaveBeenCalled();
  });

  it('should trigger the handelr if the target element is within the expected bounds', async () => {
    const map = {};
    const target = {
      offsetWidth: 100,
      offsetHeight: 600,
      getClientRects: () => 600,
      scrollTop: 0,
      clientHeight: 400,
      scrollHeight: 600,
      addEventListener: jest.fn((event, cb) => {
        map[event] = cb;
      }),
      removeEventListener: jest.fn(),
    };

    const handler = jest.fn();

    renderHook(() =>
      useScrollToBottomTrigger({
        target,
        handler,
      })
    );

    expect(target.addEventListener).toHaveBeenCalled();

    map['scroll']();
    await wait();

    expect(handler).toHaveBeenCalled();
  });

  it('should not throw if given target is falsy', () => {
    const handler = jest.fn();
    renderHook(() =>
      useScrollToBottomTrigger({
        target: null,
        handler,
      })
    );
  });
});
