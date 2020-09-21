import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import { Paragraph, Subheading } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import cn from 'classnames';
import moment from 'moment';
import _ from 'lodash';

const styles = {
  title: css({
    fontWeight: tokens.fontWeightMedium,
    fontSize: tokens.fontSizeM,
  }),
  fontColor: css({
    color: tokens.colorTextDark,
  }),
};

export const CreditCardInformation = ({ creditCardInfo }) => {
  return (
    <div>
      <Subheading
        className={cn(styles.title, styles.fontColor)}
        element="h4"
        aria-labelledby="credit-card-information-review-section">
        Credit card
      </Subheading>

      <Paragraph testId="card-details">
        {pieces(creditCardInfo.number, 4).join(' ')} <br />
        {moment()
          .month(creditCardInfo.expirationDate.month - 1)
          .format('MM')}
        /{creditCardInfo.expirationDate.year}
      </Paragraph>
    </div>
  );
};

CreditCardInformation.propTypes = {
  creditCardInfo: PropTypes.object.isRequired,
};

function pieces(string, pieceSize = Infinity) {
  const chars = string.split('');

  return _.chunk(chars, pieceSize).map((splitPiece) => splitPiece.join(''));
}
