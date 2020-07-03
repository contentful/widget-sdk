import React from 'react';
import { css } from 'emotion';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';
import { AssignedSpaceImage } from '../illustrations';
import { DisplayText, List, ListItem, TextLink } from '@contentful/forma-36-react-components';
import { Grid, GridItem } from '@contentful/forma-36-react-components/dist/alpha';

const styles = {
  grid: css({ alignItems: 'center' }),
  content: css({ marginRight: '80px' }),
  list: css({
    color: tokens.colorTextMid,
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingL,
  }),
  listItem: css({
    listStyleType: 'none',
    fontSize: tokens.fontSize2Xl,
    lineHeight: '44px',
    display: 'flex',
    '&::before': {
      marginRight: tokens.spacingM,
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
};

export const PricingAssignedCommunitySpace = ({ communitySpaceName, microSpaceNames }) => (
  <Grid columns={2} rows={1} columnGap="spacing3Xl" flow="row" className={styles.grid}>
    <GridItem>
      <AssignedSpaceImage />
    </GridItem>
    <GridItem>
      <div className={styles.content}>
        {microSpaceNames && microSpaceNames.length > 0 ? (
          <>
            <DisplayText size="large">You have 1 free community space per organization</DisplayText>
            <List className={styles.list}>
              <ListItem className={styles.listItem}>
                {communitySpaceName} has been assigned as your community space
              </ListItem>
              {microSpaceNames.map((spaceName, index) => (
                <ListItem key={index} className={styles.listItem}>
                  {spaceName} will remain a micro space
                </ListItem>
              ))}
            </List>
          </>
        ) : (
          <DisplayText size="large" className={css({ marginBottom: tokens.spacingL })}>
            {communitySpaceName} has been assigned as your community space
          </DisplayText>
        )}
        <TextLink
          href="https://www.contentful.com/pricing/"
          rel="noopener noreferrer"
          target="_blank"
          icon="ExternalLink"
          className={styles.link}>
          Learn more
        </TextLink>
      </div>
    </GridItem>
  </Grid>
);

PricingAssignedCommunitySpace.propTypes = {
  communitySpaceName: PropTypes.string.isRequired,
  microSpaceNames: PropTypes.array,
};
