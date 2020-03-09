import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import useAsync from 'app/common/hooks/useAsync';
import {
  Workbench,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import { without } from 'lodash';

import DocumentTitle from 'components/shared/DocumentTitle';
import StateLink from 'app/common/StateLink';
import NavigationIcon from 'ui/Components/NavigationIcon';
import ErrorState from 'app/common/ErrorState';
import LoadingState from 'app/common/LoadingState';
import OrganizationRow from './OrganizationRow';
import * as TokenStore from 'services/TokenStore';

const styles = {
  content: css({
    height: '100%',
    '> div': {
      height: '100%'
    }
  })
};

const TITLE = 'Organizations';

const OrganizationsRoute = () => {
  const [organizations, setOrganizations] = useState([]);

  const { isLoading, error } = useAsync(
    useCallback(async () => {
      const organizations = await TokenStore.getOrganizations();
      setOrganizations(organizations);
    }, [])
  );

  // Note: this function is not currently tested, please be careful when editing it.
  const onLeaveSuccess = useCallback(
    organization => {
      setOrganizations(without(organizations, organization));
      TokenStore.refresh();
    },
    [organizations]
  );

  return (
    <>
      <DocumentTitle title={TITLE} />
      <Workbench>
        <Workbench.Header
          icon={<NavigationIcon icon="organizations" size="large" color="green" />}
          testId="organizations-list.title"
          title={TITLE}
          actions={
            <StateLink path="account.new_organization">
              <Button buttonType="primary" testId="organizations-list.new-org-button">
                New Organization
              </Button>
            </StateLink>
          }
        />
        <Workbench.Content className={styles.content}>
          {isLoading && <LoadingState loadingText="Loading your organization memberships..." />}
          {!isLoading && error && <ErrorState />}
          {!isLoading && !error && (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell testId="organizations-list.name-header">Name</TableCell>
                  <TableCell testId="organizations-list.invited-at-header">Invited at</TableCell>
                  <TableCell testId="organizations-list.role-header">Role</TableCell>
                  <TableCell testId="organizations-list.action-header"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {organizations.map(organization => {
                  return (
                    <OrganizationRow
                      key={organization.sys.id}
                      organization={organization}
                      onLeaveSuccess={onLeaveSuccess}
                    />
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Workbench.Content>
      </Workbench>
    </>
  );
};

OrganizationsRoute.propTypes = {
  title: PropTypes.string
};

export default OrganizationsRoute;
