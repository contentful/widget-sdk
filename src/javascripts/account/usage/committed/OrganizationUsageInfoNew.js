import React from 'react';
import PropTypes from 'prop-types';
import { Typography, Paragraph, TextLink, Heading } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

import { shorten } from 'utils/NumberUtils';

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
  overageNumber: css({
    color: '#9F6312',
    fontSize: tokens.fontSizeS
  })
};
export default class OrganizationUsageInfoNew extends React.Component {
  static propTypes = {
    totalUsage: PropTypes.number.isRequired,
    includedLimit: PropTypes.number.isRequired
  };

  render() {
    const { totalUsage, includedLimit } = this.props;
    return (
      <Typography>
        <Heading element="h2" className={styles.heading}>
          Total API requests
        </Heading>
        <Heading element="p" className={styles.usageNumber}>
          {totalUsage.toLocaleString('en-US')}
          {totalUsage > includedLimit && (
            <small className={styles.overageNumber}>
              {` +${(totalUsage - includedLimit).toLocaleString('en-US')} overage`}
            </small>
          )}
        </Heading>
        <Paragraph>
          Total API calls made this month from a <strong>{`${shorten(includedLimit)}`}</strong>
          /month quota. This number includes CMA, CDA, CPA, and GraphQL requests. To learn about
          utility limits, read the
          <TextLink
            href="https://www.contentful.com/r/knowledgebase/fair-use/"
            target="_blank"
            className="usage-page__learn-more-link">
            Fair Use Policy.
          </TextLink>
        </Paragraph>
      </Typography>
    );
  }
}
