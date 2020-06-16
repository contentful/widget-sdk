import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Modal } from '@contentful/forma-36-react-components';
import { css } from 'emotion';

import { alnum } from 'utils/Random';
import { useAsync } from 'core/hooks/useAsync';
import { createOrganizationEndpoint } from 'data/EndpointFactory';

import { isEnterprisePlan, getBasePlan } from 'account/pricing/PricingDataProvider';
import {
  Organization as OrganizationPropType,
  Space as SpacePropType,
} from 'app/OrganizationSettings/PropTypes';

import EnterpriseWizard from './Enterprise/EnterpriseWizard';
import CreateOnDemandWizard from './CreateOnDemand/CreateOnDemandWizard';
import ChangeOnDemandWizard from './ChangeOnDemand/ChangeOnDemandWizard';
import Loader from './shared/Loader';
import { trackWizardEvent, WIZARD_INTENT, WIZARD_EVENTS } from './shared/utils';

const classes = {
  modal: css({
    maxHeight: 'none',
  }),
};

const fetch = (organization, space) => async () => {
  const action = space ? WIZARD_INTENT.CHANGE : WIZARD_INTENT.CREATE;
  const sessionId = alnum(16);
  const endpoint = createOrganizationEndpoint(organization.sys.id);

  const result = {
    action,
    sessionId,
  };

  result.basePlan = await getBasePlan(endpoint);

  // org should create POC if it is Enterprise
  result.shouldCreatePOC = isEnterprisePlan(result.basePlan);

  trackWizardEvent(action, WIZARD_EVENTS.OPEN, sessionId);

  return result;
};

export default function SpaceWizardsWrapper(props) {
  const { isShown, onClose, organization, space } = props;
  const [isProcessing, setIsProcessing] = useState(false);

  const { isLoading, data = {} } = useAsync(useCallback(fetch(organization, space), []));

  const { shouldCreatePOC, action, sessionId } = data;

  const handleClose = (...args) => {
    // To prevent useless data from being tracked, we wait until we have action and
    // sessionId before doing any tracking

    if (action && sessionId) {
      trackWizardEvent(action, WIZARD_EVENTS.CANCEL, sessionId);
    }

    onClose(...args);
  };

  const showEnterprise = action === WIZARD_INTENT.CREATE && shouldCreatePOC;
  const showOnDemandCreate = action === WIZARD_INTENT.CREATE && !shouldCreatePOC;
  const showOnDemandChange = action === WIZARD_INTENT.CHANGE;

  return (
    <Modal
      size="780px"
      position="top"
      topOffset="20px"
      className={classes.modal}
      shouldCloseOnEscapePress={!isProcessing}
      shouldCloseOnOverlayClick={!isProcessing}
      isShown={isShown}
      onClose={handleClose}>
      {() => (
        <>
          {isLoading && <Loader />}
          {!isLoading && showEnterprise && (
            <EnterpriseWizard
              organization={organization}
              onClose={onClose}
              basePlan={data.basePlan}
              onProcessing={setIsProcessing}
              isProcessing={isProcessing}
            />
          )}
          {!isLoading && showOnDemandCreate && (
            <CreateOnDemandWizard
              organization={organization}
              sessionId={sessionId}
              onClose={onClose}
              onProcessing={setIsProcessing}
              isProcessing={isProcessing}
            />
          )}
          {!isLoading && showOnDemandChange && (
            <ChangeOnDemandWizard
              organization={organization}
              space={space}
              sessionId={sessionId}
              onClose={onClose}
              onProcessing={setIsProcessing}
              isProcessing={isProcessing}
            />
          )}
        </>
      )}
    </Modal>
  );
}

SpaceWizardsWrapper.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  organization: OrganizationPropType.isRequired,
  space: SpacePropType,
};
