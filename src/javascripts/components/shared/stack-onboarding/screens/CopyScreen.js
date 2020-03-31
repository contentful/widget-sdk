import React from 'react';

import Navigation from 'components/shared/stack-onboarding/components/Navigation';
import WithLink from 'components/shared/stack-onboarding/components/WithLink';
import ScreenHeader from 'components/shared/stack-onboarding/screens/Header';

import { getCredentials } from 'components/shared/auto_create_new_space/CreateModernOnboardingUtils';
import { getModule } from 'NgRegistry';

import FullScreen from 'components/shared/stack-onboarding/components/FullScreen';
import Skip from 'components/shared/stack-onboarding/components/Skip';
import Button from 'components/shared/stack-onboarding/components/Button';
import Code from 'components/shared/stack-onboarding/components/Code';

export default class CopyScreen extends React.Component {
  state = {
    pending: true,
  };

  async componentDidMount() {
    const { managementToken, deliveryToken } = await getCredentials();

    this.setState({ managementToken, deliveryToken, pending: false });
  }

  renderCodeLine = (code) => {
    return (
      <div className={'modern-stack-onboarding--copyscreen-snippet'}>
        <Code lineNumbers={false} copy code={code} tooltipPosition={'right'} />
      </div>
    );
  };

  getSetupLine = () => {
    const $stateParams = getModule('$stateParams');

    const { pending, managementToken, deliveryToken } = this.state;

    if (pending) {
      return 'Loading...';
    }

    const space = `--spaceId ${$stateParams.spaceId}`;
    const CDA = `--deliveryToken ${deliveryToken}`;
    const CMA = `--managementToken ${managementToken}`;

    return `npm run setup -- ${space} ${CDA} ${CMA}`;
  };

  renderGitSteps = () => {
    return (
      <React.Fragment>
        {this.renderCodeLine('git clone https://github.com/contentful/starter-gatsby-blog.git')}
        {this.renderCodeLine('cd starter-gatsby-blog')}
        {this.renderCodeLine('npm install')}
        {this.renderCodeLine(this.getSetupLine())}
      </React.Fragment>
    );
  };

  render() {
    const headerTitle = (
      <React.Fragment>
        Copy the&nbsp;
        <strong>Gatsby Starter for Contentful</strong>
        &nbsp;blog.
      </React.Fragment>
    );
    const headerSubtitle = (
      <p>You’ll need a local copy of this repository to deploy in the next steps.</p>
    );

    return (
      <FullScreen close={<Skip link="copy" />}>
        <Navigation active={1} />
        <ScreenHeader title={headerTitle} subtitle={headerSubtitle} />
        <div className="modern-stack-onboarding--copyscreen-content">
          <div className="modern-stack-onboarding--copyscreen-text">
            Copy the following commands into your terminal:
          </div>
          {this.renderGitSteps()}
          <div className="modern-stack-onboarding--copyscreen-text">See the blog in action:</div>
          {this.renderCodeLine('npm run dev')}
          <div className="modern-stack-onboarding--copyscreen-text">
            View the blog in your browser, then come back to explore how it’s built.
          </div>
          <WithLink
            intercomKey="onboardingCopyCompleted"
            trackingElementId="copy_screen_completed"
            link="explore">
            {(move) => (
              <Button
                onClick={move}
                className="modern-stack-onboarding--next-button modern-stack-onboarding--next-button__left"
                data-test-id="onboarding-explore-cta">
                Explore the blog structure
              </Button>
            )}
          </WithLink>
        </div>
      </FullScreen>
    );
  }
}
