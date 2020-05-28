import React from 'react';
import PropTypes from 'prop-types';
import { Typography, Paragraph, TextLink, Heading } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

import { shorten } from 'utils/NumberUtils';

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

const OrganizationUsageInfo = (props) => {
  const { totalUsage, includedLimit } = props;
  const limitedUsage = !!includedLimit;

  return (
    <Typography>
      <Heading element="h2" className={styles.heading}>
        Total API requests
      </Heading>
      <Paragraph data-test-id="org-usage-total" className={styles.usageNumber}>
        {totalUsage.toLocaleString('en-US')}
        {limitedUsage && totalUsage > includedLimit && (
          <small data-test-id="org-usage-overage" className={styles.overageNumber}>
            {` +${(totalUsage - includedLimit).toLocaleString('en-US')} overage`}
          </small>
        )}
      </Paragraph>
      {limitedUsage ? (
        <Paragraph>
          Total API calls made this month from a{' '}
          <strong data-test-id="org-usage-limit">{`${shorten(includedLimit)}`}</strong>
          /month quota. This number includes CMA, CDA, CPA, and GraphQL requests. To learn about
          utility limits, read the{' '}
          <TextLink
            href="https://www.contentful.com/r/knowledgebase/fair-use/"
            target="_blank"
            rel="noopener noreferrer">
            Fair Use Policy
          </TextLink>
          .
        </Paragraph>
      ) : (
        <Paragraph>
          This number includes CMA, CDA, CPA, and GraphQL requests. The use of Contentful is subject
          to our{' '}
          <TextLink
            href="https://www.contentful.com/r/knowledgebase/fair-use/"
            target="_blank"
            rel="noopener noreferrer">
            Fair Use Policy
          </TextLink>
          .
        </Paragraph>
      )}
    </Typography>
  );
};

OrganizationUsageInfo.propTypes = {
  totalUsage: PropTypes.number.isRequired,
  includedLimit: PropTypes.number.isRequired,
};

export default OrganizationUsageInfo;
