import React from 'react';
import PropTypes from 'prop-types';
import ModifyContentDrawer from 'components/shared/stack-onboarding/next_steps/ModifyContentDrawer';
import SetupWebhooksDrawer from 'components/shared/stack-onboarding/next_steps/SetupWebhooksDrawer';
import AccordionComponent from 'app/home/components/AccordionComponent';
import { getStore } from 'TheStore';
import { getStoragePrefix } from 'components/shared/auto_create_new_space/CreateModernOnboarding';

const store = getStore();

const DevChoiceAccordion = ({ managementToken, entry, spaceId }) => {
  const prefix = getStoragePrefix();
  const deploymentProvider = store.get(`${prefix}:deploymentProvider`);
  return (
    <AccordionComponent
      drawersContent={[
        {
          headerText: (
            <>
              Modify the{' '}
              <span className="f36-font-weight--demi-bold">Gatsby Starter for Contentful</span> blog
              content with 1 API call
            </>
          ),
          content: (
            <ModifyContentDrawer
              managementToken={managementToken}
              entry={entry}
              spaceId={spaceId}
            />
          )
        },

        {
          headerText: (
            <>
              <span className="f36-font-weight--demi-bold">
                Automate rebuilds of the Gatsby Starter for Contentful blog with webhooks
              </span>
            </>
          ),
          content: <SetupWebhooksDrawer deploymentProvider={deploymentProvider} />
        }
      ]}
    />
  );
};

DevChoiceAccordion.propTypes = {
  managementToken: PropTypes.string.isRequired,
  entry: PropTypes.object.isRequired,
  spaceId: PropTypes.string.isRequired
};

export default DevChoiceAccordion;
