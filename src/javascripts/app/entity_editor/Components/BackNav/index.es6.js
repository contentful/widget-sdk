import React from 'react';
import PropTypes from 'prop-types';
import Icon from 'ui/Components/Icon.es6';
import { goToPreviousSlideOrExit } from 'navigation/SlideInNavigator';
import closeState from 'navigation/closeState';

class BackNav extends React.Component {
  static propTypes = {
    slideInFeatureFlagValue: PropTypes.number.isRequired
  };

  handleClick = () => {
    goToPreviousSlideOrExit(this.props.slideInFeatureFlagValue, 'arrow_back', closeState);
  };

  render() {
    return (
      <div className="breadcrumbs-widget">
        <div className="breadcrumbs-container">
          <div
            className="btn btn__back"
            data-test-id="breadcrumbs-back-btn"
            onClick={this.handleClick}>
            <Icon name="back" />
          </div>
        </div>
      </div>
    );
  }
}

export default BackNav;
