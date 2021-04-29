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

export const NewCommunityFeatures = () => (
  <Grid columns={2} rows={1} columnGap="spacingXl" flow="row" className={styles.grid}>
    <div className={styles.content}>
      <DisplayText size="large">
        Your Contentful account has been upgraded to our Community tier
      </DisplayText>
      <List className={styles.list}>
        <ListItem className={styles.listItem}>
          you now have a single permanent Community space{' '}
        </ListItem>
        <ListItem className={styles.listItem}>
          other spaces will be archived after 6 months
        </ListItem>
        <ListItem className={styles.listItem}>
          you get access to{' '}
          <TextLink
            className={styles.link}
            href={websiteUrl('developers/docs/tutorials/general/graphql/')}>
            GraphQL
          </TextLink>
        </ListItem>
        <ListItem className={styles.listItem}>
          you get access to{' '}
          <TextLink
            className={styles.link}
            href={websiteUrl('developers/docs/concepts/multiple-environments/')}>
            environments
          </TextLink>{' '}
          within your space
        </ListItem>
        <ListItem className={styles.listItem}>
          you get access for{' '}
          <TextLink
            className={styles.link}
            href={websiteUrl('developers/docs/concepts/rich-text/')}>
            rich text support
          </TextLink>
        </ListItem>
        <ListItem className={styles.listItem}>
          and access to many other of the latest of Contentful - check out{' '}
          <TextLink className={styles.link} href={websiteUrl('/pricing')}>
            the details of your new plan
          </TextLink>{' '}
        </ListItem>
      </List>
    </div>
    <NewCommunityFeaturesImage />
  </Grid>
);
