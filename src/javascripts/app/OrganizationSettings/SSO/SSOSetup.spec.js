import React from 'react';
import Enzyme from 'enzyme';
import 'jest-enzyme';
import { FetcherLoading } from 'app/common/createFetcherComponent';
import { SSOSetup } from './SSOSetup';
import IDPSetupForm from './IDPSetupForm';
import SSOEnabled from './SSOEnabled';
import { track } from 'analytics/Analytics';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { getOrgFeature } from 'data/CMA/ProductCatalog';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import SSOUpsellState from './SSOUpsellState';
import * as fake from 'test/helpers/fakeFactory';

jest.mock('services/OrganizationRoles', () => ({
  isOwnerOrAdmin: jest.fn().mockReturnValue(true),
}));

jest.mock('data/CMA/ProductCatalog', () => ({
  getOrgFeature: jest.fn().mockResolvedValue(true),
}));

const awaitSetImmediate = () => new Promise((resolve) => setImmediate(resolve));

describe('SSOSetup', () => {
  const organization = fake.Organization();

  const render = async ({
    identityProvider,
    organization,
    createIdp = () => {},
    retrieveIdp = jest.fn().mockResolvedValue(true),
  } = {}) => {
    const rendered = Enzyme.shallow(
      <SSOSetup
        identityProvider={identityProvider}
        organization={organization}
        createIdp={createIdp}
        retrieveIdp={retrieveIdp}
      />
    );

    await awaitSetImmediate();

    return rendered;
  };

  afterEach(() => {
    track.mockClear();
  });

  it('should call retrieveIdp when the component is mounted if org is present', async () => {
    const retrieveIdp = jest.fn().mockResolvedValue(true);

    await render({ organization, retrieveIdp });

    expect(retrieveIdp.mock.calls).toHaveLength(1);
  });

  it('should call retrieveIdp if an org is not initially present but is later given in props', async () => {
    const retrieveIdp = jest.fn().mockResolvedValue(true);

    const instance = await render({ retrieveIdp });

    expect(retrieveIdp.mock.calls).toHaveLength(0);

    instance.setProps({ organization });

    await awaitSetImmediate();

    expect(retrieveIdp.mock.calls).toHaveLength(1);
  });

  it('should render a loading state if the org is not given in props', async () => {
    const rendered = await render();

    expect(rendered.find(FetcherLoading)).toHaveLength(1);
  });

  it('should not render if identityProvider store data is not given in props', async () => {
    const rendered = await render({ organization });

    expect(rendered.find(IDPSetupForm)).toHaveLength(0);
  });

  it('should go through the forbidden flow if the sso feature is not enabled and the user is not org admin/owner', async () => {
    const retrieveIdp = jest.fn();

    getOrgFeature.mockResolvedValueOnce(false);
    isOwnerOrAdmin.mockReturnValueOnce(false);

    const rendered = await render({ organization, retrieveIdp });

    expect(rendered.find(ForbiddenPage)).toHaveLength(1);

    expect(retrieveIdp.mock.calls).toHaveLength(0);
  });

  it('should show the SSO upsell state if the sso feature is not enabled and the user is an org admin/oener', async () => {
    const retrieveIdp = jest.fn();

    getOrgFeature.mockResolvedValueOnce(false);

    const rendered = await render({ organization, retrieveIdp });

    expect(rendered.find(SSOUpsellState)).toHaveLength(1);

    expect(retrieveIdp.mock.calls).toHaveLength(0);
  });

  it('should go through the forbidden flow if the user is not admin/owner', async () => {
    const retrieveIdp = jest.fn();

    isOwnerOrAdmin.mockReturnValueOnce(false);

    const rendered = await render({ organization, retrieveIdp });

    expect(rendered.find(ForbiddenPage)).toHaveLength(1);

    expect(retrieveIdp.mock.calls).toHaveLength(0);
  });

  it('should render the IDPSetupForm component if an identityProvider store data is given in props', async () => {
    const identityProvider = {
      data: {},
    };
    const rendered = await render({ identityProvider, organization });

    expect(rendered.find(IDPSetupForm)).toHaveLength(1);
  });

  it('should not render the IDPSetupForm component if given identityProvider is enabled', async () => {
    const identityProvider = {
      data: {
        enabled: true,
        ssoName: 'my-sso-setup',
      },
    };
    const rendered = await render({ identityProvider, organization });

    expect(rendered.find(IDPSetupForm)).toHaveLength(0);
  });

  it('should render the SSOEnabled component if the given identityProvider is enabled', async () => {
    const identityProvider = {
      data: {
        enabled: true,
        ssoName: 'my-sso-setup',
        restrictedMode: false,
      },
    };
    const rendered = await render({ identityProvider, organization });

    expect(rendered.find(SSOEnabled)).toHaveLength(1);
  });

  it('should attempt to create an identity provider if CTA button is clicked', async () => {
    const createIdp = jest.fn().mockResolvedValue(true);
    const identityProvider = {};
    const rendered = await render({
      organization,
      identityProvider,
      createIdp,
    });

    rendered.find('[testId="create-idp"]').first().simulate('click');

    expect(createIdp.mock.calls).toHaveLength(1);
  });

  it('should track when the support link is clicked', async () => {
    const identityProvider = {};

    const rendered = await render({ identityProvider, organization });

    rendered.find('[testId="support-link"]').first().simulate('click');

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenNthCalledWith(1, 'sso:contact_support');
  });
});
