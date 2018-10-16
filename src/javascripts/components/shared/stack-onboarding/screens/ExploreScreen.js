import React from 'react';
import { name as SkipModule } from '../components/Skip';
import { name as NavigationModule } from '../components/Navigation';
import { name as ContentFlowExplorerModule } from '../explore/ContentFlowExplorer';
import { name as WithLinkModule } from '../components/WithLink';
import { name as ScreenHeaderModule } from './Header';

export const name = 'explore-screen-component';

angular.module('contentful').factory(name, [
  'require',
  function(require) {
    const FullScreen = require('components/react/molecules/FullScreen.es6').default;
    const Skip = require(SkipModule);
    const Navigation = require(NavigationModule);
    const Button = require('components/react/atoms/Button.es6').default;
    const ContentFlowExplorer = require(ContentFlowExplorerModule);
    const WithLink = require(WithLinkModule);
    const ScreenHeader = require(ScreenHeaderModule);
    const Icon = require('ui/Components/Icon.es6').default;

    const ExploreScreen = () => {
      const headerTitle = (
        <React.Fragment>
          Explore the&nbsp;
          <strong>Gatsby Starter for Contentful</strong>
          &nbsp;blog content structure.
        </React.Fragment>
      );
      const headerSubtitle = (
        <p>Explore the data flow of the blog, then select a hosting service.</p>
      );

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

    return ExploreScreen;
  }
]);
