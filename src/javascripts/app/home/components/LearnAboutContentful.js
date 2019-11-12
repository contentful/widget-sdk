import React from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import DocumentationIll from 'svg/space-home-documentation-ill';
import CommunityIll from 'svg/community-space-home-Ill';
import CaseStudyIll from 'svg/case-study-space-home-ill';
import { Subheading, Paragraph, TextLink, Typography } from '@contentful/forma-36-react-components';
import { trackClickCTA } from '../tracking';

const styles = {
  flexContainer: css({ display: 'flex', flexWrap: 'nowrap', justifyContent: 'space-around' }),
  flexChild: css({ maxWidth: '250px', textAlign: 'center' }),
  heading: css({ fontSize: tokens.fontSizeL, marginTop: tokens.spacingXs }),
  illustration: css({ maxHeight: '130px' })
};

const LearnAboutContentful = () => {
  return (
    <div className={styles.flexContainer}>
      <div className={styles.flexChild}>
        <CaseStudyIll className={styles.illustration} />
        <Typography>
          <Subheading className={styles.heading}>View Contentful case studies</Subheading>
          <Paragraph>Learn about customer projects running on Contentful.</Paragraph>
          <TextLink
            onClick={() => trackClickCTA('case_studies_link')}
            href="https://www.contentful.com/customers/"
            target="_blank">
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
            href="https://www.contentful.com/developers/docs/"
            target="_blank">
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
            href="https://www.contentful.com/developers/"
            target="_blank">
            Join Contentful community
          </TextLink>
        </Typography>
      </div>
    </div>
  );
};

export default LearnAboutContentful;
