import React from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import DocumentationIll from 'svg/illustrations/space-home-documentation-ill.svg';
import CommunityIll from 'svg/illustrations/community-space-home-Ill.svg';
import CaseStudyIll from 'svg/illustrations/case-study-space-home-ill.svg';
import { Subheading, Paragraph, TextLink, Typography } from '@contentful/forma-36-react-components';
import { trackClickCTA } from '../tracking';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';

const styles = {
  flexContainer: css({ display: 'flex', flexWrap: 'nowrap', justifyContent: 'space-around' }),
  flexChild: css({ maxWidth: '250px', textAlign: 'center' }),
  heading: css({ fontSize: tokens.fontSizeL, marginTop: tokens.spacingXs }),
  illustration: css({ maxHeight: '130px' }),
};

const withInAppHelpUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'learn-about-contentful',
  campaign: 'in-app-help',
});

export const LearnAboutContentful = () => {
  return (
    <div className={styles.flexContainer}>
      <div className={styles.flexChild}>
        <CaseStudyIll className={styles.illustration} />
        <Typography>
          <Subheading className={styles.heading}>View Contentful case studies</Subheading>
          <Paragraph>Learn about customer projects running on Contentful.</Paragraph>
          <TextLink
            onClick={() => trackClickCTA('case_studies_link')}
            href={withInAppHelpUtmParams('https://www.contentful.com/customers/')}
            target="_blank"
            rel="noopener noreferrer">
            View case studies
          </TextLink>
        </Typography>
      </div>
      <div className={styles.flexChild}>
        <DocumentationIll className={styles.illustration} />
        <Typography>
          <Subheading className={styles.heading}>View Contentful documentation</Subheading>
          <Paragraph>Get step-by-step guides and learn about Contentful concepts.</Paragraph>
          <TextLink
            onClick={() => trackClickCTA('documentation_link')}
            href={withInAppHelpUtmParams('https://www.contentful.com/developers/docs/')}
            target="_blank"
            rel="noopener noreferrer">
            View documentation
          </TextLink>
        </Typography>
      </div>
      <div className={styles.flexChild}>
        <CommunityIll className={styles.illustration} />
        <Typography>
          <Subheading className={styles.heading}>Join the Contentful community</Subheading>
          <Paragraph>Ask questions and learn from others in our Slack group and forums. </Paragraph>
          <TextLink
            onClick={() => trackClickCTA('community_link')}
            href={withInAppHelpUtmParams('https://www.contentful.com/developers/')}
            target="_blank"
            rel="noopener noreferrer">
            Join Contentful community
          </TextLink>
        </Typography>
      </div>
    </div>
  );
};
