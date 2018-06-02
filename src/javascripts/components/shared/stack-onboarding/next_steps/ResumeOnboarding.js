import React from 'react';
import PropTypes from 'prop-types';

const moduleName = 'ms-resume-onboarding';

angular.module('contentful')
  .factory(moduleName, ['require', require => {
    const spaceContext = require('spaceContext');
    const $state = require('$state');
    const CreateSpace = require('services/CreateSpace');
    const store = require('TheStore').getStore();
    const {user$} = require('services/TokenStore');
    const {getValue} = require('utils/kefir');
    const user = getValue(user$);

    const currentStepKey = `ctfl:${user.sys.id}:modernStackOnboarding:currentStep`;

    const ResumeOnboarding = ({track}) => {
      const currOrgId = spaceContext.organizationContext.organization.sys.id;
      // this is in render as we want this component to resume using what the latest value
      // in the localStorage is and not what the value was when it was mounted
      const handleResume = () => {
        const {path, params} = store.get(currentStepKey);

        track('space_home:resume_onboarding', path);
        $state.go(path, params);
      };

      const handleCreateNewSpace = () => {
        track('space_home:create_new_space');
        return CreateSpace.showDialog(currOrgId);
      };

      return (
        <section className='home-section'>
          <h2 className='home-section__heading'>Would you like to continue to deploy a modern stack website?</h2>
          <p>You’ll copy the repository for a blog, explore the blog content structure and deploy.</p>
          <div className='home-section__body u-separator--small'>
            <button className='btn-action' onClick={handleResume} type='button'>Yes, deploy a blog in 3 steps</button>
            <button className='btn-action' onClick={handleCreateNewSpace} type='button'>No, create a new space</button>
          </div>
        </section>
      );
    };

    ResumeOnboarding.propTypes = {
      track: PropTypes.func.isRequired
    };

    return ResumeOnboarding;
  }]);

export { moduleName as name };
