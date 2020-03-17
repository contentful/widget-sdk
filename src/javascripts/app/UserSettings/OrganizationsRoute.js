import React, { useState, useCallback } from 'react';
import useAsync from 'app/common/hooks/useAsync';
import {
  Workbench,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  Heading,
  Paragraph,
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
import EmptyStateContainer, {
  defaultSVGStyle
} from 'components/EmptyStateContainer/EmptyStateContainer';
import Illustration from 'svg/readonly-space-ill.svg';

const styles = {
  content: css({
    height: '100%',
    '> div': {
      height: '100%'
    }
  })
};

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

  const emptyState = (
    <EmptyStateContainer data-test-id="organizations-list-empty-state">
      <Illustration className={defaultSVGStyle} />
      <Typography>
        <Heading>You&#39;re not a member of any organizations.</Heading>
        <Paragraph>
          Create one by clicking on the <b>New Organization</b> button in the top right.
        </Paragraph>
      </Typography>
    </EmptyStateContainer>
  );

  return (
    <>
      <DocumentTitle title="Organizations" />
      <Workbench>
        <Workbench.Header
          icon={<NavigationIcon icon="organizations" size="large" color="green" />}
          testId="organizations-list.title"
          title="Organizations"
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
          {!isLoading &&
            !error &&
            (organizations.length > 0 ? (
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
            ) : (
              emptyState
            ))}
        </Workbench.Content>
      </Workbench>
    </>
  );
};

export default OrganizationsRoute;
