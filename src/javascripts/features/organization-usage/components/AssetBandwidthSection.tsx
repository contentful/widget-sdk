import React from 'react';
import { css } from 'emotion';
import { partialRight } from 'lodash';
import {
  TextLink,
  Note,
  Typography,
  Heading,
  Paragraph,
  SkeletonContainer,
  SkeletonDisplayText,
  SkeletonBodyText,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { track } from 'analytics/Analytics';
import { shortenStorageUnit } from 'utils/NumberUtils';
import { useUsageState } from '../hooks/usageContext';

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

export const AssetBandwidthSection = () => {
  const { assetBandwidthData, isLoading } = useUsageState();

  const { limit, usage, uom } = assetBandwidthData ?? {};

  // Show loading state once at the initial data fetch
  const isPageLoading = isLoading && !assetBandwidthData;

  const withUnit = partialRight(shortenStorageUnit, uom);
  const handleClick = () => {
    track('usage:fair_use_policy_clicked', { source: 'Asset Bandwidth' });
  };

  const UsageAndLimit = () => (
    <>
      <Paragraph data-test-id="asset-bandwidth-usage" className={styles.usageNumber}>
        {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          withUnit(usage)
        }
      </Paragraph>
      <div className={styles.limit}>
        <strong data-test-id="asset-bandwidth-limit" className={styles.includedLimit}>{
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          `${withUnit(limit)} included`
        }</strong>
        {usage > limit && (
          <small className={styles.overage} data-test-id="asset-bandwidth-overage">
            {' '}
            +{' '}
            {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              withUnit(usage - limit)
            }{' '}
            overage
          </small>
        )}
        <TextLink
          href="https://www.contentful.com/r/knowledgebase/fair-use/"
          target="_blank"
          onClick={handleClick}
          data-test-id="fair_use_policy_link"
          rel="noopener noreferrer"
          className={styles.learnMoreLink}>
          Fair Use Policy
        </TextLink>
      </div>
    </>
  );

  return (
    <Typography>
      <Heading element="h2" className={styles.heading}>
        Total asset bandwidth
      </Heading>
      {isPageLoading && (
        <SkeletonContainer svgWidth="40%" svgHeight="80px">
          <SkeletonDisplayText numberOfLines={1} />
          <SkeletonBodyText numberOfLines={1} offsetTop={50} />
        </SkeletonContainer>
      )}
      {!isPageLoading && <UsageAndLimit />}
      <Note className={styles.note}>
        Please note that asset bandwidth is calculated daily with a 48 hour delay.
      </Note>
    </Typography>
  );
};
