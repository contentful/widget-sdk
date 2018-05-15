import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import {name as FullScreenModule} from './FullScreen';
import {name as ButtonModule} from './Button';

const moduleName = 'choice-screen-component';

angular.module('contentful')
.factory(moduleName, ['require', function (require) {
  const FullScreen = require(FullScreenModule);
  const Button = require(ButtonModule);

  const ChoiceScreen = createReactClass({
    propTypes: {
      onDefaultChoice: PropTypes.func.isRequired
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
    renderButton ({ onClick, text }) {
      return (
        <Button onClick={onClick} className={'button btn-action'}>
          {text}
        </Button>
      );
    },
    render () {
      const { onDefaultChoice } = this.props;
      const contentChoice = this.renderBlock({
        title: 'Create content',
        text: 'The Contentful web-app enables you to easily create, manage and publish content in a customizable workflow.',
        button: this.renderButton({
          onClick: onDefaultChoice,
          text: 'Explore Content Modelling'
        })
      });

      const developerChoice = this.renderBlock({
        title: 'Develop content-rich products',
        text: 'Contentful enables you to manage, integrate and deliver content via APIs. Your preferred programming language is supported.',
        button: this.renderButton({
          onClick: () => {},
          text: 'Deploy a website in 3 steps'
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

export const name = moduleName;
