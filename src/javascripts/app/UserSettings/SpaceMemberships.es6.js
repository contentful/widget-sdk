import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Notification, ModalConfirm } from '@contentful/forma-36-react-components';
import { without } from 'lodash';

import * as TokenStore from 'services/TokenStore.es6';
import * as SpaceMembershipRepository from 'access_control/SpaceMembershipRepository.es6';
import { createSpaceEndpoint } from 'data/EndpointFactory.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';

import SpaceMembershipsPresentation from './SpaceMembershipsPresentation.es6';

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

  return <SpaceMembershipsPresentation onLeave={onLeave} spaces={spaces} />;
};

SpaceMemberships.propTypes = {
  onReady: PropTypes.func.isRequired
};

export default SpaceMemberships;
