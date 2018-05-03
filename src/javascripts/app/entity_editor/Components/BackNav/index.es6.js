import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import Icon from 'ui/Components/Icon';
import {
  getSlideInEntities,
  goToSlideInEntity
} from 'states/EntityNavigationHelpers';
import $state from '$state';

const BackNav = createReactClass({
  propTypes: {
    slideInFeatureFlagValue: PropTypes.number.isRequired
  },
  handleClick () {
    const slideInEntities = getSlideInEntities();
    const numEntities = slideInEntities.length;
    if (numEntities > 1) {
      const previousEntity = slideInEntities[numEntities - 2];
      goToSlideInEntity(previousEntity, this.props.slideInFeatureFlagValue);
    } else {
      $state.go('^.^');
    }
  },
  render () {
    return (
      <div className="breadcrumbs-widget">
        <div className="breadcrumbs-container">
          <div
            className="btn btn__back"
            data-test-id="breadcrumbs-back-btn"
            onClick={this.handleClick}
            >
            <Icon name="back" />
          </div>
        </div>
      </div>
    );
  }
});

export default BackNav;
