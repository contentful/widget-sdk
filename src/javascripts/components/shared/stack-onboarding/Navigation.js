import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import {name as WithLinkModule} from './WithLink';

const moduleName = 'navigation-screen';

angular.module('contentful')
.factory(moduleName, ['require', function (require) {
  const WithLink = require(WithLinkModule);

  const Navigation = createReactClass({
    propTypes: {
      active: PropTypes.oneOf([1, 2, 3])
    },
    renderStep ({ id, title, value, link }) {
      const { active } = this.props;
      const linkMarkup = id < active
        ? (
          <WithLink link={link}>
            {move => (
              <div className={'active'} onClick={move}>
                {value}
              </div>
            )}
          </WithLink>
        ) : (
          <div className={`${active === id ? 'active' : ''}`}>
            {value}
          </div>
        );
      return (
        <div>
          {linkMarkup}
          {title}
        </div>
      );
    },
    render () {
      return (
        <div>
          <div>
            {this.renderStep({ id: 1, value: 1, title: 'Copy website repository', link: 'copy' })}
            {this.renderStep({ id: 2, value: 2, title: 'Explore website Content Structure', link: 'explore' })}
            {this.renderStep({ id: 3, value: 3, title: 'Deploy website' })}
          </div>
          <div />
        </div>
      );
    }
  });

  return Navigation;
}]);

export const name = moduleName;
