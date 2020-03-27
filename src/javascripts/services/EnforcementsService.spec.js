import { cloneDeep } from 'lodash';
import { getSpace } from './TokenStore';
import * as EnforcementsService from './EnforcementsService';
import { createSpaceEndpoint } from 'data/EndpointFactory';

jest.mock('services/TokenStore', () => ({
  getSpace: jest.fn(),
}));

describe('Enforcements Service', function () {
  let fetchEnforcementsMock;

  beforeEach(async function () {
    const tokenSpace = {
      enforcements: [],
    };

    fetchEnforcementsMock = jest.fn();

    createSpaceEndpoint.mockReturnValue(fetchEnforcementsMock);
    getSpace.mockResolvedValueOnce(tokenSpace);
  });

  describe('getEnforcements', function () {
    it('should return null if given no space id', function () {
      expect(EnforcementsService.getEnforcements()).toBeNull();
    });

    it('should return null if given a space id for which no enforcements exist', function () {
      expect(EnforcementsService.getEnforcements('BAD_SPACE_ID')).toBeNull();
    });

    it('fetches enforcements for a given space id when requested', async function () {
      const enforcements = [{}];
      fetchEnforcementsMock.mockResolvedValueOnce({ items: enforcements });
      await EnforcementsService.refresh('SPACE_ID');

      expect(fetchEnforcementsMock).toBeCalled();
      expect(EnforcementsService.getEnforcements('SPACE_ID')).toStrictEqual(enforcements);
      expect(EnforcementsService.getEnforcements('SPACE_ID_2')).toBeNull();
    });

    it('returns the same enforcements object if it has not been changed remotely', async function () {
      const enforcements = [{ sys: { id: 'E_1' } }];

      fetchEnforcementsMock.mockResolvedValueOnce({ items: enforcements });
      await EnforcementsService.refresh('SPACE_ID');
      const first = EnforcementsService.getEnforcements('SPACE_ID');

      fetchEnforcementsMock.mockResolvedValueOnce({ items: cloneDeep(enforcements) });
      await EnforcementsService.refresh('SPACE_ID');
      const second = EnforcementsService.getEnforcements('SPACE_ID');

      expect(first).toStrictEqual(enforcements);
      expect(second).toStrictEqual(first);
    });

    it('returns new enforcements if they were changed remotely', async function () {
      const enforcements = [{ sys: { id: 'E_1' } }];
      fetchEnforcementsMock.mockResolvedValueOnce({ items: enforcements });
      await EnforcementsService.refresh('SPACE_ID');
      const first = EnforcementsService.getEnforcements('SPACE_ID');

      const newEnforcements = [];
      fetchEnforcementsMock.mockResolvedValueOnce({ items: newEnforcements });
      await EnforcementsService.refresh('SPACE_ID');
      const second = EnforcementsService.getEnforcements('SPACE_ID');

      expect(first).toStrictEqual(enforcements);
      expect(second).toStrictEqual(newEnforcements);
    });
  });

  describe('periodically refreshes enforcements', function () {
    const wait = () => new Promise((resolve) => setTimeout(resolve));

    beforeEach(function () {
      window.setInterval = jest.fn().mockReturnValue(1);
      window.clearInterval = jest.fn();
    });

    it('should set a timer to refresh every 30 seconds', async function () {
      const deinit = EnforcementsService.init('SPACE_ID');

      expect(window.setInterval).toBeCalledTimes(1);
      expect(window.setInterval).toBeCalledWith(expect.any(Function), 30 * 1000);

      deinit();
    });

    it('should clear the interval when the deinit function is called', () => {
      const deinit = EnforcementsService.init('SPACE_ID');

      deinit();

      expect(window.clearInterval).toBeCalledTimes(1);
    });

    it('should set up one timer per spaceId if init is called multiple times', () => {
      // Only the first deinit matters
      const deinit = EnforcementsService.init('SPACE_ID');
      EnforcementsService.init('SPACE_ID');
      EnforcementsService.init('SPACE_ID');
      EnforcementsService.init('SPACE_ID');

      expect(window.setInterval).toBeCalledTimes(1);

      deinit();
    });

    it('should not refresh while another refresh is occurring', async () => {
      EnforcementsService.refresh('SPACE_ID');
      EnforcementsService.refresh('SPACE_ID');
      EnforcementsService.refresh('SPACE_ID');
      EnforcementsService.refresh('SPACE_ID');

      await wait();

      expect(fetchEnforcementsMock).toBeCalledTimes(1);
    });

    it('should remove any enforcements when deinitialized', async function () {
      const enforcements = [{ sys: { id: 'E_1' } }];
      fetchEnforcementsMock.mockResolvedValueOnce({ items: enforcements });

      const deinit = EnforcementsService.init('SPACE_ID');
      await wait();

      expect(EnforcementsService.getEnforcements('SPACE_ID')).toStrictEqual(enforcements);
      deinit();
      expect(EnforcementsService.getEnforcements('SPACE_ID')).toBeNull();
    });
  });
});
