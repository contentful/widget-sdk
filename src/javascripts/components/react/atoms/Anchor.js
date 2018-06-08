import React from 'react';
import PropTypes from 'prop-types';

export const name = 'react/anchor-tag-component';

angular.module('contentful')
  .factory(name, [() => {
    const AnchorComponent = (props) => {
      const mergedProps = Object.assign(
        {},
        {
          target: '_blank',
          rel: 'noopener noreferrer'
        },
        props
      );

      return <a {...mergedProps}>{props.children}</a>;
    };

    AnchorComponent.propTypes = {
      children: PropTypes.node.isRequired
    };

    return AnchorComponent;
  }]);
