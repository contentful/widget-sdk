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

    const skippedStepKey = `ctfl:${user.sys.id}:modernStackOnboarding:skippedStep`;
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
          : <ResumeFlow stepToResume={store.get(skippedStepKey)} />;
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

    const ResumeFlow = ({stepToResume: {path, params}}) => {
      const currOrgId = spaceContext.organizationContext.organization.sys.id;
      const handleResume = () => {
        store.remove(skippedStepKey);
        $state.go(path, params);
      };

      return (
        <section className='home-section'>
          <h2 className='home-section__heading'>Would you like to continue to deploy a modern stack website?</h2>
          <p>You’ll copy the repository for a blog, explore the blog content structure and deploy</p>
          <div className='home-section__body u-separator--small'>
            <button className='btn-action' onClick={handleResume} type='button'>Yes, deploy a blog in 3 steps</button>
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
