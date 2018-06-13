import React from 'react';
import {name as FullScreenModule} from '../../../react/molecules/FullScreen';
import {name as SkipModule} from '../components/Skip';
import {name as NavigationModule} from '../components/Navigation';
import {name as ButtonModule} from '../../../react/atoms/Button';
import {name as ContentFlowExplorerModule} from '../explore/ContentFlowExplorer';
import {name as WithLinkModule} from '../components/WithLink';
import {name as ScreenHeaderModule} from './Header';

export const name = 'explore-screen-component';

angular.module('contentful')
.factory(name, ['require', function (require) {
  const FullScreen = require(FullScreenModule);
  const Skip = require(SkipModule);
  const Navigation = require(NavigationModule);
  const Button = require(ButtonModule);
  const ContentFlowExplorer = require(ContentFlowExplorerModule);
  const WithLink = require(WithLinkModule);
  const ScreenHeader = require(ScreenHeaderModule);

  const ExploreScreen = () => {
    const headerTitle = (
      <React.Fragment>
        Explore the&nbsp;
        <strong>
          Gatsby Starter for Contentful
        </strong>
        &nbsp;blog content structure
      </React.Fragment>
    );
    const headerSubtitle = <p>Explore the data flow of the blog, then select a hosting service.</p>;

    return (
      <FullScreen close={<Skip link='explore' />}>
        <Navigation active={2} />
        <ScreenHeader title={headerTitle} subtitle={headerSubtitle} />
        <WithLink trackingElementId='explore_screen_completed' link='deploy'>
          {move => (
            <Button onClick={move} className='modern-stack-onboarding--next-button'>
              Select deployment service
            </Button>
          )}
        </WithLink>
        <ContentFlowExplorer />
      </FullScreen>
    );
  };

  return ExploreScreen;
}]);
