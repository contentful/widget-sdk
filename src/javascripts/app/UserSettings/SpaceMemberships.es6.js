import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Notification,
  ModalConfirm
} from '@contentful/forma-36-react-components';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import moment from 'moment';
import { without } from 'lodash';

import * as TokenStore from 'services/TokenStore.es6';
import Icon from 'ui/Components/Icon.es6';
import * as SpaceMembershipRepository from 'access_control/SpaceMembershipRepository.es6';
import { createSpaceEndpoint } from 'data/EndpointFactory.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';

const SpaceMemberships = ({ onReady }) => {
  const [spaces, setSpaces] = useState(null);
  useEffect(() => {
    (async () => setSpaces(await TokenStore.getSpaces()))();
  }, []);

  const onLeave = useCallback(
    async space => {
      try {
        const confirmation = await ModalLauncher.open(({ isShown, onClose }) => (
          <ModalConfirm
            title="Leave space"
            intent="negative"
            isShown={isShown}
            onConfirm={() => onClose(true)}
            onCancel={() => onClose(false)}>
            <React.Fragment>
              <p>You are about to leave space {space.name}.</p>
              <p>Do you want to proceed?</p>
            </React.Fragment>
          </ModalConfirm>
        ));

        if (!confirmation) {
          return;
        }

        await SpaceMembershipRepository.create(createSpaceEndpoint(space.sys.id)).remove(
          space.spaceMembership
        );

        setSpaces(without(spaces, space));
        Notification.success(`Successfully left space ${space.name}`);
      } catch (e) {
        Notification.error(`Could not leave space ${space.name}`);
        throw e;
      }
    },
    [spaces]
  );

  if (spaces) {
    onReady();
  }

  return (
    <Workbench>
      <Workbench.Header
        icon={<Icon name="space" scale={0.75} />}
        title={`Space memberships (${(spaces || []).length})`}
      />
      <Workbench.Content type="default">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Organization</TableCell>
              <TableCell>Invited at</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {(spaces || []).map(space => {
              return (
                <TableRow key={space.sys.id}>
                  <TableCell>{space.name}</TableCell>
                  <TableCell>{space.organization.name}</TableCell>
                  <TableCell title={moment(space.sys.createdAt).format('MMMM DD, YYYY')}>
                    {moment(space.sys.createdAt, moment.ISO_8601).fromNow()}
                  </TableCell>
                  <TableCell>
                    {space.spaceMembership && (
                      <Button onClick={() => onLeave(space)} buttonType="muted" size="small">
                        Leave
                      </Button>
                    )}
                    {!space.spaceMembership && <em>Member via team</em>}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Workbench.Content>
    </Workbench>
  );
};

SpaceMemberships.propTypes = {
  onReady: PropTypes.func.isRequired
};

export default SpaceMemberships;
