import React, { useContext, useState } from 'react';
import cn from 'classnames';
import { css } from 'emotion';
import PropTypes from 'prop-types';

import { Grid, GridItem } from '@contentful/forma-36-react-components/dist/alpha';
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

import { websiteUrl } from 'Config';
import ExternalTextLink from 'app/common/ExternalTextLink';

import { SpacePurchaseState } from '../../context';
import { EVENTS } from '../../utils/analyticsTracking';
import { PLATFORM_CONTENT, PLATFORM_TYPES } from '../../utils/platformContent';
import { PlatformCard } from '../../components/PlatformCard';
import { EnterpriseTalkToUs, CONTACT_SALES_HREF } from '../../components/EnterpriseTalkToUs';

const styles = {
  fullRow: css({
    gridColumn: '1 / 4',
  }),
  headingContainer: css({
    marginBottom: tokens.spacingL,
  }),
  heading: css({
    marginBottom: tokens.spacingXs,
  }),
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

// TODO: this is a placeholder url, update with link to packages comparison
const PACKAGES_COMPARISON_HREF = websiteUrl('pricing/#feature-overview');

export const PlatformSelectionStep = ({ track }) => {
  const {
    state: { organization },
  } = useContext(SpacePurchaseState);

  const [selectedPlatform, setSelectedPlatform] = useState('');

  return (
    <section aria-labelledby="platform-selection-section" data-test-id="space-selection-section">
      <Grid columns={3} rows="repeat(4, 'auto')" columnGap="spacingL">
        <GridItem columnStart={1} columnEnd={4} className={styles.headingContainer}>
          <Heading
            id="platform-selection-heading"
            element="h2"
            className={cn(styles.fullRow, styles.mediumWeight, styles.heading)}
            testId="platform-selection.heading">
            Choose the package that fits your organization needs
          </Heading>

          <ExternalTextLink
            testId="platform-selection.package-comparison-link"
            href={PACKAGES_COMPARISON_HREF}
            onClick={() => {
              track(EVENTS.EXTERNAL_LINK_CLICKED, {
                href: PACKAGES_COMPARISON_HREF,
                intent: 'packages_comparison',
              });
            }}>
            See comparison packages
          </ExternalTextLink>
        </GridItem>

        {PLATFORM_CONTENT.map((platform, idx) => {
          const content = {
            title: platform.title,
            description: platform.description,
            price: platform.price,
          };

          return (
            <PlatformCard
              key={idx}
              selected={selectedPlatform === platform.type}
              handleClick={() => setSelectedPlatform(platform.type)}
              content={content}
              isNew={platform.type === PLATFORM_TYPES.SPACE_COMPOSE_LAUNCH}
            />
          );
        })}

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
                  Access to Professional Services, Solution Architects &amp; Customer Success
                  Managers
                </Paragraph>
              </ListItem>
              <ListItem className={cn(styles.listItem, styles.textLeft)}>
                <Icon icon="CheckCircle" color="positive" className={styles.check} />
                <Paragraph>SSO, Teams, and User Management API</Paragraph>
              </ListItem>
            </List>
          </span>

          <EnterpriseTalkToUs
            organizationId={organization?.sys.id}
            handleSelect={() =>
              track(EVENTS.EXTERNAL_LINK_CLICKED, {
                href: CONTACT_SALES_HREF,
                intent: 'upgrade_to_enterprise',
              })
            }
          />
        </div>
      </Grid>
    </section>
  );
};

PlatformSelectionStep.propTypes = {
  track: PropTypes.func.isRequired,
};
