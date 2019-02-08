import React from 'react';
import ReactJoyride from 'react-joyride';
import PropTypes from 'prop-types';
import Tooltip from './Tooltip.es6';

export default class WalkthroughComponent extends React.Component {
  static propTypes = {
    spaceName: PropTypes.string,
    isTourRunning: PropTypes.bool,
    runTour: PropTypes.func
  };

  tourCallback = data => {
    const { action } = data;

    if (action === 'close') {
      // to adjust ReactJoyride component's behaviour to our desireable behavior:
      // on close action tour aborts and starts from the beginning next time
      this.helpers.reset(true);
    }

    if (action === 'reset' || action === 'close') {
      // this.setState({ run: false });
      this.props.runTour(false);
    }
  };

  setHelpers = helpers => {
    this.helpers = helpers;
  };

  steps = [
    {
      title: 'Switch between Spaces',
      content: (
        <>
          <img
            className="walkthrough-tooltip__scheme-image"
            src="/app/images/author-editor-walkthrough/step1-SpaceMenu.png"
            alt="Organisation and Space menu scheme"
          />
          <p className="walkthrough-tooltip__copy">
            This is your organization’s account. It can contain one or more Spaces, which are an
            area to store your content. Use this menu to navigate to other Spaces you’re working in.
          </p>
        </>
      ),
      disableBeacon: true,
      target: '[data-ui-tour-step="sidepanel-trigger"]',
      placement: 'bottom-start'
    },
    {
      title: 'Create and edit content',
      content: (
        <>
          <img
            className="walkthrough-tooltip__scheme-image"
            src="/app/images/author-editor-walkthrough/step2-ContentTab.png"
            alt="Content creation page scheme"
          />
          <p className="walkthrough-tooltip__copy">
            Content creation happens in this tab. Here you can search, filter, and view existing
            Entries, as well as create new content for your Space.
          </p>
        </>
      ),
      disableBeacon: true,
      target: '[data-ui-tour-step="nav-item-entry-list"]',
      placement: 'bottom-start'
    },
    {
      title: 'Manage your media',
      content: (
        <>
          <img
            className="walkthrough-tooltip__scheme-image"
            src="/app/images/author-editor-walkthrough/step3-MediaTab.png"
            alt="OMedia managing tab scheme"
          />
          <p className="walkthrough-tooltip__copy">
            In this tab you can manage all of the media in your Space. Here you can upload, search,
            filter, and publish media to reuse across all of your content.
          </p>
        </>
      ),
      disableBeacon: true,
      target: '[data-ui-tour-step="nav-item-asset-list"]',
      placement: 'bottom-start'
    },
    {
      title: 'Settings and support',
      content: (
        <>
          <img
            className="walkthrough-tooltip__scheme-image"
            src="/app/images/author-editor-walkthrough/step4-profile.png"
            alt="Image of support chat"
          />
          <p className="walkthrough-tooltip__copy">
            Get answers to any product-related questions by chatting with Contentful experts. From
            this menu you can also manage your profile.
          </p>
        </>
      ),
      disableBeacon: true,
      target: '[data-ui-tour-step="account-menu"]',
      placement: 'bottom-start'
    },
    {
      title: 'Get started in Contentful',
      content: (
        <p className="walkthrough-tooltip__copy">
          Learn how content is structured in Contentful in the video below. Or, head over to the
          Content tab to create content in your Space!
        </p>
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
    const { isTourRunning } = this.props;
    return (
      <ReactJoyride
        continuous={true}
        disableOverlayClose={true}
        callback={this.tourCallback}
        tooltipComponent={Tooltip}
        run={isTourRunning}
        scrollToFirstStep
        showSkipButton
        steps={this.steps}
        getHelpers={this.setHelpers}
        styles={{
          options: {
            arrowColor: '#3D81D0',
            backgroundColor: '#fff',
            zIndex: 10000,
            overlayColor: 'rgba(0, 0, 0, 0.7)',
            spotlightShadow: 'rgba(0, 0, 0, 0.3)'
          }
        }}
      />
    );
  }
}

WalkthroughComponent.defaultProps = { isTourRunning: false };
