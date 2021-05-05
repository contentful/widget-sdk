import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { WidgetContainer } from './widgets/WidgetContainer';
import { GreetingWidget } from './widgets/GreetingWidget';
import { WalkthroughWidget } from './widgets/walkthrough/WalkthroughWidget';
import { SpaceTrialWidget } from 'features/trials';
import { ContentfulAppsCTA } from './components/ContentfulAppsCTA';
import { ComposeAndLaunchCTA } from './components/ComposeAndLaunchCTA';

export const AuthorEditorSpaceHome = ({ spaceName, orgName, isTrialSpace }) => {
  const [walkthroughStarted, setWalkthroughState] = useState(false);

  return (
    <WidgetContainer>
      <WidgetContainer.Row>
        <WidgetContainer.Col>
          <GreetingWidget
            spaceName={spaceName}
            orgName={orgName}
            walkthroughStarted={walkthroughStarted}
            isTrialSpace={isTrialSpace}
          />
        </WidgetContainer.Col>
      </WidgetContainer.Row>

      <WidgetContainer.Row order={walkthroughStarted && '3'}>
        <WalkthroughWidget spaceName={spaceName} setWalkthroughState={setWalkthroughState} />
      </WidgetContainer.Row>

      <ContentfulAppsCTA />
      <ComposeAndLaunchCTA />

      {/* Placeholder to apply the top margin.
      TODO: update the WidgetContainer styles and remove this placeholder */}
      <WidgetContainer.Row>
        <div />
      </WidgetContainer.Row>

      <WidgetContainer.Row>
        <SpaceTrialWidget />
      </WidgetContainer.Row>
    </WidgetContainer>
  );
};

AuthorEditorSpaceHome.propTypes = {
  spaceName: PropTypes.string,
  orgName: PropTypes.string,
  isTrialSpace: PropTypes.bool,
};
