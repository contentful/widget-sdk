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

import * as TokenStore from 'services/TokenStore';

const styles = {
  content: css({
    height: '100%',
    '> div': {
      height: '100%'
    }
  })
};

const OrganizationsRoute = ({ onReady, title }) => {
  const [organizations, setOrganizations] = useState(null);

  useEffect(onReady, [onReady]);

  const { isLoading, error } = useAsync(
    useCallback(async () => {
      const organizations = await TokenStore.getOrganizations();
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

        setOrganizations(without(organizations, organization));
        Notification.success(`Successfully left space ${organization.name}`);
      } catch (e) {
        Notification.error(`Could not leave space ${organization.name}`);
        throw e;
      }
    },
    [organizations]
  );

  return (
    <>
      <DocumentTitle title={title} />
      <Workbench>
        <Workbench.Header
          title={title}
          actions={
            <StateLink component={Button} path="account.new_organization">
              New Organization
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
                  <TableCell>Name</TableCell>
                  <TableCell>Invited at</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(organizations || []).map(organization => {
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
