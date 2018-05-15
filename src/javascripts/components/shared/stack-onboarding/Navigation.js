import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

const moduleName = 'navigation-screen';

angular.module('contentful')
.factory(moduleName, ['require', function () {
  const Navigation = createReactClass({
    propTypes: {
      active: PropTypes.oneOf([1, 2, 3])
    },
    renderStep ({ id, title, value }) {
      const { active } = this.props;
      return (
        <div>
          <div className={`${active <= id ? 'active' : ''}`}>
            {value}
          </div>
          {title}
        </div>
      );
    },
    render () {
      return (
        <div>
          <div>
            {this.renderStep({ id: 1, value: 1, title: 'Copy website repository' })}
            {this.renderStep({ id: 2, value: 2, title: 'Explore website Content Structure' })}
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
