import React from 'react';
import Icon from 'ui/Components/Icon';
import Button from 'components/shared/stack-onboarding/components/Button';
import FullScreen from 'components/shared/stack-onboarding/components/FullScreen';
import Skip from 'components/shared/stack-onboarding/components/Skip';
import WithLink from 'components/shared/stack-onboarding/components/WithLink';
import ScreenHeader from 'components/shared/stack-onboarding/screens/Header';
import Navigation from 'components/shared/stack-onboarding/components/Navigation';
import ContentFlowExplorer from 'components/shared/stack-onboarding/explore/ContentFlowExplorer';

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
