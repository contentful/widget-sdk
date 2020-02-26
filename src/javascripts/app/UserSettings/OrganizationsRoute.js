import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import useAsync from 'app/common/hooks/useAsync';
import {
  Notification,
  Workbench,
  ModalConfirm,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paragraph,
  Button
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import DocumentTitle from 'components/shared/DocumentTitle';
import StateLink from 'app/common/StateLink';

import * as OrganizationMembershipRepository from 'access_control/OrganizationMembershipRepository';
import { createOrganizationEndpoint } from 'data/EndpointFactory';

import ErrorState from 'app/common/ErrorState';
import LoadingState from 'app/common/LoadingState';
import OrganizationRow from './OrganizationRow';
import ModalLauncher from 'app/common/ModalLauncher';
import { without } from 'lodash';

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

  const onLeave = useCallback(
    async organization => {
      const confirmation = await ModalLauncher.open(({ isShown, onClose }) => (
        <ModalConfirm
          title="Leave organization"
          confirmLabel="Leave"
          intent="negative"
          isShown={isShown}
          onConfirm={() => onClose(true)}
          onCancel={() => onClose(false)}>
          <React.Fragment>
            <Paragraph>
              You are about to leave organization <b>{organization.name}.</b>
            </Paragraph>
            <Paragraph>Do you want to proceed?</Paragraph>
          </React.Fragment>
        </ModalConfirm>
      ));

      if (!confirmation) {
        return;
      }

      try {
        await OrganizationMembershipRepository.removeMembership(
          createOrganizationEndpoint(organization.sys.id),
          organization
        );
      } catch (e) {
        // should we have a more actionable error?
        Notification.error(`Could not leave organization ${organization.name}`);
        return;
      }

      setOrganizations(without(organizations, organization));
      Notification.success(`Successfully left organization ${organization.name}`);
    },
    [organizations]
  );

  return (
    <>
      <DocumentTitle title={title} />
      <Workbench>
        <Workbench.Header
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
                  <TableCell testId="organizations-list.action-header"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {organizations.map(organization => {
                  return (
                    <OrganizationRow
                      key={organization.sys.id}
                      organization={organization}
                      onLeave={onLeave}
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
