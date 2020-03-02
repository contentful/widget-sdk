import React, { useState, useEffect, useCallback } from 'react';
import {
  Notification,
  ModalConfirm,
  Paragraph,
  Typography
} from '@contentful/forma-36-react-components';
import { without } from 'lodash';

import * as TokenStore from 'services/TokenStore';
import * as SpaceMembershipRepository from 'access_control/SpaceMembershipRepository';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import ModalLauncher from 'app/common/ModalLauncher';
import { FetcherLoading } from 'app/common/createFetcherComponent';

import SpaceMembershipsPresentation from './SpaceMembershipsPresentation';

const SpaceMemberships = () => {
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
            confirmLabel="Leave"
            isShown={isShown}
            onConfirm={() => onClose(true)}
            onCancel={() => onClose(false)}>
            <React.Fragment>
              <Typography>
                <Paragraph>You are about to leave space {space.name}.</Paragraph>
                <Paragraph>Do you want to proceed?</Paragraph>
              </Typography>
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

  if (!spaces) {
    return <FetcherLoading message="Loading spaces..." />;
  }

  return <SpaceMembershipsPresentation onLeave={onLeave} spaces={spaces} />;
};

export default SpaceMemberships;
