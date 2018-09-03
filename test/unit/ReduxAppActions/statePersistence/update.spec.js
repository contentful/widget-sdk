import { noop } from 'lodash';

describe('State persistence update function', function() {
  beforeEach(function() {
    module('contentful/test');
    this.update = this.$inject('ReduxAppActions/statePersistence/update').update;
  });

  it('should resolve after first call is done if no other calls in the meantime', async function() {
    const setSuccess = sinon.spy();
    const data = {
      some: '123'
    };
    await this.update({
      // params, setPending, setSuccess, setFailure, fetch, key, payload, fallbackData
      params: {},
      setPending: noop,
      setSuccess,
      setFailure: noop,
      makeRequest: () => Promise.resolve(data),
      key: 'some_random_key',
      payload: {},
      fallbackData: {}
    });

    expect(setSuccess.calledWith(data)).toBe(true);
  });

  it('should call `setFailure` in case fetch returns a rejected promise', async function() {
    const setFailure = sinon.spy();
    const data = {
      some: '123'
    };
    await this.update({
      // params, setPending, setSuccess, setFailure, fetch, key, payload, fallbackData
      params: {},
      setPending: noop,
      setSuccess: noop,
      setFailure,
      makeRequest: () => Promise.reject(data),
      key: 'some_random_key',
      payload: {},
      fallbackData: {}
    });

    expect(setFailure.calledOnce).toBe(true);
  });

  it('should call `setSuccess` with a latest value from the fetch function', async function() {
    const setSuccess = sinon.stub();
    const updatePromise = this.update({
      // params, setPending, setSuccess, setFailure, fetch, key, payload, fallbackData
      params: {},
      setPending: noop,
      setSuccess: setSuccess,
      setFailure: noop,
      payload: {
        sys: {
          version: 1
        },
        someValue: true
      },
      makeRequest: payload => {
        const newPayload = {
          ...payload,
          sys: {
            ...payload.sys,
            version: payload.sys.version + 1
          }
        };
        return new Promise(resolve => setTimeout(resolve, 100, newPayload));
      },
      key: 'some_random_key',
      fallbackData: {}
    });

    this.update({
      // params, setPending, setSuccess, setFailure, fetch, key, payload, fallbackData
      params: {},
      setPending: noop,
      setSuccess: noop,
      setFailure: noop,
      makeRequest: noop,
      key: 'some_random_key',
      payload: {
        sys: {
          version: 1
        },
        someValue: true,
        anotherValue: true
      },
      fallbackData: {}
    });

    await updatePromise;

    expect(setSuccess.getCall(0).args[0]).toEqual({
      someValue: true,
      anotherValue: true,
      sys: {
        version: 3
      }
    });
  });

  it('two updates should receive the same value in promise', async function() {
    const setSuccess = sinon.stub();
    const updatePromise = this.update({
      // params, setPending, setSuccess, setFailure, fetch, key, payload, fallbackData
      params: {},
      setPending: noop,
      setSuccess: setSuccess,
      setFailure: noop,
      payload: {
        sys: {
          version: 1
        },
        someValue: true
      },
      makeRequest: payload => {
        const newPayload = {
          ...payload,
          sys: {
            ...payload.sys,
            version: payload.sys.version + 1
          }
        };
        return new Promise(resolve => setTimeout(resolve, 100, newPayload));
      },
      key: 'some_random_key',
      fallbackData: {}
    });

    const secondUpdatePromise = this.update({
      // params, setPending, setSuccess, setFailure, fetch, key, payload, fallbackData
      params: {},
      setPending: noop,
      setSuccess: noop,
      setFailure: noop,
      makeRequest: noop,
      key: 'some_random_key',
      payload: {
        sys: {
          version: 1
        },
        someValue: true,
        anotherValue: true
      },
      fallbackData: {}
    });

    const [data1, data2] = await Promise.all([updatePromise, secondUpdatePromise]);

    expect(data1).toBe(data2);
  });

  it('should batch all updates while there is a pending request', async function() {
    const setSuccess = sinon.stub();
    const updatePromise = this.update({
      // params, setPending, setSuccess, setFailure, fetch, key, payload, fallbackData
      params: {},
      setPending: noop,
      setSuccess: setSuccess,
      setFailure: noop,
      payload: {
        sys: {
          version: 1
        },
        someValue: true
      },
      makeRequest: payload => {
        const newPayload = {
          ...payload,
          sys: {
            ...payload.sys,
            version: payload.sys.version + 1
          }
        };
        return new Promise(resolve => setTimeout(resolve, 100, newPayload));
      },
      key: 'some_random_key',
      fallbackData: {}
    });

    this.update({
      // params, setPending, setSuccess, setFailure, fetch, key, payload, fallbackData
      params: {},
      setPending: noop,
      setSuccess: noop,
      setFailure: noop,
      makeRequest: noop,
      key: 'some_random_key',
      payload: {
        sys: {
          version: 1
        },
        someValue: true,
        anotherValue: true
      },
      fallbackData: {}
    });

    this.update({
      // params, setPending, setSuccess, setFailure, fetch, key, payload, fallbackData
      params: {},
      setPending: noop,
      setSuccess: noop,
      setFailure: noop,
      makeRequest: noop,
      key: 'some_random_key',
      payload: {
        sys: {
          version: 1
        },
        someValue: true,
        anotherValue: true,
        yetAnotherValue: false
      },
      fallbackData: {}
    });

    await updatePromise;

    expect(setSuccess.getCall(0).args[0]).toEqual({
      someValue: true,
      anotherValue: true,
      yetAnotherValue: false,
      sys: {
        // Version is 3, even though there were 3 updates
        version: 3
      }
    });
  });

  it('should try to update even if the first call failed and during update another request came', async function() {
    const setSuccess = sinon.stub();
    const updatePromise = this.update({
      // params, setPending, setSuccess, setFailure, fetch, key, payload, fallbackData
      params: {},
      setPending: noop,
      setSuccess: setSuccess,
      setFailure: noop,
      payload: {
        sys: {
          // we use 15 just to exclude it in the fetch (other calls have 1)
          version: 15
        },
        someValue: true
      },
      makeRequest: payload => {
        if (payload.sys.version === 15) {
          // eslint-disable-next-line no-unused-vars
          return new Promise((resolve, reject) =>
            setTimeout(reject, 100, new Error('something went wrong'))
          );
        }

        const newPayload = {
          ...payload,
          sys: {
            ...payload.sys,
            version: payload.sys.version + 1
          }
        };
        return new Promise(resolve => setTimeout(resolve, 100, newPayload));
      },
      key: 'some_random_key',
      fallbackData: {}
    });

    this.update({
      // params, setPending, setSuccess, setFailure, fetch, key, payload, fallbackData
      params: {},
      setPending: noop,
      setSuccess: noop,
      setFailure: noop,
      makeRequest: noop,
      key: 'some_random_key',
      payload: {
        sys: {
          version: 1
        },
        someValue: true,
        anotherValue: true
      },
      fallbackData: {}
    });

    this.update({
      // params, setPending, setSuccess, setFailure, fetch, key, payload, fallbackData
      params: {},
      setPending: noop,
      setSuccess: noop,
      setFailure: noop,
      makeRequest: noop,
      key: 'some_random_key',
      payload: {
        sys: {
          version: 1
        },
        someValue: true,
        anotherValue: true,
        yetAnotherValue: false
      },
      fallbackData: {}
    });

    await updatePromise;

    expect(setSuccess.getCall(0).args[0]).toEqual({
      someValue: true,
      anotherValue: true,
      yetAnotherValue: false,
      sys: {
        // Version is 2, because first call fails, and two others
        // are batched together
        version: 2
      }
    });
  });

  it('should pass a fallbackValue to the `setFailure` handler', async function() {
    const setFailure = sinon.spy();
    const data = {
      some: '123'
    };
    const error = new Error('something');
    await this.update({
      // params, setPending, setSuccess, setFailure, fetch, key, payload, fallbackData
      params: {},
      setPending: noop,
      setSuccess: noop,
      setFailure,
      makeRequest: () => Promise.reject(error),
      key: 'some_random_key',
      payload: {},
      fallbackData: data
    });

    expect(setFailure.getCall(0).args[0]).toEqual({ error, fallbackData: data });
  });

  it('should update a fallback value if first call (before batching) succeeded', async function() {
    const setFailure = sinon.spy();
    const error = new Error('something');
    const updatePromise = this.update({
      // params, setPending, setSuccess, setFailure, fetch, key, payload, fallbackData
      params: {},
      setPending: noop,
      setSuccess: noop,
      setFailure,
      makeRequest: payload => {
        if (payload.sys.version === 2) {
          // eslint-disable-next-line no-unused-vars
          return new Promise((resolve, reject) => setTimeout(reject, 100, error));
        }

        const newPayload = {
          ...payload,
          sys: {
            ...payload.sys,
            version: payload.sys.version + 1
          }
        };
        return new Promise(resolve => setTimeout(resolve, 100, newPayload));
      },
      key: 'some_random_key',
      payload: {
        sys: {
          version: 1
        },
        flag1: true
      },
      fallbackData: {}
    });

    this.update({
      // params, setPending, setSuccess, setFailure, fetch, key, payload, fallbackData
      params: {},
      setPending: noop,
      setSuccess: noop,
      setFailure,
      makeRequest: () => Promise.reject(error),
      key: 'some_random_key',
      payload: {
        sys: {
          version: 1
        },
        flag2: true
      },
      fallbackData: {}
    });

    await updatePromise;

    expect(setFailure.getCall(0).args[0]).toEqual({
      error,
      fallbackData: {
        sys: {
          version: 2
        },
        flag1: true
      }
    });
  });
});
