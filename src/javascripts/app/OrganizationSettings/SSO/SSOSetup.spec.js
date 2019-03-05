import React from 'react';
import Enzyme from 'enzyme';
import { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import { SSOSetup } from './SSOSetup.es6';
import IDPSetupForm from './IDPSetupForm.es6';
import SSOEnabled from './SSOEnabled.es6';
import { track } from 'analytics/Analytics.es6';
import { isOwnerOrAdmin } from 'services/OrganizationRoles.es6';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage.es6';

jest.mock('services/OrganizationRoles.es6', () => ({
  isOwnerOrAdmin: jest.fn().mockReturnValue(true)
}));

const awaitSetImmediate = () => new Promise(resolve => setImmediate(resolve));

describe('SSOSetup', () => {
  const organization = {
    name: 'My Org',
    sys: {
      id: 'org_1234'
    }
  };

  const render = ({
    identityProvider,
    organization,
    createIdp = () => {},
    retrieveIdp = jest.fn().mockResolvedValue(true),
    onReady = () => {}
  } = {}) => {
    return Enzyme.shallow(
      <SSOSetup
        identityProvider={identityProvider}
        organization={organization}
        createIdp={createIdp}
        retrieveIdp={retrieveIdp}
        onReady={onReady}
      />
    );
  };

  afterEach(() => {
    track.mockClear();
  });

  it('should call retrieveIdp and onReady when the component is mounted if org is present', async () => {
    const retrieveIdp = jest.fn().mockResolvedValue(true);
    const onReady = jest.fn();

    render({ organization, retrieveIdp, onReady });

    await awaitSetImmediate();

    expect(retrieveIdp.mock.calls).toHaveLength(1);
    expect(onReady.mock.calls).toHaveLength(1);
  });

  it('should call retrieveIdp and onReady if an org is not initially present but is later given in props', async () => {
    const retrieveIdp = jest.fn().mockResolvedValue(true);
    const onReady = jest.fn();

    const instance = render({ retrieveIdp, onReady });

    await awaitSetImmediate();

    expect(retrieveIdp.mock.calls).toHaveLength(0);
    expect(onReady.mock.calls).toHaveLength(0);

    instance.setProps({ organization });

    await awaitSetImmediate();

    expect(retrieveIdp.mock.calls).toHaveLength(1);
    expect(onReady.mock.calls).toHaveLength(1);
  });

  it('should render a loading state if the org is not given in props', () => {
    const rendered = render();

    expect(rendered.find(FetcherLoading)).toHaveLength(1);
  });

  it('should not render if identityProvider store data is not given in props', () => {
    const rendered = render({ organization });

    expect(rendered.find(IDPSetupForm)).toHaveLength(0);
  });

  it('should render the forbidden page if the user is not admin/owner', () => {
    isOwnerOrAdmin.mockReturnValueOnce(false);

    const rendered = render({ organization });

    expect(rendered.find(ForbiddenPage)).toHaveLength(1);
  });

  it('should render the IDPSetupForm component if an identityProvider store data is given in props', () => {
    const identityProvider = {
      data: {}
    };
    const rendered = render({ identityProvider, organization });

    expect(rendered.find(IDPSetupForm)).toHaveLength(1);
  });

  it('should not render the IDPSetupForm component if given identityProvider is enabled', () => {
    const identityProvider = {
      data: {
        enabled: true,
        ssoName: 'my-sso-setup'
      }
    };
    const rendered = render({ identityProvider, organization });

    expect(rendered.find(IDPSetupForm)).toHaveLength(0);
  });

  it('should render the SSOEnabled component if the given identityProvider is enabled', () => {
    const identityProvider = {
      data: {
        enabled: true,
        ssoName: 'my-sso-setup',
        restrictedMode: false
      }
    };
    const rendered = render({ identityProvider, organization });

    expect(rendered.find(SSOEnabled)).toHaveLength(1);
  });

  it('should attempt to create an identity provider if CTA button is clicked', () => {
    const createIdp = jest.fn().mockResolvedValue(true);
    const identityProvider = {};
    const rendered = render({ organization, identityProvider, createIdp });

    rendered
      .find('[testId="create-idp"]')
      .first()
      .simulate('click');

    expect(createIdp.mock.calls).toHaveLength(1);
  });

  it('should track when the support link is clicked', () => {
    const identityProvider = {};

    const rendered = render({ identityProvider, organization });

    rendered
      .find('[testId="support-link"]')
      .first()
      .simulate('click');

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenNthCalledWith(1, 'sso:contact_support');
  });
});
