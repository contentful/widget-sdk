import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

import {name as CreateModernOnboardingModule} from '../../auto_create_new_space/CreateModernOnboarding';
import {name as FullScreenModule} from '../../../react/molecules/FullScreen';
import {name as ButtonModule} from '../../../react/atoms/Button';

export const name = 'choice-screen-component';

angular.module('contentful')
.factory(name, ['require', function (require) {
  const FullScreen = require(FullScreenModule);
  const Button = require(ButtonModule);
  const store = require('TheStore').getStore();
  const {getStoragePrefix} = require(CreateModernOnboardingModule);

  const ChoiceScreen = createReactClass({
    propTypes: {
      onDefaultChoice: PropTypes.func.isRequired,
      createSpace: PropTypes.func
    },
    getInitialState () {
      return {
        isDevPathPending: false,
        isDefaultPathPending: false
      };
    },
    renderBlock ({ title, text, button }) {
      return (
        <div className='modern-stack-onboarding--choice-block'>
          <h3 className='modern-stack-onboarding--choice-block-title'>
            {title}
          </h3>
          <p className='modern-stack-onboarding--choice-block-description'>
            {text}
          </p>
          {button}
        </div>
      );
    },
    renderButton ({ text, ...props }) {
      return (
        <div className='modern-stack-onboarding--block-button-wrapper'>
          <Button className='modern-stack-onboarding--block-button' {...props}>
            {text}
          </Button>
        </div>
      );
    },
    async createSpace () {
      this.setState({
        isDevPathPending: true
      });
      const newSpace = await this.props.createSpace();
      store.set(`${getStoragePrefix()}:currentStep`, {
        path: 'spaces.detail.onboarding.getStarted',
        params: {
          spaceId: newSpace.sys.id
        }
      });
    },
    render () {
      const { isDefaultPathPending, isDevPathPending } = this.state;
      const { onDefaultChoice } = this.props;

      const isButtonDisabled = isDefaultPathPending || isDevPathPending;

      const contentChoice = this.renderBlock({
        title: 'Create content',
        text: 'The Contentful web-app enables you to create, manage and publish content.',
        button: this.renderButton({
          onClick: () => {
            this.setState({ isDefaultPathPending: true });
            onDefaultChoice();
          },
          text: 'Explore content modeling',
          disabled: isButtonDisabled,
          isLoading: isDefaultPathPending
        })
      });

      const developerChoice = this.renderBlock({
        title: 'Develop content-rich products',
        text: 'Contentful enables you to manage, integrate and deliver content via APIs.',
        button: this.renderButton({
          onClick: this.createSpace,
          text: 'Deploy a website in 3 steps',
          disabled: isButtonDisabled,
          isLoading: isDevPathPending
        })
      });

      return (
        <FullScreen>
          <h1 className='modern-stack-onboarding--title'>
            How do you usually work with content?
          </h1>
          <div className='modern-stack-onboarding--choice-blocks'>
            {contentChoice}
            {developerChoice}
          </div>
        </FullScreen>
      );
    }
  });

  return ChoiceScreen;
}]);
