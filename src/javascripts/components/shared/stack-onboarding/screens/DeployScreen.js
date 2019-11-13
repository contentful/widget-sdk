import React from 'react';
import ScreenHeader from 'components/shared/stack-onboarding/screens/Header';
import WithLink from 'components/shared/stack-onboarding/components/WithLink';
import FullScreen from 'components/shared/stack-onboarding/components/FullScreen';
import Skip from 'components/shared/stack-onboarding/components/Skip';
import Navigation from 'components/shared/stack-onboarding/components/Navigation';
import DeploymentStrategies from 'components/shared/stack-onboarding/deployment/DeploymentStrategies';
import DeploymentForm from 'components/shared/stack-onboarding/deployment/DeploymentForm';

export default class DeployScreen extends React.Component {
  render() {
    const headerTitle = (
      <React.Fragment>
        Deploy the&nbsp;
        <strong>Gatsby Starter for Contentful</strong>
        &nbsp;blog.
      </React.Fragment>
    );
    const headerSubtitle = (
      <p>
        Select your preferred hosting service to see the CLI deploy commands.
        <br />
        We selected two hosting service options as an example to get you started.
      </p>
    );

    return (
      <FullScreen close={<Skip link="deploy" />}>
        <Navigation active={3} />
        <ScreenHeader title={headerTitle} subtitle={headerSubtitle} />
        <div className="modern-stack-onboarding--deploy-content">
          <DeploymentStrategies />
        </div>
        {/* We add a default trackingElementId, which should never appear in our analytics */}
        {/* If we see it, we need to debug why is it so */}
        <WithLink
          intercomKey="onboardingDeployCompleted"
          trackingElementId={'deploy_screen_completed:no_provider'}
          link="spaceHome">
          {move => (
            <DeploymentForm
              onComplete={(event, provider) => move(event, `deploy_screen_completed:${provider}`)}
            />
          )}
        </WithLink>
      </FullScreen>
    );
  }
}
