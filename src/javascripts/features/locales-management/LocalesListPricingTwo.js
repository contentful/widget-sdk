import React from 'react';
import PropTypes from 'prop-types';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { Heading, Workbench } from '@contentful/forma-36-react-components';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase';
import { LocalesListSidebar } from './LocalesListSidebar';
import { LocalesTable } from './LocalesTable';

function LocalesTitle() {
  return (
    <>
      <Heading>Locales</Heading>
      <span className="workbench-header__kb-link">
        <KnowledgeBase target="locale" />
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
  subscriptionState,
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
          subscriptionState={subscriptionState}
          upgradeSpace={upgradeSpace}
          hasNextSpacePlan={hasNextSpacePlan}
          newApiLocalesLimit={newApiLocalesLimit}
        />
      </Workbench.Sidebar>
    </Workbench>
  );
};

LocalesListPricingTwo.propTypes = {
  locales: PropTypes.object,
  insideMasterEnv: PropTypes.object,
  localeResource: PropTypes.object,
  allowedToEnforceLimits: PropTypes.bool,
  isOrgOwnerOrAdmin: PropTypes.bool,
  subscriptionState: PropTypes.object,
  upgradeSpace: PropTypes.func.isRequired,
  hasNextSpacePlan: PropTypes.bool,
  newApiLocalesLimit: PropTypes.number,
};
