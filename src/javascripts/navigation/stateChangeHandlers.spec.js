import { setupStateChangeHandlers } from './stateChangeHandlers';
import * as NgRegistry from 'core/NgRegistry';
import { waitFor } from '@testing-library/dom';

jest.mock('core/NgRegistry');

describe('stateChangeHandlers', () => {
  describe('leave editor confirmation', () => {
    let $state, dirtyState, $rootScope;
    beforeEach(async function () {
      dirtyState = {
        data: {
          dirty: true,
        },
      };

      const events = {};
      $rootScope = {
        $on: (type, fn) => (events[type] = fn),
      };

      $state = {};
      const get = (key) => $state[key];
      const go = jest.fn().mockImplementation(() => {
        const args = [
          { preventDefault: jest.fn() },
          { name: 'toState' }, // toState
          'toStateParams',
          dirtyState, // fromState
          'fromStateParams',
        ];
        events['$stateChangeStart'](...args);
      });
      $state.get = get;
      $state.go = go;

      NgRegistry.getModule = jest.fn().mockImplementation((arg) => {
        if (arg === '$state') {
          return $state;
        }
        if (arg === '$rootScope') {
          return $rootScope;
        }
        return jest.requireActual('core/NgRegistry')(arg);
      });

      setupStateChangeHandlers();
    });

    it('request leave confirmation', function () {
      const confirm = jest.fn().mockResolvedValue();
      dirtyState.data.requestLeaveConfirmation = confirm;
      $state.go('leave');
      expect(confirm).toHaveBeenCalledTimes(1);
    });

    it('transitions away when leave is confimed', async function () {
      const confirm = jest.fn().mockResolvedValue(true);
      dirtyState.data.requestLeaveConfirmation = confirm;

      const exit = jest.fn();
      dirtyState.onExit = exit;

      $state.go('leave');
      await waitFor(() => expect($state.go).toHaveBeenLastCalledWith('toState', 'toStateParams'));
    });

    it('does not transitions away when leave is cancelled', function () {
      const confirm = jest.fn().mockResolvedValue(false);
      dirtyState.data.requestLeaveConfirmation = confirm;

      const exit = jest.fn();
      dirtyState.onExit = exit;

      $state.go('leave');
      expect(exit).not.toHaveBeenCalled();
    });
  });
});
