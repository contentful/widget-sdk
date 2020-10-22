import React, { useState, useCallback } from 'react';
import { useAsync } from 'core/hooks';
import PropTypes from 'prop-types';
import {
  Workbench,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  Button,
  CardActions,
  DropdownList,
  DropdownListItem,
} from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import moment from 'moment';
import { css } from 'emotion';
import { keyBy } from 'lodash';
import { go } from 'states/Navigator';
import { beginSpaceCreation } from 'services/CreateSpace';
import EmptySpaceState from 'app/home/EmptySpaceHome';
import LoadingState from 'app/common/LoadingState';
import DocumentTitle from 'components/shared/DocumentTitle';
import ErrorState from 'app/common/ErrorState';
import { openDeleteSpaceDialog } from 'features/space-settings';
import { getAllSpaces } from 'access_control/OrganizationMembershipRepository';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import createResourceService from 'services/ResourceService';
import * as TokenStore from 'services/TokenStore';

const styles = {
  content: css({
    height: '100%',
    '> div': {
      height: '100%',
    },
  }),
  nameCol: css({
    width: '30%',
  }),
  userCol: css({
    width: '15%',
  }),
  entryCol: css({
    width: '15%',
  }),
  requestCol: css({
    width: '15%',
  }),
  createdAtCol: css({
    width: '15%',
  }),
  actionCol: css({
    width: '60px',
    verticalAlign: 'middle',
  }),
  triggerIcon: css({
    verticalAlign: 'middle',
  }),
};

const SpacesRoute = ({ orgId }) => {
  const [spaces, setSpaces] = useState([]);
  const [resources, setResources] = useState(null);

  const getSpacesWithResources = useCallback(async () => {
    const endpoint = createOrganizationEndpoint(orgId);
    const allSpaces = await getAllSpaces(endpoint);
    const accessibleSpaces = await TokenStore.getSpaces();
    const allResources = await Promise.all(
      allSpaces.map((space) => createResourceService(space.sys.id).getAll())
    );

    // Set space.isAccessible to check if current user can go to space details
    allSpaces.forEach(
      (space) =>
        (space.isAccessible = !!accessibleSpaces.find(
          (accessibleSpace) => accessibleSpace.sys.id === space.sys.id
        ))
    );
    // Create an object with resource id and resource details as (key, value) and map it to space id
    const spaceResources = {};
    allSpaces.forEach(
      (space, idx) => (spaceResources[space.sys.id] = keyBy(allResources[idx], 'sys.id'))
    );

    setSpaces(allSpaces);
    setResources(spaceResources);
  }, [orgId]);

  const { isLoading, error } = useAsync(getSpacesWithResources);

  const deleteSpace = (space) =>
    openDeleteSpaceDialog({
      space,
      onSuccess: () => {
        const updatedSpaces = spaces.filter((s) => s.sys.id != space.sys.id);
        setSpaces(updatedSpaces);
      },
    });

  const goToSpace = (space) =>
    go({
      path: ['spaces', 'detail', 'home'],
      params: { spaceId: space.sys.id },
      options: { reload: true },
    });

  return (
    <>
      <DocumentTitle title="Organization spaces" />
      <Workbench>
        <Workbench.Header
          icon={<ProductIcon icon="Spaces" size="large" />}
          testId="v1-spaces-list.title"
          title="Organization spaces"
          actions={
            <Button
              buttonType="primary"
              onClick={() => beginSpaceCreation(orgId)}
              testId="v1-spaces-list.new-space-button"
              type="button">
              New space
            </Button>
          }
        />
        <Workbench.Content className={styles.content}>
          {isLoading && <LoadingState />}
          {!isLoading && error && <ErrorState />}
          {!isLoading && !error && !spaces.length && (
            <EmptySpaceState
              orgId={orgId}
              orgOwnerOrAdmin={true}
              data-test-id="v1-spaces-list-empty-state"
            />
          )}
          {!isLoading && !error && spaces.length > 0 && (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell testId="v1-spaces-header.name" className={styles.nameCol}>
                    Name
                  </TableCell>
                  <TableCell testId="v1-spaces-header.user" className={styles.userCol}>
                    Users
                  </TableCell>
                  <TableCell testId="v1-spaces-header.entry" className={styles.entryCol}>
                    Entries
                  </TableCell>
                  <TableCell testId="v1-spaces-header.cda-request" className={styles.requestCol}>
                    CDA requests
                  </TableCell>
                  <TableCell testId="v1-spaces-header.created-at" className={styles.createdAtCol}>
                    Created at
                  </TableCell>
                  <TableCell className={styles.actionCol} />
                </TableRow>
              </TableHead>
              <TableBody>
                {spaces.map((space) => (
                  <TableRow key={space.sys.id} testId="v1-space-row">
                    <TableCell testId="v1-space-row.name">{space.name}</TableCell>
                    <TableCell testId="v1-space-row.user">
                      {resources[space.sys.id].space_membership.usage}
                    </TableCell>
                    <TableCell testId="v1-space-row.entry">
                      {resources[space.sys.id].entry.usage}
                    </TableCell>
                    <TableCell testId="v1-space-row.cda-request">
                      {resources[space.sys.id].content_delivery_api_request.usage}
                    </TableCell>
                    <TableCell testId="v1-space-row.created-at">
                      <Tooltip
                        content={moment(space.sys.createdAt).format('LLLL')}
                        testId="v1-space-created-at-tooltip">
                        {moment(space.sys.createdAt, moment.ISO_8601).fromNow()}
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <CardActions
                        isAutoalignmentEnabled={true}
                        iconButtonProps={{
                          buttonType: 'primary',
                          className: styles.triggerIcon,
                          testId: 'v1-spaces-row.dropdown-menu.trigger',
                        }}
                        data-test-id="v1-spaces-row.dropdown-menu">
                        <DropdownList>
                          <DropdownListItem
                            testId="v1-spaces-dropdown-item.go-to-space"
                            onClick={() => goToSpace(space)}
                            isDisabled={Boolean(space && !space.isAccessible)}>
                            Go to space
                          </DropdownListItem>
                          <DropdownListItem
                            testId="v1-spaces-dropdown-item.delete-space"
                            onClick={() => deleteSpace(space)}>
                            Delete
                          </DropdownListItem>
                        </DropdownList>
                      </CardActions>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Workbench.Content>
      </Workbench>
    </>
  );
};

SpacesRoute.propTypes = { orgId: PropTypes.string };

export default SpacesRoute;
