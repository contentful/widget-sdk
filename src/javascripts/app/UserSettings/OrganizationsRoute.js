import React, { useState, useCallback, useEffect } from 'react';
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
import { getOrganizations } from 'services/TokenStore';

const styles = {
  content: css({
    height: '100%',
    '> div': {
      height: '100%'
    }
  })
};

const OrganizationsRoute = ({ onReady, title }) => {
  const [organizations, setOrganizations] = useState([]);

  useEffect(onReady, [onReady]);

  const { isLoading, error } = useAsync(
    useCallback(async () => {
      const organizations = await getOrganizations();
      setOrganizations(organizations);
    }, [])
  );

  const onLeaveSuccess = useCallback(
    organization => {
      // Note: this function is not currently tested, please be careful when editing it.
      setOrganizations(without(organizations, organization));
    },
    [organizations]
  );

  return (
    <>
      <DocumentTitle title={title} />
      <Workbench>
        <Workbench.Header
          icon={<NavigationIcon name="organizations" size="large" color="green" />}
          testId="organizations-list.title"
          title={title}
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
  onReady: PropTypes.func.isRequired,
  title: PropTypes.string
};

export default OrganizationsRoute;
