import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import useAsync from 'app/common/hooks/useAsync';

import { getOrganization } from 'services/TokenStore';

import AccountView from 'account/AccountView';
import SubscriptionPage from 'ui/Pages/SubscriptionOverview';

import { isLegacyOrganization } from 'utils/ResourceUtils';
import { FetcherLoading } from 'app/common/createFetcherComponent';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';

const fetch = organizationId => async () => {
  const organization = await getOrganization(organizationId);

  const isLegacy = isLegacyOrganization(organization);

  return {
    organization,
    isLegacy
  };
};

export default function SubscriptionPageRouter({ orgId }) {
  const { isLoading, error, data } = useAsync(useCallback(fetch(orgId), []));

  if (isLoading || !data) {
    return <FetcherLoading message="Loading subscription" />;
  }

  if (error) {
    return <ForbiddenPage />;
  }

  const { organization, isLegacy } = data;

  if (isLegacy) {
    return <AccountView />;
  }

  return <SubscriptionPage organization={organization} />;
}

SubscriptionPageRouter.propTypes = {
  orgId: PropTypes.string.isRequired
};
