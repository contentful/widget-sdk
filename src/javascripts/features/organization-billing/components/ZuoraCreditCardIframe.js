import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import {
  TextField,
  SelectField,
  Option,
  Button,
  Notification,
} from '@contentful/forma-36-react-components';

import { useAsync } from 'core/hooks/useAsync';
import * as LazyLoader from 'utils/LazyLoader';

import { getHostedPaymentParams } from '../services/PaymentMethodService';

/*
  You can't add payment details in localhost development due to the restrictions
  on the Zuora iframe. You will need to go to Quirely/Flinkly, or the Lab.
*/

const styles = {
  zuoraIframeContainer: css({
    '> iframe': {
      width: '100%',
      height: '100%',
    },
    '> #z_hppm_iframe': {
      backgroundColor: 'transparent',
      height: '385px',
    },
  }),
  container: css({
    height: '385px',
    position: 'relative',
  }),
  loadingContainer: css({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
  }),
  cancelButton: css({
    position: 'absolute',
    bottom: '0',
    right: '75px',
  }),
  cancelButtonLoading: css({
    right: '125px',
  }),
  hide: css({
    display: 'none',
  }),
  selectContainer: css({
    display: 'inline-block',
    width: 'calc(50% - 0.35rem)',

    '&:first-of-type': {
      marginRight: '0.5rem',
    },
  }),
  cvvContainer: css({
    paddingLeft: '1rem',
  }),
  gridItem: css({
    marginBottom: '1.5rem',
  }),
  gridFullWidth: css({
    gridColumn: '1 / 3',
  }),
  gridLeft: css({
    gridColumn: '1 / 2',
  }),
  gridRight: css({
    gridColumn: '2 / 3',
  }),
  submitButton: css({
    marginTop: '1rem',
    display: 'flex',
    justifyContent: 'flex-end',
    position: 'absolute',
    bottom: '0',
    right: '0',
    marginBottom: '0',
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

export function ZuoraCreditCardIframe({
  organizationId,
  countryCode,
  onSuccess,
  onError,
  onCancel,
  cancelText = 'Cancel',
}) {
  const [loading, setLoading] = useState(true);

  const { data } = useAsync(useCallback(fetch(organizationId, countryCode), []));

  useEffect(() => {
    if (!data) {
      return;
    }

    const { Zuora, hostedPaymentParams } = data;

    // Gets rendered into #zuora_payment below
    Zuora.renderWithErrorHandler(
      hostedPaymentParams,
      {},
      (response) => {
        const { success } = response;

        if (success) {
          onSuccess(response);
        } else {
          onError && onError(response);
        }
      },
      (key, code) => {
        const emptyRequiredField = code === '001';
        let message;

        switch (key) {
          case 'creditCardHolderName': {
            message = emptyRequiredField ? 'Name required' : 'Name invalid';
            break;
          }

          case 'creditCardNumber': {
            message = emptyRequiredField ? 'Card number required' : 'Card number invalid';
            break;
          }

          case 'cardSecurityCode': {
            message = emptyRequiredField ? 'CVV required' : 'CVV invalid';
            break;
          }

          case 'creditCardExpirationMonth': {
            message = emptyRequiredField ? 'Expiration date required' : 'Expiration date invalid';
            break;
          }

          case 'error': {
            // Async API error
            Notification.error(
              'Something was wrong with your credit card. Check your input and try again.'
            );
            break;
          }
        }

        if (message) {
          Zuora.sendErrorMessageToHpm(key, message);
        }
      }
    );

    Zuora.runAfterRender(() => {
      setLoading(false);
    });
  }, [data, onSuccess, onError]);

  return (
    <div className={styles.container}>
      {loading && <IframeLoadingState />}
      <div
        id="zuora_payment"
        data-test-id="zuora-iframe.iframe-element"
        className={cx(styles.zuoraIframeContainer, loading && styles.hide)}
      />
      <Button
        testId="zuora-iframe.cancel-button"
        onClick={onCancel}
        className={cx(styles.cancelButton, { [styles.cancelButtonLoading]: loading })}
        buttonType="muted">
        {cancelText}
      </Button>
    </div>
  );
}

ZuoraCreditCardIframe.propTypes = {
  organizationId: PropTypes.string.isRequired,
  countryCode: PropTypes.string,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func,
  onCancel: PropTypes.func.isRequired,
  cancelText: PropTypes.string,
};

function IframeLoadingState() {
  /*
    This does not use <Grid /> as the grid includes some CSS properties that we don't
    include in the Zuora iframe.
   */
  return (
    <div className={styles.loadingContainer} data-test-id="zuora-iframe.loading">
      <div className={cx(styles.gridItem, styles.gridFullWidth)}>
        <TextField
          name="name"
          id="name"
          labelText="Cardholder Name"
          textInputProps={{ disabled: true }}
        />
      </div>
      <div className={cx(styles.gridItem, styles.gridFullWidth)}>
        <TextField
          name="number"
          id="number"
          labelText="Card Number"
          textInputProps={{ disabled: true }}
        />
      </div>
      <div className={cx(styles.gridItem, styles.gridLeft)}>
        <div className={styles.selectContainer}>
          <SelectField name="month" id="month" labelText="Month" selectProps={{ isDisabled: true }}>
            <Option value="">- Select One -</Option>
          </SelectField>
        </div>
        <div className={styles.selectContainer}>
          <SelectField name="year" id="year" labelText="Year" selectProps={{ isDisabled: true }}>
            <Option value="">- Select One -</Option>
          </SelectField>
        </div>
      </div>
      <div className={cx(styles.gridItem, styles.gridRight, styles.cvvContainer)}>
        <TextField name="cvv" id="cvv" labelText="CVV" textInputProps={{ disabled: true }} />
      </div>
      <div className={cx(styles.gridItem, styles.submitButton, styles.gridFullWidth)}>
        <Button disabled loading>
          Loading...
        </Button>
      </div>
    </div>
  );
}
