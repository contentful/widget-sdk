import * as entityCreator from './entityCreator';
import { Notification as NotificationMocked } from '@contentful/forma-36-react-components';
import * as EnforcementsMocked from 'access_control/Enforcements';

const mockCreateEntry = jest.fn();
const mockCreateAsset = jest.fn();

jest.mock('core/services/usePlainCMAClient', () => ({
  getSpaceEnvCMAClient: () => ({
    entry: {
      create: mockCreateEntry,
    },
    asset: {
      create: mockCreateAsset,
    },
  }),
}));

jest.mock('access_control/Enforcements', () => ({
  determineEnforcement: jest.fn(),
}));

jest.mock('@contentful/forma-36-react-components', () => {
  const actual = jest.requireActual('@contentful/forma-36-react-components');
  return {
    ...actual,
    Notification: {
      success: jest.fn(),
      error: jest.fn(),
    },
  };
});

describe('entityCreator', () => {
  beforeEach(() => {
    mockCreateEntry.mockClear();
    mockCreateAsset.mockClear();
    NotificationMocked.success.mockClear();
    NotificationMocked.error.mockClear();
    EnforcementsMocked.determineEnforcement.mockClear();
  });

  describe('creates an entry', () => {
    let contentType;

    it('calls the space create method', async function () {
      mockCreateEntry.mockResolvedValue({ id: '123' });
      const result = await entityCreator.newEntry(contentType);
      expect(mockCreateEntry).toHaveBeenCalledTimes(1);
      expect(mockCreateEntry).toHaveBeenCalledWith({ contentTypeId: contentType }, {});
      expect(result).toEqual({ id: '123' });
    });

    it('creation fails', async () => {
      mockCreateEntry.mockRejectedValue({
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
      mockCreateAsset.mockResolvedValue({ id: '123' });
      const result = await entityCreator.newAsset();
      expect(mockCreateAsset).toHaveBeenCalledTimes(1);
      expect(mockCreateAsset).toHaveBeenCalledWith(
        {},
        {
          sys: { type: 'Asset' },
          fields: {},
        }
      );
      expect(result).toEqual({ id: '123' });
    });

    it('creation fails', async () => {
      mockCreateAsset.mockRejectedValue({
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
