import React from 'react';
import PropTypes from 'prop-types';
import OrgAdminOnly from 'app/common/OrgAdminOnly.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import { getOrganization } from 'services/TokenStore.es6';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';

import SSOSetupForm from './SSOSetup.es6';

const SSOSetupFetcher = createFetcherComponent(async ({ orgId }) => {
  const endpoint = createOrganizationEndpoint(orgId);
  const org = await getOrganization(orgId);
  let idpDetails;

  try {
    idpDetails = await endpoint({
      method: 'GET',
      path: ['identity_provider']
    });
  } catch (e) {
    return {
      org,
      idpDetails: null
    };
  }

  return {
    org,
    idpDetails
  };
});

export default class SSOSetupFormRouter extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
    onReady: PropTypes.func.isRequired,
    context: PropTypes.any
  };

  componentDidMount() {
    this.props.onReady();
  }

  render() {
    const { orgId } = this.props;
    return (
      <OrgAdminOnly orgId={orgId}>
        <SSOSetupFetcher orgId={orgId}>
          {({ isLoading, isError, data }) => {
            if (isLoading) {
              return <FetcherLoading message="Initializing SSO..." />;
            }

            if (isError) {
              return <StateRedirect to="spaces.detail.entries.list" />;
            }

            const { idpDetails, org } = data;

            return <SSOSetupForm org={org} idpExists={idpDetails} />;
          }}
        </SSOSetupFetcher>
      </OrgAdminOnly>
    );
  }
}
