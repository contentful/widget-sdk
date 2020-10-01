import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import {
  Form,
  TextField,
  SelectField,
  Option,
  Button,
} from '@contentful/forma-36-react-components';
import { Grid, GridItem } from '@contentful/forma-36-react-components/dist/alpha';

import { useAsync } from 'core/hooks/useAsync';
import * as LazyLoader from 'utils/LazyLoader';

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
      minHeight: '400px',
    },
  }),
  hide: css({
    display: 'none',
  }),
  selectContainer: css({
    display: 'inline-block',
    width: 'calc(50% - 0.25rem)',
    marginRight: '0.25rem',
  }),
  gridItem: css({
    marginBottom: '1rem',
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
      {loading && <IframeLoadingState />}
      <div
        id="zuora_payment"
        data-test-id="zuora-payment-iframe"
        className={cx(styles.iframeContainer, loading && styles.hide)}
      />
    </>
  );
}

ZuoraCreditCardIframe.propTypes = {
  organizationId: PropTypes.string.isRequired,
  countryCode: PropTypes.string,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func,
};

function IframeLoadingState() {
  return (
    <Form>
      <Grid columns="1fr 1fr">
        <GridItem className={cx(styles.gridItem, styles.gridFullWidth)}>
          <TextField
            name="name"
            id="name"
            labelText="Cardholder Name"
            textInputProps={{ disabled: true }}
          />
        </GridItem>
        <GridItem className={cx(styles.gridItem, styles.gridFullWidth)}>
          <TextField
            name="number"
            id="number"
            labelText="Card Number"
            textInputProps={{ disabled: true }}
          />
        </GridItem>
        <GridItem className={cx(styles.gridItem, styles.gridLeft)}>
          <div className={styles.selectContainer}>
            <SelectField
              name="month"
              id="month"
              labelText="Month"
              selectInputProps={{ disabled: true }}>
              <Option value="">- Select One -</Option>
            </SelectField>
          </div>
          <div className={styles.selectContainer}>
            <SelectField
              name="year"
              id="year"
              labelText="Year"
              selectInputProps={{ disabled: true }}>
              <Option value="">- Select One -</Option>
            </SelectField>
          </div>
        </GridItem>
        <GridItem className={cx(styles.gridItem, styles.gridRight)}>
          <TextField name="cvv" id="cvv" labelText="CVV" textInputProps={{ disabled: true }} />
        </GridItem>
        <GridItem className={cx(styles.submitButton, styles.gridItem, styles.gridFullWidth)}>
          <Button disabled loading>
            Loading...
          </Button>
        </GridItem>
      </Grid>
    </Form>
  );
}
