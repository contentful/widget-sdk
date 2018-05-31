import React from 'react';
import createReactClass from 'create-react-class';

import {name as FullScreenModule} from '../../../react/molecules/FullScreen';
import {name as SkipModule} from '../components/Skip';
import {name as NavigationModule} from '../components/Navigation';
import {name as ButtonModule} from '../../../react/atoms/Button';
import {name as ContentFlowExplorerModule} from '../explore/ContentFlowExplorer';
import {name as WithLinkModule} from '../components/WithLink';

export const name = 'explore-screen-component';

angular.module('contentful')
.factory(name, ['require', function (require) {
  const FullScreen = require(FullScreenModule);
  const Skip = require(SkipModule);
  const Navigation = require(NavigationModule);
  const Button = require(ButtonModule);
  const ContentFlowExplorer = require(ContentFlowExplorerModule);
  const WithLink = require(WithLinkModule);

  const ExploreScreen = createReactClass({
    renderHeader () {
      return (
        <React.Fragment>
          <h1 className={'modern-stack-onboarding--title'}>
            {'Explore the '}
            <strong>
              {'Gatsby Starter for Contentful'}
            </strong>
            {' blog content structure.'}
          </h1>
          <h3 className={'modern-stack-onboarding--subtitle'}>
            {'Hover and compare tab views to see the data flow of the website.'}
            <br />
            {'When you\'re ready, move on to the next deploy step.'}
          </h3>
          </React.Fragment>
      );
    },
    render () {
      return (
        <FullScreen close={<Skip link={'explore'} />}>
          <Navigation active={2} />
          {this.renderHeader()}
          <WithLink trackingElementId={'explore_screen_completed'} link={'deploy'}>
            {move => (
              <Button onClick={move} className={'modern-stack-onboarding--next-button'}>
                {'Select deployment service'}
              </Button>
            )}
          </WithLink>
          <ContentFlowExplorer />
        </FullScreen>
      );
    }
  });

  return ExploreScreen;
}]);
