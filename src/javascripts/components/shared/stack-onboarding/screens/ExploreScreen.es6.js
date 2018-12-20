import React from 'react';
import Icon from 'ui/Components/Icon.es6';
import Button from 'components/react/atoms/Button.es6';
import FullScreen from 'components/react/molecules/FullScreen.es6';
import Skip from 'components/shared/stack-onboarding/components/Skip.es6';
import WithLink from 'components/shared/stack-onboarding/components/WithLink.es6';
import ScreenHeader from 'components/shared/stack-onboarding/screens/Header.es6';
import Navigation from 'components/shared/stack-onboarding/components/Navigation.es6';
import ContentFlowExplorer from 'components/shared/stack-onboarding/explore/ContentFlowExplorer.es6';

const ExploreScreen = () => {
  const headerTitle = (
    <React.Fragment>
      Explore the&nbsp;
      <strong>Gatsby Starter for Contentful</strong>
      &nbsp;blog content structure.
    </React.Fragment>
  );
  const headerSubtitle = <p>Explore the data flow of the blog, then select a hosting service.</p>;

  return (
    <FullScreen close={<Skip link="explore" />}>
      <Navigation active={2} />
      <ScreenHeader title={headerTitle} subtitle={headerSubtitle} />
      <WithLink
        intercomKey="onboardingExploreCompleted"
        trackingElementId="explore_screen_completed"
        link="deploy">
        {move => (
          <Button
            onClick={move}
            className="modern-stack-onboarding--next-button"
            data-test-id="onboarding-select-hosting-cta">
            Select hosting service
          </Button>
        )}
      </WithLink>
      <div className="modern-stack-onboarding--floating-hint">
        <p>Hover over the left panel to see the data flow of the blog.</p>
        <Icon
          name="icon-onboarding-arrow"
          className="modern-stack-onboarding--floating-hint-arrow"
        />
      </div>
      <ContentFlowExplorer />
    </FullScreen>
  );
};

export default ExploreScreen;
