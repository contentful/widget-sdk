import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Workbench, Notification } from '@contentful/forma-36-react-components';

import { useAsync } from 'core/hooks/useAsync';
import DocumentTitle from 'components/shared/DocumentTitle';
import { setDefaultPaymentMethod } from '../services/PaymentMethodService';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { getVariation, FLAGS } from 'LaunchDarkly';
import { go } from 'states/Navigator';
import { isOwner } from 'services/OrganizationRoles';
import * as TokenStore from 'services/TokenStore';

import { ZuoraCreditCardIframe } from '../components/ZuoraCreditCardIframe';

const fetch = (organizationId) => async () => {
  // Do this here, so that the user is redirected much earlier (loading the HPM
  // params takes a while)
  const shouldShowPage = await getVariation(FLAGS.NEW_PURCHASE_FLOW);

  if (!shouldShowPage) {
    go({
      path: ['account', 'organizations', 'billing-gatekeeper'],
    });

    return false;
  }

  let organization;

  try {
    organization = await TokenStore.getOrganization(organizationId);
  } catch {
    //
  }

  if (!organization || !isOwner(organization)) {
    go({
      path: ['home'],
    });

    return false;
  }

  return true;
};

const goToBillingDashboard = () => {
  return go({
    path: ['account', 'organizations', 'billing'],
  });
};

const handleSuccess = async (organizationId, paymentMethodRefId) => {
  try {
    await setDefaultPaymentMethod(organizationId, paymentMethodRefId);
  } catch {
    Notification.error("Oops, your credit card couldn't be updated. Try again.");
    return;
  }

  Notification.success('Credit card successfully updated.');

  goToBillingDashboard();
};

export function EditPaymentMethodRouter({ orgId: organizationId }) {
  const [showZuoraIframe, setShowZuoraIframe] = useState(false);

  const { data: shouldShowZuoraIframe } = useAsync(useCallback(fetch(organizationId), []));

  const onSuccess = useCallback(({ refId }) => handleSuccess(organizationId, refId), [
    organizationId,
  ]);

  useEffect(() => {
    if (!shouldShowZuoraIframe) {
      return;
    }

    setShowZuoraIframe(true);
  }, [shouldShowZuoraIframe]);

  return (
    <>
      <DocumentTitle title="Edit credit card" />
      <Workbench>
        <Workbench.Header
          title={'Edit credit card'}
          icon={<ProductIcon icon="Billing" size="large" />}
        />
        <Workbench.Content>
          {showZuoraIframe && (
            <ZuoraCreditCardIframe
              organizationId={organizationId}
              onSuccess={onSuccess}
              onCancel={goToBillingDashboard}
            />
          )}
        </Workbench.Content>
      </Workbench>
    </>
  );
}

EditPaymentMethodRouter.propTypes = {
  orgId: PropTypes.string.isRequired,
};
