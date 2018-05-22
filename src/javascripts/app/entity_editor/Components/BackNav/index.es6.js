import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import Icon from 'ui/Components/Icon';
import { goToPreviousSlideOrExit } from 'states/EntityNavigationHelpers';
import $state from '$state';

const BackNav = createReactClass({
  propTypes: {
    slideInFeatureFlagValue: PropTypes.number.isRequired
  },
  handleClick () {
    goToPreviousSlideOrExit(
      this.props.slideInFeatureFlagValue,
      () => $state.go('^.list')
    );
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
