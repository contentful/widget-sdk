import React from 'react';
import PropTypes from 'prop-types';

const moduleName = 'ms-dev-next-steps';

angular.module('contentful')
  .factory(moduleName, ['require', require => {
    const spaceContext = require('spaceContext');
    const store = require('TheStore').getStore();
    const {user$} = require('services/TokenStore');
    const {getValue} = require('utils/kefir');
    const user = getValue(user$);

    const currentStepKey = `ctfl:${user.sys.id}:modernStackOnboarding:currentStep`;
    const onboardingStepsCompleteKey = `ctfl:${user.sys.id}:modernStackOnboarding:completed`;

    class DevNextStepsContainer extends React.Component {
      constructor () {
        super();
        this.state = {
          onboardingStepsComplete: store.get(onboardingStepsCompleteKey)
        };
      }

      render () {
        const {onboardingStepsComplete} = this.state;

        return onboardingStepsComplete
          ? <DevNextSteps />
          : <ResumeFlow />;
      }
    }

    class DevNextSteps extends React.Component {
      constructor () {
        super();
        this.state = {};
      }
      render () {
        return null;
      }
    }

    const $state = require('$state');
    const CreateSpace = require('services/CreateSpace');

    const ResumeFlow = () => {
      const currOrgId = spaceContext.organizationContext.organization.sys.id;
      // this is in render as we want this component to resume using what the latest value
      // in the localStorage is and not what the value was when it was mounted
      const {path, params} = store.get(currentStepKey);

      return (
        <section className='home-section'>
          <h2 className='home-section__heading'>Would you like to continue to deploy a modern stack website?</h2>
          <p>You’ll copy the repository for a blog, explore the blog content structure and deploy.</p>
          <div className='home-section__body u-separator--small'>
            <button className='btn-action' onClick={_ => $state.go(path, params)} type='button'>Yes, deploy a blog in 3 steps</button>
            <button className='btn-action' onClick={_ => CreateSpace.showDialog(currOrgId)} type='button'>No, create a new space</button>
          </div>
        </section>
      );
    };

    ResumeFlow.propTypes = {
      stepToResume: PropTypes.shape({
        path: PropTypes.string.isRequired,
        params: PropTypes.object.isRequired
      })
    };

    return DevNextStepsContainer;
  }]);

export const name = moduleName;
