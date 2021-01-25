import React from 'react';
import { cx, css } from 'emotion';
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

import { PLATFORM_CONTENT } from '../utils/platformContent';
import { EnterpriseTalkToUsButton } from './EnterpriseTalkToUsButton';

const styles = {
  mediumWeight: css({
    fontWeight: tokens.fontWeightMedium,
  }),
  centeredText: css({
    textAlign: 'center',
  }),
  enterprise: css({
    backgroundColor: tokens.colorElementLightest,
    padding: tokens.spacingL,
    display: 'grid',
    gridTemplateRows: '70px auto 1fr auto',
    rowGap: tokens.spacingXs,
    justifyItems: 'center',
    alignItems: 'center',
    textAlign: 'center',
    borderRadius: tokens.borderRadiusMedium,
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

export const EnterpriseCard = ({ organizationId, onSelect }) => {
  return (
    <div className={styles.enterprise} data-test-id="enterprise-card">
      {/** TODO: replace skeletons with final illustration */}
      <SkeletonContainer svgWidth={70} svgHeight={70}>
        <SkeletonImage />
      </SkeletonContainer>

      <Heading element="h3" className={cx(styles.centeredText, styles.mediumWeight)}>
        Enterprise
      </Heading>

      <span>
        <Paragraph className={styles.textLeft}>
          {PLATFORM_CONTENT.composePlatform.title} plus:
        </Paragraph>
        <List className={styles.enterpriseFeatures} testId="platform-limits">
          <ListItem className={cx(styles.listItem, styles.textLeft)}>
            <Icon icon="CheckCircle" color="positive" className={styles.check} />
            <Paragraph>Customization of roles &amp; tasks </Paragraph>
          </ListItem>
          <ListItem className={cx(styles.listItem, styles.textLeft)}>
            <Icon icon="CheckCircle" color="positive" className={styles.check} />
            <Paragraph>
              Access to Professional Services, Solution Architects &amp; Customer Success Managers
            </Paragraph>
          </ListItem>
          <ListItem className={cx(styles.listItem, styles.textLeft)}>
            <Icon icon="CheckCircle" color="positive" className={styles.check} />
            <Paragraph>SSO, Teams, and User Management API</Paragraph>
          </ListItem>
        </List>
      </span>

      <EnterpriseTalkToUsButton organizationId={organizationId} onSelect={onSelect} />
    </div>
  );
};
EnterpriseCard.propTypes = {
  organizationId: PropTypes.string,
  onSelect: PropTypes.func,
};
