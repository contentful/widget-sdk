import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import { getModule } from 'core/NgRegistry';

import { useAsync } from 'core/hooks/useAsync';
import { createOrganizationEndpoint } from 'data/EndpointFactory';

import { isEnterprisePlan, getBasePlan } from 'account/pricing/PricingDataProvider';
import { Organization as OrganizationPropType } from 'app/OrganizationSettings/PropTypes';

import EnterpriseWizard from './Enterprise/EnterpriseWizard';
import Loader from './shared/Loader';

const classes = {
  modal: css({
    maxHeight: 'none',
  }),
};

const openV2OnDemandModal = (organization) => {
  const modalDialog = getModule('modalDialog');

  modalDialog.open({
    title: 'Create new space',
    template: '<cf-space-wizard class="modal-background"></cf-space-wizard>',
    backgroundClose: false,
    persistOnNavigation: true,
    scopeData: {
      action: 'create',
      organization: {
        sys: organization.sys,
        name: organization.name,
        isBillable: organization.isBillable,
      },
    },
  });
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

  useEffect(() => {
    if (isLoading) {
      return;
    }

    // Right now, only the enterprise wizard is migrated to this new format, so we open
    // the V2 on-demand modal and close this one. This has to happen in an effect because
    // we open it using an Angular service.
    //
    // We do this here, rather than in the CreateSpace service, so that we can control
    // the loading state in one place and prevent two modals from showing for the
    // enterprise wizard.
    if (!data.shouldCreatePOC) {
      openV2OnDemandModal(organization);
      onClose();
    }
  }, [isLoading, data, onClose, organization]);

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
