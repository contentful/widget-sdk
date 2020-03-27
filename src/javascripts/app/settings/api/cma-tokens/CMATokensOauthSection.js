import React from 'react';
import { Paragraph, Typography, Subheading } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { DocsLink } from 'ui/Content';

const styles = {
  pageSection: css({
    marginBottom: tokens.spacing2Xl,
  }),
};

const CMATokensOauthSection = () => (
  <div className={styles.pageSection}>
    <Typography>
      <Subheading element="h2">OAuth tokens</Subheading>
      <Paragraph>
        OAuth tokens are issued by OAuth applications and represent the user who granted access
        through this application. These tokens have the same rights as the owner of the account. You
        can{' '}
        <DocsLink
          text="learn more about OAuth applications in our documentation"
          target="createOAuthApp"
        />
      </Paragraph>
    </Typography>
  </div>
);

export default CMATokensOauthSection;
