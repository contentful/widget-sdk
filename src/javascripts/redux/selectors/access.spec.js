import reducer from '../reducer';
import { hasAccess, getReasonDenied } from './access';

describe('access selectors', () => {
  describe('initial state', () => {
    let initialState;
    beforeEach(() => {
      initialState = reducer(undefined, { type: 'INIT' });
    });

    it('hasAccess should return true', () => {
      expect(hasAccess(initialState)).toBe(true);
    });

    it('getReasonDenied should return null', () => {
      expect(getReasonDenied(initialState)).toBeNull();
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

        it('getReasonDenied should return null', () => {
          expect(getReasonDenied(newLocationState)).toBeNull();
        });
      });
    });
  });
});
