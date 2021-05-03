import React from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { NewCommunityFeaturesImage } from '../illustrations';

import { DisplayText, List, ListItem, TextLink } from '@contentful/forma-36-react-components';
import { Grid } from '@contentful/forma-36-react-components/dist/alpha';
import { websiteUrl } from 'Config';

const styles = {
  grid: css({
    alignItems: 'center',
    height: '100%',
    '@media screen and (min-width: 769px)': {
      gap: `0 ${tokens.spacing3Xl}`,
    },
  }),
  content: css({
    '@media screen and (min-width: 769px)': {
      marginLeft: '40px',
    },
  }),
  list: css({
    color: tokens.colorTextMid,
    marginTop: tokens.spacing2Xl,
    marginBottom: tokens.spacingL,
  }),
  listItem: css({
    listStyleType: 'none',
    fontSize: tokens.fontSize2Xl,
    lineHeight: '44px',
    listStylePosition: 'inside',
    '&::before': {
      marginRight: tokens.spacingM,
      marginTop: tokens.spacingM,
      fontSize: tokens.fontSize2Xl,
      content: `"\\2022"`,
      color: tokens.colorBlueBase,
    },
  }),
  link: css({
    span: { fontSize: tokens.fontSize2Xl },
    'span > div > svg': {
      width: tokens.fontSize2Xl,
      height: tokens.fontSize2Xl,
    },
  }),
  alignedButtonLabel: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
};

export const NewTeamFeatures = () => (
  <Grid columns={2} rows={1} columnGap="spacingXl" flow="row" className={styles.grid}>
    <div className={styles.content}>
      <DisplayText size="large">
        Your Contentful account has been upgraded to our Team tier
      </DisplayText>
      <List className={styles.list}>
        <ListItem className={styles.listItem}>
          Each of your spaces is now mapped to a Medium or Large space on our{' '}
          <TextLink className={styles.link} href={websiteUrl('/pricing')}>
            Team tier
          </TextLink>
        </ListItem>
        <ListItem className={styles.listItem}>No change to pricing</ListItem>
        <ListItem className={styles.listItem}>
          You get access to{' '}
          <TextLink
            className={styles.link}
            href={websiteUrl('developers/docs/tutorials/general/graphql/')}>
            GraphQL
          </TextLink>
        </ListItem>
        <ListItem className={styles.listItem}>
          You get access to{' '}
          <TextLink
            className={styles.link}
            href={websiteUrl('developers/docs/concepts/multiple-environments/')}>
            environments
          </TextLink>
        </ListItem>
        <ListItem className={styles.listItem}>
          You get support for{' '}
          <TextLink
            className={styles.link}
            href={websiteUrl('developers/docs/concepts/rich-text/')}>
            rich text
          </TextLink>
        </ListItem>
        <ListItem className={styles.listItem}>
          And more! Check out{' '}
          <TextLink className={styles.link} href={websiteUrl('/pricing')}>
            the details of your new plan
          </TextLink>{' '}
        </ListItem>
      </List>
    </div>
    <NewCommunityFeaturesImage />
  </Grid>
);