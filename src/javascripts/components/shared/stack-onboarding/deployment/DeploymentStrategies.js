/* eslint "rulesdir/restrict-inline-styles": "warn" */
import React from 'react';
import Tabs from 'components/shared/stack-onboarding/components/Tabs';
import Code from 'components/shared/stack-onboarding/components/Code';
import ExternalTextLink from 'app/common/ExternalTextLink';
import {
  getCredentials,
  isOnboardingComplete,
  getDeploymentProvider,
} from 'components/shared/auto_create_new_space/CreateModernOnboardingUtils';
import { getModule } from 'NgRegistry';

class DeploymentStrategies extends React.Component {
  constructor(props) {
    super(props);
    const wasDeployedWithHeroku = wasAppDeployedWithHeroku();

    this.state = {
      showOriginalHerokuSteps: !wasDeployedWithHeroku,
      showRedeployHerokuSteps: wasDeployedWithHeroku,
      active: getDeploymentProvider() || 'netlify',
    };
  }

  async componentDidMount() {
    const spaceContext = getModule('spaceContext');

    const spaceId = spaceContext.space && spaceContext.space.getSys().id;
    const { deliveryToken } = await getCredentials();

    this.setState({
      spaceId,
      deliveryToken,
    });
  }

  selectTab = (tabId) => {
    this.setState({ active: tabId });
  };

  renderCode = (code) => {
    return <Code lineNumbers={false} copy code={code} tooltipPosition="right" />;
  };

  renderList = (steps) => {
    const stepsMarkup = steps.map((step, i) => (
      <li key={`step_${i}`} className="modern-stack-onboarding--deployment-list-elem">
        {step}
      </li>
    ));
    return <ul className="modern-stack-onboarding--deployment-list">{stepsMarkup}</ul>;
  };

  renderNetlifySteps = () => {
    /* eslint-disable react/jsx-key */
    const steps = [
      <div className="modern-stack-onboarding--deployment-list-text">
        <ExternalTextLink href="https://github.com/netlify/netlifyctl#installation">
          Install the Netlify CLI
        </ExternalTextLink>{' '}
        (This is a free account. You may create an account and login through your CLI).
      </div>,
      this.renderCode('netlifyctl login'),
      this.renderCode('npm run build'),
      this.renderCode('netlifyctl deploy -b public'),
      <p className="modern-stack-onboarding--deployment-list-text">
        Netlify will ask if you want to create a new website. Select YES to deploy this website.
      </p>,
    ];
    /* eslint-enable react/jsx-key */
    return (
      <div className="modern-stack-onboarding--deployment-strategy">
        <h4 className="modern-stack-onboarding--deployment-strategy-title">
          <ExternalTextLink href="https://www.netlify.com/">Netlify</ExternalTextLink>
          {' CLI commands'}
        </h4>
        {this.renderList(steps)}
      </div>
    );
  };

