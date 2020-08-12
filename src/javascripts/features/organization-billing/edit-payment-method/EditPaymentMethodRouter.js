import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import { Workbench } from '@contentful/forma-36-react-components';

import { useAsync } from 'core/hooks/useAsync';
import * as LazyLoader from 'utils/LazyLoader';
import DocumentTitle from 'components/shared/DocumentTitle';
import { getHostedPaymentParams } from '../services/PaymentMethodService';
import { NavigationIcon } from '@contentful/forma-36-react-components/dist/alpha';
import LoadingState from 'app/common/LoadingState';
import { getVariation, FLAGS } from 'LaunchDarkly';
import { go } from 'states/Navigator';

/*
  You can't add payment details in localhost development due to the restrictions
  on the Zuora iframe. You will need to go to Quirely/Flinkly, or the Lab.
*/

const styles = {
  iframeContainer: css({
    '> iframe': {
      width: '100%',
      height: '100%',
    },
    '> #z_hppm_iframe': {
      backgroundColor: 'transparent',
      minHeight: '500px',
    },
  }),
  hide: css({
    display: 'none',
  }),
};

const fetch = (organizationId) => async () => {
  // Do this here, so that the user is redirected much earlier (loading the HPM
  // params takes a while)
  const shouldShowPage = await getVariation(FLAGS.NEW_PURCHASE_FLOW);

  if (!shouldShowPage) {
    go({
      path: ['account', 'organizations', 'billing-gatekeeper'],
    });

    return;
  }

  const [Zuora, hostedPaymentParams] = await Promise.all([
    LazyLoader.get('Zuora'),
    getHostedPaymentParams(organizationId),
  ]);

  return {
    Zuora,
    hostedPaymentParams,
  };
};

export function EditPaymentMethodRouter({ orgId: organizationId }) {
  const [loading, setLoading] = useState(true);

  const { data } = useAsync(useCallback(fetch(organizationId), []));

  useEffect(() => {
    if (!data) {
      return;
    }

    const { Zuora, hostedPaymentParams } = data;

    // Gets rendered into #zuora_payment below
    Zuora.render(hostedPaymentParams, {}, () => {});
    Zuora.runAfterRender(() => setLoading(false));
  }, [data]);

  return (
    <>
      <DocumentTitle title="Edit credit card" />
      <Workbench>
        <Workbench.Header
          title={'Edit credit card'}
          icon={<NavigationIcon icon="Billing" size="large" />}
        />
        <Workbench.Content>
          {loading && <LoadingState />}
          <div
            id="zuora_payment"
            data-test-id="zuora-payment-iframe"
            className={cx(styles.iframeContainer, loading && styles.hide)}></div>
        </Workbench.Content>
      </Workbench>
    </>
  );
}

EditPaymentMethodRouter.propTypes = {
  orgId: PropTypes.string.isRequired,
};
