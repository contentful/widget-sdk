import React from 'react';
import { css } from 'emotion';
import PropTypes from 'prop-types';
import { partialRight } from 'lodash';
import {
  TextLink,
  Note,
  Typography,
  Heading,
  Paragraph,
} from '@contentful/forma-36-react-components';
import * as tokens from '@contentful/forma-36-tokens';

import { shortenStorageUnit } from 'utils/NumberUtils';

const styles = {
  heading: css({
    color: '#536171',
    fontWeight: tokens.fontWeightNormal,
  }),
  usageNumber: css({
    color: '#253545',
    fontSize: tokens.fontSize3Xl,
    fontWeight: tokens.fontWeightMedium,
  }),
  limit: css({
    fontSize: tokens.fontSizeM,
  }),
  includedLimit: css({
    color: '#6A7889',
  }),
  overage: css({
    color: tokens.colorOrangeMid,
  }),
  learnMoreLink: css({
    marginLeft: tokens.spacingS,
  }),
  note: css({
    width: '40%',
    marginTop: tokens.spacingS,
    color: '#27457A',
  }),
};

const AssetBandwidthSection = ({ limit, usage, uom }) => {
  const withUnit = partialRight(shortenStorageUnit, uom);

  return (
    <Typography>
      <Heading element="h2" className={styles.heading}>
        Total asset bandwidth
      </Heading>
      <Paragraph data-test-id="asset-bandwidth-usage" className={styles.usageNumber}>
        {withUnit(usage)}
      </Paragraph>
      <div className={styles.limit}>
        <strong data-test-id="asset-bandwidth-limit" className={styles.includedLimit}>{`${withUnit(
          limit
        )} included`}</strong>
        {usage > limit && (
          <small className={styles.overage} data-test-id="asset-bandwidth-overage">
            {' '}
            + {withUnit(usage - limit)} overage
          </small>
        )}
        <TextLink
          href="https://www.contentful.com/r/knowledgebase/fair-use/"
          target="_blank"
          className={styles.learnMoreLink}>
          Fair Use Policy
        </TextLink>
        <Note className={styles.note}>
          Please note that asset bandwidth is calculated daily with a 48 hour delay.
        </Note>
      </div>
    </Typography>
  );
};

AssetBandwidthSection.propTypes = {
  limit: PropTypes.number.isRequired,
  usage: PropTypes.number.isRequired,
  uom: PropTypes.string.isRequired,
};

export default AssetBandwidthSection;
