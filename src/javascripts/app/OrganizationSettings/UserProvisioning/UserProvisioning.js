import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import Icon from 'ui/Components/Icon';
import { getOrgFeature } from 'data/CMA/ProductCatalog';
import OrgAdminOnly from 'app/common/OrgAdminOnly';
import StateRedirect from 'app/common/StateRedirect';
import ForbiddenState from 'app/common/ForbiddenState';
import UserProvisioningConfiguration from './UserProvisioningConfiguration';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent';

const FeatureFetcher = createFetcherComponent(async ({ orgId }) => {
  const featureEnabled = await getOrgFeature(orgId, 'scim');
  return [featureEnabled];
});

export default class UserProvisioning extends Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
    onReady: PropTypes.func.isRequired
  };

  componentDidMount() {
    this.props.onReady();
  }

  render() {
    const { orgId } = this.props;

    return (
      <OrgAdminOnly orgId={orgId}>
        <FeatureFetcher orgId={orgId}>
          {({ isLoading, isError, data }) => {
            if (isLoading) {
              return <FetcherLoading message="Loading..." />;
            }
            if (isError) {
              return <StateRedirect path="home" />;
            }
            if (!data.featureEnabled) {
              return <ForbiddenState />;
            }

            return (
              <Workbench>
                <Workbench.Header
                  icon={<Icon name="page-sso" scale="0.75" />}
                  title="User Provisioning"
                />
                <Workbench.Content>
                  <UserProvisioningConfiguration />
                </Workbench.Content>
              </Workbench>
            );
          }}
        </FeatureFetcher>
      </OrgAdminOnly>
    );
  }
}
