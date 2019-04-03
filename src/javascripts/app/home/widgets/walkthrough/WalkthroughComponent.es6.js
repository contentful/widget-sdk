import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import Tooltip from './Tooltip.es6';
import TooltipContent from './TooltipContent.es6';

const styles = {
  spaceMenu: css({
    backgroundImage: "url('/app/images/author-editor-walkthrough/step1-SpaceMenu.png')"
  }),
  contentTab: css({
    backgroundImage: "url('/app/images/author-editor-walkthrough/step2-ContentTab.png')"
  }),
  mediaTab: css({
    backgroundImage: "url('/app/images/author-editor-walkthrough/step3-MediaTab.png')"
  }),
  profile: css({
    backgroundImage: "url('/app/images/author-editor-walkthrough/step4-profile.png')"
  })
};

export default class WalkthroughComponent extends React.Component {
  static propTypes = {
    spaceName: PropTypes.string.isRequired,
    isTourRunning: PropTypes.bool.isRequired,
    runTour: PropTypes.func.isRequired,
    walkthroughStarted: PropTypes.bool, // from user state
    updateWalkthroughState: PropTypes.func.isRequired,
    // ReactJoyrideComponent is third-party-component, loaded dynamically in WalkthroughWidget
    ReactJoyrideComponent: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired
  };

  static defaultProps = { isTourRunning: false };

  tourCallback = data => {
    const { action } = data;
    const { runTour, walkthroughStarted, updateWalkthroughState } = this.props;

    if (action === 'close') {
      // to adjust ReactJoyride component's behaviour to our desireable behavior:
      // on close action tour aborts and starts from the beginning next time
      this.helpers.reset(true);
    }

    if (action === 'reset' || action === 'close') {
      runTour(false);
    }
    // to update user state after finishing UI tour, only if it wasn't updated already
    if (!walkthroughStarted && action === 'stop')
      updateWalkthroughState({ started: true, dismissed: false });
  };

  setHelpers = helpers => {
    this.helpers = helpers;
  };

  steps = [
    {
      title: 'Switch between Spaces',
      content: (
        <TooltipContent
          imgStyles={styles.spaceMenu}
          imgDescription={'Illustration of Space Menu'}
          copy="This is your organization’s account. It can contain one or more Spaces, which are an area to store your content. Use this menu to navigate to other Spaces you’re working in."
        />
      ),
      disableBeacon: true,
      target: '[data-ui-tour-step="sidepanel-trigger"]',
      placement: 'bottom-start'
    },
    {
      title: 'Create and edit content',
      content: (
        <TooltipContent
          imgStyles={styles.contentTab}
          imgDescription={'Illustration of Content tab'}
          copy="Content creation happens in this tab. Here you can search, filter, and view existing Entries, as well as create new content for your Space. "
        />
      ),
      disableBeacon: true,
      target: '[data-ui-tour-step="nav-item-entry-list"]',
      placement: 'bottom-start'
    },
    {
      title: 'Manage your media',
      content: (
        <TooltipContent
          imgStyles={styles.mediaTab}
          imgDescription={'Illustration of Media tab'}
          copy="In this tab you can manage all of the media in your Space. Here you can upload, search, filter, and publish media to reuse across all of your content."
        />
      ),
      disableBeacon: true,
      target: '[data-ui-tour-step="nav-item-asset-list"]',
      placement: 'bottom-start'
    },
    {
      title: 'Settings and support',
      content: (
        <TooltipContent
          imgStyles={styles.profile}
          imgDescription={'Illustration of support chat'}
          copy="Get answers to any product-related questions by chatting with Contentful experts. From this menu you can also manage your profile."
        />
      ),
      disableBeacon: true,
      target: '[data-ui-tour-step="account-menu-trigger"]',
      placement: 'bottom-start'
    },
    {
      title: 'Get started in Contentful',
      content: (
        <TooltipContent copy="Learn how content is structured in Contentful in the video below. Or head over to the Content tab to create content in your Space!" />
      ),
      disableBeacon: true,
      target: '[data-ui-tour-step="concept-video-widget"]',
      placement: 'top-end',
      styles: {
        options: {
          arrowColor: '#fff'
        }
      }
    }
  ];

  render() {
    const { isTourRunning, ReactJoyrideComponent } = this.props;
    return (
      <ReactJoyrideComponent
        continuous={true}
        disableOverlayClose={true}
        callback={this.tourCallback}
        tooltipComponent={Tooltip}
        run={isTourRunning}
        steps={this.steps}
        getHelpers={this.setHelpers}
        styles={{
          options: {
            arrowColor: '#3072be',
            backgroundColor: '#fff',
            zIndex: 10000
          }
        }}
      />
    );
  }
}
