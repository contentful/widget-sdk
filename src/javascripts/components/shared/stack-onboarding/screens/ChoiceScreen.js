import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

import {name as FullScreenModule} from '../../../react/molecules/FullScreen';
import {name as ButtonModule} from '../../../react/atoms/Button';
import {name as createModernOnboardingModule} from '../../auto_create_new_space/CreateModernOnboarding';

const DEFAULT_LOCALE = 'en-US';

export const name = 'choice-screen-component';

angular.module('contentful')
.factory(name, ['require', function (require) {
  const client = require('client');
  const spaceContext = require('spaceContext');
  const $state = require('$state');
  const { refresh } = require('services/TokenStore');
  const { markSpace } = require(createModernOnboardingModule);

  const FullScreen = require(FullScreenModule);
  const Button = require(ButtonModule);

  const ChoiceScreen = createReactClass({
    propTypes: {
      onDefaultChoice: PropTypes.func.isRequired,
      closeModal: PropTypes.func,
      orgId: PropTypes.string.isRequired
    },
    getInitialState () {
      return {
        isDevPathPending: false,
        isDefaultPathPending: false
      };
    },
    async createSpace () {
      const { orgId, closeModal } = this.props;
      this.setState({
        isDevPathPending: true
      });
      const newSpace = await client.createSpace({
        name: 'Modern Stack Website',
        defaultLocale: DEFAULT_LOCALE
      }, orgId);

      const newSpaceId = newSpace.sys.id;
      // we need to mark space as onboarding before transitioning
      // because otherwise it won't let us do that
      // all onboarding steps are guarded by space id
      markSpace(newSpaceId);

      await refresh();
      await $state.go('spaces.detail.onboarding.getStarted', {spaceId: newSpaceId});
      // if we need to close modal, we need to do it after redirect
      closeModal && closeModal();

      spaceContext.apiKeyRepo.create(
        'Example Key',
        'We’ve created an example API key for you to help you get started.'
      );
    },
    renderBlock ({ title, text, button }) {
      return (
        <div className={'modern-stack-onboarding--choice-block'}>
          <h3>
            {title}
          </h3>
          <div>
            {text}
          </div>
          {button}
        </div>
      );
    },
    renderButton ({ text, ...props }) {
      return (
        <div className={'modern-stack-onboarding--block-button-wrapper'}>
          <Button className={'modern-stack-onboarding--block-button'} {...props}>
            {text}
          </Button>
        </div>
      );
    },
    render () {
      const { isDefaultPathPending, isDevPathPending } = this.state;
      const { onDefaultChoice } = this.props;

      const isButtonDisabled = isDefaultPathPending || isDevPathPending;

      const contentChoice = this.renderBlock({
        title: 'Create content',
        text: 'The Contentful web-app enables you to easily create, manage and publish content in a customizable workflow.',
        button: this.renderButton({
          onClick: () => {
            this.setState({ isDefaultPathPending: true });
            onDefaultChoice();
          },
          text: 'Explore Content Modelling',
          disabled: isButtonDisabled,
          isLoading: isDefaultPathPending
        })
      });

      const developerChoice = this.renderBlock({
        title: 'Develop content-rich products',
        text: 'Contentful enables you to manage, integrate and deliver content via APIs. Your preferred programming language is supported.',
        button: this.renderButton({
          onClick: this.createSpace,
          text: 'Deploy a website in 3 steps',
          disabled: isButtonDisabled,
          isLoading: isDevPathPending
        })
      });

      return (
        <FullScreen>
          <h1 className={'modern-stack-onboarding--title'}>
            {'How do you usually work with the content?'}
          </h1>
          <div className={'modern-stack-onboarding--choice-blocks'}>
            {contentChoice}
            {developerChoice}
          </div>
        </FullScreen>
      );
    }
  });

  return ChoiceScreen;
}]);
