import * as fake from 'test/helpers/fakeFactory';
import { getCurrentOrg } from './getCurrentOrg';
import { getModule } from 'core/NgRegistry';

const mockOrg = fake.Organization();
const mockSpace = fake.Space();
mockSpace.sys.organization = mockOrg;

jest.mock('services/TokenStore', () => ({
  getOrganization: jest.fn(async () => mockOrg),
  getSpace: jest.fn(async () => mockSpace),
}));

jest.mock('core/NgRegistry', () => ({ getModule: jest.fn() }));

describe('getCurrentOrg', () => {
  it('returns the org when current page is under an organization scope', async () => {
    getModule.mockReturnValueOnce({ orgId: mockOrg.sys.id });
    const org = await getCurrentOrg();

    expect(org).toBe(mockOrg);
  });

  it('returns the org when current page is under an space scope', async () => {
    getModule.mockReturnValueOnce({ spaceId: mockSpace.sys.id });
    const org = await getCurrentOrg();

    expect(org).toBe(mockOrg);
  });

  it('returns null if current page is not under a space or org scope', async () => {
    getModule.mockReturnValueOnce({});
    const org = await getCurrentOrg();

    expect(org).toBeNull();
  });
});
