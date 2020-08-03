import React from 'react';
import { css } from 'emotion';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';
import { NewFeaturesImage } from '../illustrations';

import {
  DisplayText,
  Button,
  List,
  ListItem,
  TextLink,
  Icon,
} from '@contentful/forma-36-react-components';
import { Grid } from '@contentful/forma-36-react-components/dist/alpha';

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

export const PricingNewFeatures = ({ onNext }) => (
  <Grid columns={2} rows={1} columnGap="spacingXl" flow="row" className={styles.grid}>
    <div className={styles.content}>
      <DisplayText size="large">Create more complex digital products with</DisplayText>
      <List className={styles.list}>
        <ListItem className={styles.listItem}>access to GraphQL</ListItem>
        <ListItem className={styles.listItem}>48 content types (twice as many!)</ListItem>
        <ListItem className={styles.listItem}>25,000 assets and entries</ListItem>
        <ListItem className={styles.listItem}>an additional role</ListItem>
        <ListItem className={styles.listItem}>4 environments</ListItem>
      </List>
      {onNext ? (
        <Button size="large" onClick={onNext}>
          <span className={styles.alignedButtonLabel}>
            How does this affect me
            <Icon icon="ChevronRight" color="white" size="medium" />
          </span>
        </Button>
      ) : (
        <TextLink
          href="https://www.contentful.com/pricing/?utm_medium=webapp&utm_source=product&utm_campaign=20q3-community-edition-launch"
          rel="noopener noreferrer"
          target="_blank"
          icon="ExternalLink"
          className={styles.link}>
          Learn more
        </TextLink>
      )}
    </div>
    <NewFeaturesImage />
  </Grid>
);

PricingNewFeatures.propTypes = {
  onNext: PropTypes.func,
};
