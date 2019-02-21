import reducer from '../reducer/index.es6';
import { hasAccess, getReasonDenied } from './access.es6';

describe('access selectors', () => {
  describe('initial state', () => {
    let initialState;
    beforeEach(() => {
      initialState = reducer(undefined, { type: 'INIT' });
    });

    it('hasAccess should return true', () => {
      expect(hasAccess(initialState)).toBe(true);
    });

    it('getReasonDenied should return undefined', () => {
      expect(getReasonDenied(initialState)).toBeUndefined();
    });

    describe('access was denied', () => {
      let deniedState;
      beforeEach(() => {
        deniedState = reducer(initialState, {
          type: 'ACCESS_DENIED',
          payload: { reason: 'open_bills' }
        });
      });

      it('hasAccess should return false', () => {
        expect(hasAccess(deniedState)).toBe(false);
      });

      it('getReasonDenied should return the reason', () => {
        expect(getReasonDenied(deniedState)).toEqual('open_bills');
      });

      describe('changed location', () => {
        let newLocationState;
        beforeEach(() => {
          newLocationState = reducer(deniedState, {
            type: 'LOCATION_CHANGED',
            payload: { location: 'doesnt matter' }
          });
        });

        it('hasAccess should return true', () => {
          expect(hasAccess(newLocationState)).toBe(true);
        });

        it('getReasonDenied should return undefined', () => {
          expect(getReasonDenied(newLocationState)).toBeUndefined();
        });
      });
    });
  });
});
