import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import { Paragraph, Subheading } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import cn from 'classnames';

const styles = {
  title: css({
    fontWeight: tokens.fontWeightMedium,
    fontSize: tokens.fontSizeM,
  }),
  fontColor: css({
    color: tokens.colorTextDark,
  }),
};

export const CreditCardInformation = ({ creditCardinfo }) => {
  return (
    <div>
      <Subheading
        className={cn(styles.title, styles.fontColor)}
        element="h4"
        aria-labelledby="credit-card-information-review-section">
        Credit card
      </Subheading>
      <Paragraph className={styles.fontColor}>{creditCardinfo.number}</Paragraph>
      <Paragraph className={styles.fontColor}>{creditCardinfo.experationDate}</Paragraph>
    </div>
  );
};

CreditCardInformation.propTypes = {
  creditCardinfo: PropTypes.object.isRequired,
};
