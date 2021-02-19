import React from 'react';
import { cx, css } from 'emotion';
import PropTypes from 'prop-types';

import { Heading, Paragraph, Icon, List, ListItem } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { PLATFORM_CONTENT } from '../utils/platformContent';
import { EnterpriseTalkToUsButton } from './EnterpriseTalkToUsButton';

import EnterpriseIlustration from 'svg/illustrations/apps_purchase_3.svg';
import ExternalTextLink from 'app/common/ExternalTextLink';

const illustrationHeight = '150px';

const styles = {
  mediumWeight: css({
    fontWeight: tokens.fontWeightMedium,
  }),
  centeredText: css({
    textAlign: 'center',
  }),
  illustration: css({
    height: illustrationHeight,
  }),
  enterprise: css({
    backgroundColor: tokens.colorElementLightest,
    padding: tokens.spacingL,
    display: 'grid',
    gridTemplateRows: `${illustrationHeight} auto 1fr auto`,
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
  hidden: css({
    opacity: 0,
  }),
  check: css({
    flex: '0 0 18px', // necessary or the check will shrink
    marginTop: '2px', // necessary to center the check with the line height of the text
    marginRight: tokens.spacingXs,
  }),
  textLeft: css({
    textAlign: 'left',
  }),
  disabled: css({
    opacity: 0.3,
    pointerEvents: 'none',
  }),
};

export const EnterpriseCard = ({ organizationId, onSelect, disabled = false }) => {
  return (
    <div
      className={cx(styles.enterprise, { [styles.disabled]: disabled })}
      data-test-id="enterprise-card">
      <EnterpriseIlustration className={styles.illustration} />

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
            <Paragraph>Larger spaces and no user limits</Paragraph>
          </ListItem>
          <ListItem className={cx(styles.listItem, styles.textLeft)}>
            <Icon icon="CheckCircle" color="positive" className={styles.check} />
            <Paragraph>Customization of roles &amp; tasks</Paragraph>
          </ListItem>
          <ListItem className={cx(styles.listItem, styles.textLeft)}>
            <Icon icon="CheckCircle" color="positive" className={styles.check} />
            <Paragraph>SSO, teams, and user management API</Paragraph>
          </ListItem>
          <ListItem className={cx(styles.listItem, styles.textLeft, styles.spaceLeft)}>
            <Icon icon="CheckCircle" color="positive" className={cx(styles.check, styles.hidden)} />
            <ExternalTextLink href="https://www.contentful.com/pricing/">
              and more!
            </ExternalTextLink>
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
  disabled: PropTypes.bool,
};
