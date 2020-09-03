import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';

import { useAsync } from 'core/hooks/useAsync';
import * as LazyLoader from 'utils/LazyLoader';
import LoadingState from 'app/common/LoadingState';

import { getHostedPaymentParams } from '../services/PaymentMethodService';

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

const fetch = (organizationId, countryCode) => async () => {
  const [Zuora, hostedPaymentParams] = await Promise.all([
    LazyLoader.get('Zuora'),
    getHostedPaymentParams(organizationId, countryCode),
  ]);

  return {
    Zuora,
    hostedPaymentParams,
  };
};

export function ZuoraCreditCardIframe({ organizationId, countryCode, onSuccess, onError }) {
  const [loading, setLoading] = useState(true);

  const { data } = useAsync(useCallback(fetch(organizationId, countryCode), []));

  useEffect(() => {
    if (!data) {
      return;
    }

    const { Zuora, hostedPaymentParams } = data;

    // Gets rendered into #zuora_payment below
    Zuora.render(hostedPaymentParams, {}, (response) => {
      const { success } = response;

      if (success) {
        onSuccess(response);
      } else {
        onError && onError(response);
      }
    });

    Zuora.runAfterRender(() => {
      setLoading(false);
    });
  }, [data, onSuccess, onError]);

  return (
    <>
      {loading && <LoadingState />}
      <div
        id="zuora_payment"
        data-test-id="zuora-payment-iframe"
        className={cx(styles.iframeContainer, loading && styles.hide)}></div>
    </>
  );
}

ZuoraCreditCardIframe.propTypes = {
  organizationId: PropTypes.string.isRequired,
  countryCode: PropTypes.string,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func,
};