  renderHerokuSteps = (spaceId, deliveryToken) => {
    const { showOriginalHerokuSteps, showRedeployHerokuSteps } = this.state;
    const wasDeployedWithHeroku = wasAppDeployedWithHeroku();

    /* eslint-disable react/jsx-key */
    const deploySteps = [
      <div className="modern-stack-onboarding--deployment-list-text">
        <ExternalTextLink href="https://devcenter.heroku.com/articles/heroku-cli#download-and-install">
          Install the Heroku CLI
        </ExternalTextLink>
        {' (This is a free account. You may create an account and login through your CLI).'}
      </div>,
      this.renderCode('heroku login'),
      this.renderCode('heroku create --buildpack heroku/nodejs'),
      this.renderCode(
        'heroku buildpacks:add https://github.com/heroku/heroku-buildpack-static.git'
      ),
      this.renderCode(
        `heroku config:set CONTENTFUL_SPACE_ID=${spaceId} CONTENTFUL_DELIVERY_TOKEN=${deliveryToken}`
      ),
      this.renderCode('git push heroku master'),
    ];

    const rebuildSteps = [
      <div>
        {this.renderCode('git commit --allow-empty -m "empty commit to rebuild website"')}
        <div style={{ marginTop: '10px' }}>
          {'To build a new version on Heroku, the commit should be empty. '}
          <ExternalTextLink
            href={
              'https://www.contentful.com/developers/docs/tutorials/general/automate-site-builds-with-webhooks/#heroku'
            }>
            {'Set up webhooks'}
          </ExternalTextLink>
          {' to rebuild automatically.'}
        </div>
      </div>,
      this.renderCode('git push heroku master'),
    ];

    const normalTitle = (
      <h4
        className="modern-stack-onboarding--deployment-strategy-title"
        style={{ marginBottom: 0, marginRight: '20px' }}>
        <ExternalTextLink href="https://www.heroku.com/">Heroku</ExternalTextLink>
        {' CLI commands'}
      </h4>
    );

    const deployTitle = (
      <div className="modern-stack-onboarding--deployment-strategy-title-container">
        {normalTitle}
        <div
          className="modern-stack-onboarding--deployment-strategy-expand-text"
          onClick={() => this.setState({ showOriginalHerokuSteps: !showOriginalHerokuSteps })}>
          {showOriginalHerokuSteps ? 'Hide' : 'Show'}
          <i
            className={`modern-stack-onboarding--deployment-strategy-expand-icon fa ${
              showOriginalHerokuSteps ? 'fa-angle-down' : 'fa-angle-right'
            }`}
          />
        </div>
      </div>
    );

    const rebuildTitle = (
      <div className="modern-stack-onboarding--deployment-strategy-title-container">
        <div>
          <h4 className="modern-stack-onboarding--deployment-strategy-title">
            <ExternalTextLink href="https://www.heroku.com/">Heroku</ExternalTextLink>
            {' CLI commands for redeploy'}
          </h4>
          <div className="modern-stack-onboarding--deployment-strategy-subtitle">
            {'To redeploy, push an empty commit to Heroku in your CLI.'}
          </div>
        </div>
        <div
          className="modern-stack-onboarding--deployment-strategy-expand-text"
          onClick={() => this.setState({ showRedeployHerokuSteps: !showRedeployHerokuSteps })}>
          {showRedeployHerokuSteps ? 'Hide' : 'Show'}
          <i
            className={`modern-stack-onboarding--deployment-strategy-expand-icon fa ${
              showRedeployHerokuSteps ? 'fa-angle-down' : 'fa-angle-right'
            }`}
          />
        </div>
      </div>
    );

    if (!spaceId || !deliveryToken) {
      return (
        <div className="loader__container u-separator--small" style={{ background: 'transparent' }}>
          <div className="loading-box__spinner" />
          <div className="loader_message">Loading Heroku deployment steps</div>
        </div>
      );
    } else {
      return (
        <div className="modern-stack-onboarding--deployment-strategy">
          {wasDeployedWithHeroku ? deployTitle : normalTitle}
          {showOriginalHerokuSteps && this.renderList(deploySteps)}
          {wasDeployedWithHeroku && rebuildTitle}
          {wasDeployedWithHeroku && showRedeployHerokuSteps && this.renderList(rebuildSteps)}
        </div>
      );
    }
  };

  render() {
    const { active, deliveryToken, spaceId } = this.state;
    const tabs = [
      {
        id: 'netlify',
        title: 'Netlify',
        content: this.renderNetlifySteps(),
      },
      {
        id: 'heroku',
        title: 'Heroku',
        content: this.renderHerokuSteps(spaceId, deliveryToken),
      },
    ];
    return <Tabs tabs={tabs} active={active} onSelect={this.selectTab} />;
  }
}

export default DeploymentStrategies;

function wasAppDeployedWithHeroku() {
  const isComplete = isOnboardingComplete();
  const isHeroku = getDeploymentProvider() === 'heroku';
  return isComplete && isHeroku;
}
