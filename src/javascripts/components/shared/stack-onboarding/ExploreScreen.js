import React from 'react';
import createReactClass from 'create-react-class';

import {name as FullScreenModule} from './FullScreen';
import {name as SkipModule} from './Skip';
import {name as NavigationModule} from './Navigation';
import {name as ButtonModule} from './Button';
import {name as ContentFlowExplorerModule} from './ContentFlowExplorer';

const moduleName = 'explore-screen-component';

angular.module('contentful')
.factory(moduleName, ['require', function (require) {
  const FullScreen = require(FullScreenModule);
  const Skip = require(SkipModule);
  const Navigation = require(NavigationModule);
  const Button = require(ButtonModule);
  const ContentFlowExplorer = require(ContentFlowExplorerModule);

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
            {'Hover and compare tab views to see .'}
          </h3>
          </React.Fragment>
      );
    },
    render () {
      return (
        <FullScreen close={<Skip />}>
          <Navigation active={2} />
          {this.renderHeader()}
          <Button>
            {'Select deployment service'}
          </Button>
          <ContentFlowExplorer />
        </FullScreen>
      );
    }
  });

  return ExploreScreen;
}]);

export const name = moduleName;
