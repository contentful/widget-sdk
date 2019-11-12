import React from 'react';
import PropTypes from 'prop-types';
import Advice from 'components/tabs/Advice';
import TranslationsIcon from 'svg/translations-icon';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  container: css({
    marginTop: tokens.spacingXl
  })
};

const getDescription = localeName => `
  There are no localized fields to translate for ${localeName}. You can
  switch to a different locale using "Translation" in your sidebar.
`;

const NoLocalizedFieldsAdvice = ({ localeName }) => (
  <div className={styles.container}>
    <Advice data-test-id="no-localized-fields-advice">
      <Advice.Icon>
        <TranslationsIcon />
      </Advice.Icon>
      <Advice.Title>There are no fields to translate</Advice.Title>
      <Advice.Description>{getDescription(localeName)}</Advice.Description>
    </Advice>
  </div>
);

NoLocalizedFieldsAdvice.propTypes = {
  localeName: PropTypes.string.isRequired
};

export default NoLocalizedFieldsAdvice;
