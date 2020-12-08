import { getCustomWidgetLoader } from './CustomWidgetLoaderInstance';
import * as spaceContextMocked from '__mocks__/ng/spaceContext';
import { WidgetLoader } from '@contentful/widget-renderer';

jest.mock('Config', () => ({
  apiUrl: () => 'https://whatever.com',
}));
jest.mock('@contentful/widget-renderer');
jest.mock('Authentication', () => ({
  getToken: () => 'token',
}));

describe('getCustomWidgetLoader', () => {
  const oldFetch = window.fetch;
  beforeAll(() => {
    window.fetch = jest.fn();
  });
  afterAll(() => {
    window.fetch = oldFetch;
  });
  const aliasId = 'my-alias';
  const environmentId = 'my-environment';
  describe('when on an aliased environment', () => {
    beforeEach(() => {
      spaceContextMocked.getEnvironmentId.mockReturnValue(environmentId);
      spaceContextMocked.getAliasId.mockReturnValue(aliasId);
    });
    it('involes WidgetLoader with that alias ID', async () => {
      await getCustomWidgetLoader();
      expect((WidgetLoader as jest.Mock).mock.calls[0][3]).toEqual(aliasId);
    });
  });

  describe('when on an non-aliased environment', () => {
    beforeEach(() => {
      spaceContextMocked.getEnvironmentId.mockReturnValue(environmentId);
      spaceContextMocked.getAliasId.mockReturnValue(null);
    });
    it('involes WidgetLoader with the environment ID', async () => {
      await getCustomWidgetLoader();
      expect((WidgetLoader as jest.Mock).mock.calls[0][3]).toEqual(environmentId);
    });
  });
});
