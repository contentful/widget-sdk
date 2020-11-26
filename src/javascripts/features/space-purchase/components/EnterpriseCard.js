import React from 'react';
import cn from 'classnames';
import { css } from 'emotion';
import PropTypes from 'prop-types';

import {
  Heading,
  Paragraph,
  Icon,
  List,
  ListItem,
  SkeletonContainer,
  SkeletonImage,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { EnterpriseTalkToUs } from './EnterpriseTalkToUs';

const styles = {
  mediumWeight: css({
    fontWeight: tokens.fontWeightMedium,
  }),
  centeredText: css({
    textAlign: 'center',
  }),
  enterprise: css({
    backgroundColor: tokens.colorBlueLightest,
    padding: tokens.spacingL,
    display: 'grid',
    gridTemplateRows: '70px auto 1fr auto',
    rowGap: tokens.spacingXs,
    justifyItems: 'center',
    alignItems: 'center',
    textAlign: 'center',
  }),
  enterpriseFeatures: css({
    marginTop: tokens.spacingXs,
    marginBottom: tokens.spacingM,
  }),
  listItem: css({
    display: 'flex',
  }),
  check: css({
    flex: '0 0 18px', // necessary or the check will shrink
    marginTop: '2px', // necessary to center the check with the line height of the text
    marginRight: tokens.spacingXs,
  }),
  textLeft: css({
    textAlign: 'left',
  }),
};

export const EnterpriseCard = ({ organizationId, handleSelect }) => {
  return (
    <div className={styles.enterprise}>
      {/** TODO: replace skeletons with final illustration */}
      <SkeletonContainer svgWidth={70} svgHeight={70}>
        <SkeletonImage />
      </SkeletonContainer>

      <Heading element="h3" className={cn(styles.centeredText, styles.mediumWeight)}>
        Enterprise
      </Heading>

      <span>
        <Paragraph className={styles.textLeft}>Space + Compose + Launch plus:</Paragraph>
        <List className={styles.enterpriseFeatures} testId="platform-limits">
          <ListItem className={cn(styles.listItem, styles.textLeft)}>
            <Icon icon="CheckCircle" color="positive" className={styles.check} />
            <Paragraph>Customization of roles &amp; tasks </Paragraph>
          </ListItem>
          <ListItem className={cn(styles.listItem, styles.textLeft)}>
            <Icon icon="CheckCircle" color="positive" className={styles.check} />
            <Paragraph>
              Access to Professional Services, Solution Architects &amp; Customer Success Managers
            </Paragraph>
          </ListItem>
          <ListItem className={cn(styles.listItem, styles.textLeft)}>
            <Icon icon="CheckCircle" color="positive" className={styles.check} />
            <Paragraph>SSO, Teams, and User Management API</Paragraph>
          </ListItem>
        </List>
      </span>

      <EnterpriseTalkToUs organizationId={organizationId} handleSelect={handleSelect} />
    </div>
  );
};
EnterpriseCard.propTypes = {
  organizationId: PropTypes.string,
  handleSelect: PropTypes.func,
};
