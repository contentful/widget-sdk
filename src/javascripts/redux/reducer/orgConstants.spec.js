import reducer from './orgConstants.es6';
import * as actions from 'redux/actions/orgConstants/actions.es6';

const callReducer = (reducer, state, action) => {
  return reducer(state, action);
};

const initialState = {
  foo: { data: { a: 999 }, meta: { isPending: false } }
};

describe('orgConstants reducer', () => {
  describe('pending state', () => {
    it('should put orgConstants pending state for the given org', () => {
      expect(
        callReducer(reducer, undefined, {
          type: actions.ORG_CONSTANTS_PENDING,
          payload: { orgId: 'foo' }
        })
      ).toEqual({
        foo: { meta: { isPending: true } }
      });
    });

    it('should handle multiple orgs', () => {
      expect(
        callReducer(reducer, initialState, {
          type: actions.ORG_CONSTANTS_PENDING,
          payload: { orgId: 'bar' }
        })
      ).toEqual({
        ...initialState,
        bar: { meta: { isPending: true } }
      });
    });
  });

  describe('success', () => {
    const data = { catalogFeature: { a: true } };

    it('should handle successfull org constants fetching', () => {
      expect(
        callReducer(reducer, undefined, {
          type: actions.ORG_CONSTANTS_SUCCESS,
          payload: { orgId: 'foo', data }
        })
      ).toEqual({
        foo: { ...data, meta: { isPending: false } }
      });
    });

    it('should handle multiple orgs', () => {
      expect(
        callReducer(reducer, initialState, {
          type: actions.ORG_CONSTANTS_SUCCESS,
          payload: { orgId: 'bar', data }
        })
      ).toEqual({
        bar: { ...data, meta: { isPending: false } },
        ...initialState
      });
    });

    it('should update the state of a given org', () => {
      expect(
        callReducer(reducer, initialState, {
          type: actions.ORG_CONSTANTS_SUCCESS,
          payload: { orgId: 'foo', data }
        })
      ).toEqual({
        foo: { ...data, meta: { isPending: false } }
      });
    });
  });

  describe('error', () => {
    const error = new Error('oops!');

    it('should handle unsuccessfull org constants fetching', () => {
      expect(
        callReducer(reducer, undefined, {
          type: actions.ORG_CONSTANTS_FAILURE,
          payload: { orgId: 'foo', error }
        })
      ).toEqual({
        foo: { error, meta: { isPending: false } }
      });
    });

    it('should handle mutiple orgs', () => {
      expect(
        callReducer(reducer, initialState, {
          type: actions.ORG_CONSTANTS_FAILURE,
          payload: { orgId: 'bar', error }
        })
      ).toEqual({
        ...initialState,
        bar: { error, meta: { isPending: false } }
      });
    });

    it('should update the state of a given org', () => {
      expect(
        callReducer(reducer, initialState, {
          type: actions.ORG_CONSTANTS_FAILURE,
          payload: { orgId: 'foo', error }
        })
      ).toEqual({
        foo: { error, meta: { isPending: false } }
      });
    });
  });
});
