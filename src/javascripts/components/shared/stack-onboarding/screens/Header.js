import React from 'react';
import PropTypes from 'prop-types';

export const name = 'screen-header-component';

angular.module('contentful').factory(name, [
  () => {
    const ScreenHeader = ({ title, subtitle, children }) => {
      return (
        <React.Fragment>
          <h1 className="modern-stack-onboarding--title">{title}</h1>
          <div className="modern-stack-onboarding--subtitle">{subtitle}</div>
          {children}
        </React.Fragment>
      );
    };

    ScreenHeader.propTypes = {
      title: PropTypes.node.isRequired,
      subtitle: PropTypes.node.isRequired,
      children: PropTypes.node
    };

    return ScreenHeader;
  }
]);
