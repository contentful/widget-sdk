import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Modal } from '@contentful/forma-36-react-components';
import { css } from 'emotion';

import { useAsync } from 'core/hooks/useAsync';
import { createOrganizationEndpoint } from 'data/EndpointFactory';

import { isEnterprisePlan, getBasePlan } from 'account/pricing/PricingDataProvider';
import { Organization as OrganizationPropType } from 'app/OrganizationSettings/PropTypes';

import EnterpriseWizard from './Enterprise/EnterpriseWizard';
import CreateOnDemandWizard from './CreateOnDemand/CreateOnDemandWizard';
import Loader from './shared/Loader';

const classes = {
  modal: css({
    maxHeight: 'none',
  }),
};

const fetch = (organization) => async () => {
  const endpoint = createOrganizationEndpoint(organization.sys.id);

  const result = {};

  result.basePlan = await getBasePlan(endpoint);

  // org should create POC if it is Enterprise
  result.shouldCreatePOC = isEnterprisePlan(result.basePlan);

  return result;
};

export default function SpaceWizardsWrapper(props) {
  const { isShown, onClose, organization } = props;
  const [isProcessing, setIsProcessing] = useState(false);

  const { isLoading, data = {} } = useAsync(useCallback(fetch(organization), []));

  const { shouldCreatePOC } = data;

  return (
    <Modal
      size="780px"
      position="top"
      topOffset="20px"
      className={classes.modal}
      shouldCloseOnEscapePress={!isProcessing}
      shouldCloseOnOverlayClick={!isProcessing}
      isShown={isShown}
      onClose={onClose}>
      {() => (
        <>
          {isLoading && <Loader />}
          {!isLoading && shouldCreatePOC && (
            <EnterpriseWizard
              organization={organization}
              onClose={onClose}
              basePlan={data.basePlan}
              onProcessing={setIsProcessing}
              isProcessing={isProcessing}
            />
          )}
          {!isLoading && !shouldCreatePOC && (
            <CreateOnDemandWizard
              organization={organization}
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
};
