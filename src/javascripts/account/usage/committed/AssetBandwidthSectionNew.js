import React from 'react';
import { css } from 'emotion';
import PropTypes from 'prop-types';
import { partialRight } from 'lodash';
import {
  TextLink,
  Note,
  Typography,
  Heading,
  Paragraph
} from '@contentful/forma-36-react-components';
import * as tokens from '@contentful/forma-36-tokens';

import { shortenStorageUnit } from 'utils/NumberUtils';

const styles = {
  heading: css({
    color: '#536171',
    fontWeight: tokens.fontWeightNormal
  }),
  usageNumber: css({
    color: '#253545',
    fontSize: tokens.fontSize3Xl,
    fontWeight: tokens.fontWeightMedium
  }),
  limit: css({
    fontSize: tokens.fontSizeM
  }),
  includedLimit: css({
    color: '#6A7889'
  }),
  overage: css({
    color: tokens.colorOrangeMid
  }),
  learnMoreLink: css({
    marginLeft: tokens.spacingS
  }),
  note: css({
    width: '40%',
    marginTop: tokens.spacingS,
    color: '#27457A'
  })
};

const AssetBandwidthSection = props => {
  const { limit, usage, uom } = props;

  if (usage == null) {
    return (
      <Typography>
        <Heading element="h2" className={styles.heading}>
          Total asset bandwidth
        </Heading>
        <Paragraph className={styles.usageNumber}>Not available</Paragraph>
        <Note className={styles.note}>
          Note that the asset bandwidth is not displayed in real time; there is a 48 hour delay. To
          learn about utility limits, read the
          <TextLink
            href="https://www.contentful.com/r/knowledgebase/fair-use/"
            className={styles.learnMoreLink}
            target="_blank">
            Fair Use Policy
          </TextLink>
          .
        </Note>
      </Typography>
    );
  }

  const withUnit = partialRight(shortenStorageUnit, uom);

  return (
    <Typography>
      <Heading element="h2" className={styles.heading}>
        Total asset bandwidth
      </Heading>
      <Paragraph className={styles.usageNumber}>{withUnit(usage)}</Paragraph>
      <div className={styles.limit}>
        <strong className={styles.includedLimit}>{`${withUnit(limit)} included`}</strong>
        {usage > limit && (
          <small className={styles.overage}>{` + ${withUnit(usage - limit)} overage`}</small>
        )}
        <TextLink
          href="https://www.contentful.com/r/knowledgebase/fair-use/"
          target="_blank"
          className={styles.learnMoreLink}>
          Fair Use Policy
        </TextLink>
      </div>
    </Typography>
  );
};

AssetBandwidthSection.propTypes = {
  limit: PropTypes.number,
  usage: PropTypes.number,
  uom: PropTypes.string
};

export default AssetBandwidthSection;
