import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Modal } from '@contentful/forma-36-react-components';
import { css } from 'emotion';

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

const classes = {
  modal: css({
    maxHeight: 'none',
  }),
};

const ACTIONS = {
  CREATE: 'create',
  CHANGE: 'change',
};

const fetch = (organization, space) => async () => {
  const action = space ? ACTIONS.CHANGE : ACTIONS.CREATE;
  const endpoint = createOrganizationEndpoint(organization.sys.id);

  const result = {
    action,
  };

  result.basePlan = await getBasePlan(endpoint);

  // org should create POC if it is Enterprise
  result.shouldCreatePOC = isEnterprisePlan(result.basePlan);

  return result;
};

export default function SpaceWizardsWrapper(props) {
  const { isShown, onClose, organization, space } = props;
  const [isProcessing, setIsProcessing] = useState(false);

  const { isLoading, data = {} } = useAsync(useCallback(fetch(organization, space), []));

  const { shouldCreatePOC, action } = data;

  const showEnterprise = action === ACTIONS.CREATE && shouldCreatePOC;
  const showOnDemandCreate = action === ACTIONS.CREATE && !shouldCreatePOC;
  const showOnDemandChange = action === ACTIONS.CHANGE;

  return (
    <Modal
      size="780px"
      position="top"
      topOffset="20px"
      className={classes.modal}
      shouldCloseOnEscapePress={!isProcessing}
      shouldCloseOnOverlayClick={!isProcessing}
      isShown={isShown}
      onClose={() => onClose()}>
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
              onClose={onClose}
              onProcessing={setIsProcessing}
              isProcessing={isProcessing}
            />
          )}
          {!isLoading && showOnDemandChange && (
            <ChangeOnDemandWizard
              organization={organization}
              space={space}
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
