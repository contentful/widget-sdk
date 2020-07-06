import React from 'react';
import {
  Typography,
  Paragraph,
  TextLink,
  Heading,
  SkeletonContainer,
  SkeletonDisplayText,
  SkeletonBodyText,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { track } from 'analytics/Analytics';
import { css } from 'emotion';
import { shorten } from 'utils/NumberUtils';
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
  overageNumber: css({
    color: '#9F6312',
    fontSize: tokens.fontSizeS,
  }),
};

export const OrganizationUsageInfo = () => {
  const { totalUsage, apiRequestIncludedLimit, isLoading } = useUsageState();

  const limitedUsage = !!apiRequestIncludedLimit;

  const handleClick = () => {
    track('usage:fair_use_policy_clicked');
  };

  return (
    <Typography>
      <Heading element="h2" className={styles.heading}>
        Total API requests
      </Heading>
      {isLoading && (
        <SkeletonContainer>
          <SkeletonDisplayText numberOfLines={1} />
          <SkeletonBodyText numberOfLines={4} offsetTop={55} />
        </SkeletonContainer>
      )}
      {!isLoading && (
        <>
          <Paragraph data-test-id="org-usage-total" className={styles.usageNumber}>
            {totalUsage.toLocaleString('en-US')}
            {limitedUsage && totalUsage > apiRequestIncludedLimit && (
              <small data-test-id="org-usage-overage" className={styles.overageNumber}>
                {` +${(totalUsage - apiRequestIncludedLimit).toLocaleString('en-US')} overage`}
              </small>
            )}
          </Paragraph>
          <Paragraph>
            {limitedUsage ? (
              <>
                {'Total API calls made this month from a '}
                <strong data-test-id="org-usage-limit">{shorten(apiRequestIncludedLimit)}</strong>
                {
                  '/month quota. This number includes CMA, CDA, CPA, and GraphQL requests. The use of Contentful is subject to our '
                }
              </>
            ) : (
              'This number includes CMA, CDA, CPA, and GraphQL requests. The use of Contentful is subject to our '
            )}
            <TextLink
              href="https://www.contentful.com/r/knowledgebase/fair-use/"
              target="_blank"
              data-test-id="fair_use_policy_link"
              onClick={handleClick}
              rel="noopener noreferrer">
              Fair Use Policy
            </TextLink>
            .
          </Paragraph>
        </>
      )}
    </Typography>
  );
};
