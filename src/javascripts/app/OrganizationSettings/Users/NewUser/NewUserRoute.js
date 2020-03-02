import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import { Workbench } from '@contentful/forma-36-react-components';

import Icon from 'ui/Components/Icon';
import ErrorState from 'app/common/ErrorState';
import LoadingState from 'app/common/LoadingState';
import useAsync from 'app/common/hooks/useAsync';

import { getOrganization } from 'services/TokenStore';
import { getOrgFeature } from 'data/CMA/ProductCatalog';
import { isOwner as isOrgOwner } from 'services/OrganizationRoles';

import NewUser from './NewUser';

// TODO: put this in the component library -- we shouldn't have to set height like this
const styles = {
  content: css({
    height: '100%',
    '> div': {
      height: '100%'
    }
  })
};

export default function NewUserRoute({ orgId }) {
  const { isLoading, error, data: componentProps } = useAsync(
    useCallback(async () => {
      const [org, hasTeamsFeature] = await Promise.all([
        getOrganization(orgId),
        getOrgFeature(orgId, 'teams')
      ]);

      const isOwner = isOrgOwner(org);
      const hasSsoEnabled = org.hasSsoEnabled;

      return {
        hasSsoEnabled,
        hasTeamsFeature,
        isOwner
      };
    }, [orgId])
  );

  return (
    <Workbench title="Invite users">
      <Workbench.Header title="Invite users" icon={<Icon name="page-users" scale="0.75" />} />
      <Workbench.Content className={styles.content} type="text">
        {isLoading && <LoadingState loadingText="Loading…" />}
        {!isLoading && error && <ErrorState />}
        {!isLoading && !error && <NewUser orgId={orgId} {...componentProps} />}
      </Workbench.Content>
    </Workbench>
  );
}

NewUserRoute.propTypes = {
  orgId: PropTypes.string.isRequired
};
