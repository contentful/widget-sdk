import React, { useState, useCallback, useEffect } from 'react';

import { css } from 'emotion';
import { Workbench, Notification } from '@contentful/forma-36-react-components';

import { useAsync } from 'core/hooks/useAsync';
import DocumentTitle from 'components/shared/DocumentTitle';
import { setDefaultPaymentMethod } from '../services/PaymentMethodService';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { go } from 'states/Navigator';
import { isOwner } from 'services/OrganizationRoles';
import * as TokenStore from 'services/TokenStore';
import { captureError } from 'core/monitoring';
import { useRouteNavigate } from 'core/react-routing';

import { ZuoraCreditCardIframe } from '../components/ZuoraCreditCardIframe';

const fetch = (organizationId) => async () => {
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

const handleSuccess = async (organizationId, paymentMethodRefId) => {
  try {
    await setDefaultPaymentMethod(organizationId, paymentMethodRefId);
  } catch {
    Notification.error("Oops, your credit card couldn't be updated. Try again.");
    return;
  }

  Notification.success('Credit card successfully updated.');
};

export function EditPaymentMethodRouter({ orgId }: { orgId: string }) {
  const routeNavigate = useRouteNavigate();

  const [showZuoraIframe, setShowZuoraIframe] = useState(false);

  const { data: shouldShowZuoraIframe } = useAsync(useCallback(fetch(orgId), []));

  const onSuccess = useCallback(
    ({ refId }) =>
      handleSuccess(orgId, refId).then(() => {
        routeNavigate({ path: 'organizations.billing', orgId });
      }),
    [orgId, routeNavigate]
  );

  const onError = useCallback((error) => {
    captureError(new Error('Zuora credit card iframe error'), {
      extra: {
        error,
        location: 'account.organizations.billing.edit-payment-method',
      },
    });

    Notification.error(
      'Something went wrong. Refresh this page and contact us if you continue to see this.'
    );
  }, []);

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
            <div className={css({ maxWidth: '600px', margin: '0 auto' })}>
              <ZuoraCreditCardIframe
                organizationId={orgId}
                onSuccess={onSuccess}
                onCancel={() => {
                  routeNavigate({ path: 'organizations.billing', orgId });
                }}
                onError={onError}
              />
            </div>
          )}
        </Workbench.Content>
      </Workbench>
    </>
  );
}
