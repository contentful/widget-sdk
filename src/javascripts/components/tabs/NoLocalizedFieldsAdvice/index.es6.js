import React from 'react';
import Advice from 'components/tabs/Advice/index.es6';
import TranslationsIcon from 'svg/translations-icon.es6';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  container: css({
    marginTop: tokens.spacingXl
  })
};

const NoLocalizedFieldsAdvice = () => (
  <div className={styles.container}>
    <Advice data-test-id="no-localized-fields-advice">
      <Advice.Icon>
        <TranslationsIcon />
      </Advice.Icon>
      <Advice.Title>There are no localized fields for this locale</Advice.Title>
      <Advice.Description>
        The locale you have chosen does no have any localized fields to display. You can see which
        fields are editable by switching to a new locale, or by toggling into the multiple locale
        display.
      </Advice.Description>
    </Advice>
  </div>
);

export default NoLocalizedFieldsAdvice;
