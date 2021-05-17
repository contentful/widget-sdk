import React from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { Heading, Workbench } from '@contentful/forma-36-react-components';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase';
import { LocalesListSidebar } from './LocalesListSidebar';
import { LocalesTable } from './LocalesTable';

const styles = {
  knowledgeBaseIcon: css({
    lineHeight: tokens.lineHeightXl,
    marginLeft: tokens.spacing2Xs,
    padding: `0 ${tokens.spacing2Xs}`,
    fontSize: tokens.fontSizeXl,
    display: 'flex',
  }),
};

function LocalesTitle() {
  return (
    <>
      <Heading>Locales</Heading>
      <span className={styles.knowledgeBaseIcon}>
        <KnowledgeBase target="locale" asIcon />
      </span>
    </>
  );
}

export const LocalesListPricingTwo = ({
  locales,
  insideMasterEnv,
  localeResource,
  allowedToEnforceLimits,
  isOrgOwnerOrAdmin,
  upgradeSpace,
  hasNextSpacePlan,
  newApiLocalesLimit,
}) => {
  return (
    <Workbench testId="locale-list-workbench">
      <Workbench.Header
        icon={<ProductIcon icon="Settings" size="large" />}
        title={<LocalesTitle />}
      />
      <Workbench.Content type="full">
        <LocalesTable locales={locales} />
      </Workbench.Content>
      <Workbench.Sidebar position="right">
        <LocalesListSidebar
          insideMasterEnv={insideMasterEnv}
          localeResource={localeResource}
          allowedToEnforceLimits={allowedToEnforceLimits}
          isOrgOwnerOrAdmin={isOrgOwnerOrAdmin}
          upgradeSpace={upgradeSpace}
          hasNextSpacePlan={hasNextSpacePlan}
          newApiLocalesLimit={newApiLocalesLimit}
        />
      </Workbench.Sidebar>
    </Workbench>
  );
};

LocalesListPricingTwo.propTypes = {
  locales: PropTypes.array,
  insideMasterEnv: PropTypes.bool,
  localeResource: PropTypes.object,
  allowedToEnforceLimits: PropTypes.bool,
  isOrgOwnerOrAdmin: PropTypes.bool,
  upgradeSpace: PropTypes.func.isRequired,
  hasNextSpacePlan: PropTypes.bool,
  newApiLocalesLimit: PropTypes.number,
};
