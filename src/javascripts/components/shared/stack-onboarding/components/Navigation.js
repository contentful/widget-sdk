import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

import {name as WithLinkModule} from './WithLink';

export const name = 'stack-onboarding-navigation';

angular.module('contentful')
.factory(name, ['require', function (require) {
  const WithLink = require(WithLinkModule);

  const Navigation = createReactClass({
    propTypes: {
      active: PropTypes.oneOf([1, 2, 3])
    },
    renderStep ({ id, title, value, link, trackingElementId }) {
      const { active } = this.props;
      const classNames = `
        modern-stack-onboarding--navigation-circle
        ${id <= active ? 'modern-stack-onboarding--navigation-circle__active' : ''}
      `;
      const linkMarkup = id < active
        ? (
          <WithLink trackingElementId={trackingElementId} link={link}>
            {move => (
              <div className={classNames} onClick={move}>
                {value}
              </div>
            )}
          </WithLink>
        ) : (
          <div className={classNames}>
            {value}
          </div>
        );
      return (
        <div className={'modern-stack-onboarding--navigation-block'}>
          {linkMarkup}
          <div className={'modern-stack-onboarding--navigation-title-wrapper'}>
            <div className={'modern-stack-onboarding--navigation-title'}>
              {title}
            </div>
          </div>
        </div>
      );
    },
    render () {
      return (
        <div className={'modern-stack-onboarding--navigation'}>
          <div className={'modern-stack-onboarding--navigation-wrapper'}>
            {this.renderStep({ id: 1, value: 1, title: 'Copy website repository', link: 'copy', trackingElementId: 'copy_step_from_navigation' })}
            {this.renderStep({ id: 2, value: 2, title: 'Explore website Content Structure', link: 'explore', trackingElementId: 'copy_step_from_navigation' })}
            {this.renderStep({ id: 3, value: 3, title: 'Deploy website', trackingElementId: 'deploy_step_from_navigation' })}
          </div>
          <div className={'modern-stack-onboarding--navigation-line'} />
        </div>
      );
    }
  });

  return Navigation;
}]);
