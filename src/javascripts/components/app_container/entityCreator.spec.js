import * as entityCreator from './entityCreator';
import * as spaceContextMocked from 'ng/spaceContext';
import { Notification as NotificationMocked } from '@contentful/forma-36-react-components';
import * as EnforcementsMocked from 'access_control/Enforcements';

jest.mock('access_control/Enforcements', () => ({
  determineEnforcement: jest.fn(),
}));

jest.mock('ng/spaceContext', () => ({
  space: {
    createEntry: jest.fn().mockResolvedValue({}),
    createAsset: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('@contentful/forma-36-react-components', () => ({
  Notification: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('entityCreator', () => {
  beforeEach(() => {
    spaceContextMocked.space.createEntry.mockClear();
    spaceContextMocked.space.createAsset.mockClear();
    NotificationMocked.success.mockClear();
    NotificationMocked.error.mockClear();
    EnforcementsMocked.determineEnforcement.mockClear();
  });

  describe('creates an entry', () => {
    let contentType;

    it('calls the space create method', async function () {
      spaceContextMocked.space.createEntry.mockResolvedValue({ id: '123' });
      const result = await entityCreator.newEntry(contentType);
      expect(spaceContextMocked.space.createEntry).toHaveBeenCalledTimes(1);
      expect(spaceContextMocked.space.createEntry).toHaveBeenCalledWith(contentType, {});
      expect(result).toEqual({ id: '123' });
    });

    it('creation fails', async () => {
      spaceContextMocked.space.createEntry.mockRejectedValue({
        body: {
          details: {
            reasons: [],
          },
        },
      });

      try {
        await entityCreator.newEntry(contentType);
      } catch (e) {
        // just catch
      }

      expect(NotificationMocked.error).toHaveBeenCalledWith('Could not create entry');
    });
  });

  describe('creates an asset', () => {
    it('calls the space create method', async function () {
      spaceContextMocked.space.createAsset.mockResolvedValue({ id: '123' });
      const result = await entityCreator.newAsset();
      expect(spaceContextMocked.space.createAsset).toHaveBeenCalledTimes(1);
      expect(spaceContextMocked.space.createAsset).toHaveBeenCalledWith({
        sys: { type: 'Asset' },
        fields: {},
      });
      expect(result).toEqual({ id: '123' });
    });

    it('creation fails', async () => {
      spaceContextMocked.space.createAsset.mockRejectedValue({
        body: {
          details: {
            reasons: [],
          },
        },
      });

      try {
        await entityCreator.newAsset();
      } catch (e) {
        // just catch
      }

      expect(NotificationMocked.error).toHaveBeenCalledWith('Could not create asset');
    });
  });
});
