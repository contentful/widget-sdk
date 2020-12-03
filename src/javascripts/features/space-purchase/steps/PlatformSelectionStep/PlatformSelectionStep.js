import React, { useContext, useState } from 'react';
import cn from 'classnames';
import { css } from 'emotion';
import PropTypes from 'prop-types';

import { Grid, GridItem } from '@contentful/forma-36-react-components/dist/alpha';
import { Heading } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { websiteUrl } from 'Config';
import ExternalTextLink from 'app/common/ExternalTextLink';

import { SpacePurchaseState } from '../../context';
import { EVENTS } from '../../utils/analyticsTracking';
import { PLATFORM_CONTENT, PLATFORM_TYPES } from '../../utils/platformContent';
import { PlatformCard } from '../../components/PlatformCard';
import { EnterpriseCard } from '../../components/EnterpriseCard';
import { CONTACT_SALES_HREF } from '../../components/EnterpriseTalkToUsButton';

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
};

// TODO: this is a placeholder url, update with link to packages comparison
export const PACKAGES_COMPARISON_HREF = websiteUrl('pricing/#feature-overview');

export const PlatformSelectionStep = ({ track }) => {
  const {
    state: { organization },
  } = useContext(SpacePurchaseState);

  const [selectedPlatform, setSelectedPlatform] = useState('');

  return (
    <section aria-labelledby="platform-selection-section" data-test-id="platform-selection-section">
      <Grid columns={3} rows="repeat(4, 'auto')" columnGap="spacingL">
        <GridItem columnStart={1} columnEnd={4} className={styles.headingContainer}>
          <Heading
            id="platform-selection-heading"
            element="h2"
            className={cn(styles.fullRow, styles.mediumWeight, styles.heading)}>
            Choose the package that fits your organization needs
          </Heading>

          <ExternalTextLink
            testId="package-comparison-link"
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
              onClick={() => setSelectedPlatform(platform.type)}
              content={content}
              isNew={platform.type === PLATFORM_TYPES.SPACE_COMPOSE_LAUNCH}
            />
          );
        })}

        <EnterpriseCard
          organizationId={organization?.sys.id}
          handleSelect={track(EVENTS.EXTERNAL_LINK_CLICKED, {
            href: CONTACT_SALES_HREF,
            intent: 'upgrade_to_enterprise',
          })}
        />
      </Grid>
    </section>
  );
};
PlatformSelectionStep.propTypes = {
  track: PropTypes.func.isRequired,
};
