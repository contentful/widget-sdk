import React from 'react';
import PropTypes from 'prop-types';
import Icon from 'ui/Components/Icon.es6';
import { getModule } from 'NgRegistry.es6';

const { goToPreviousSlideOrExit } = getModule('navigation/SlideInNavigator');

export default class BackNav extends React.Component {
  static propTypes = {
    onClose: PropTypes.func
  };

  static defaultProps = {
    onClose: () => goToPreviousSlideOrExit('arrow_back')
  };

  render() {
    return (
      <div className="breadcrumbs-widget">
        <div className="breadcrumbs-container">
          <div
            className="btn btn__back"
            data-test-id="breadcrumbs-back-btn"
            onClick={this.props.onClose}>
            <Icon name="back" />
          </div>
        </div>
      </div>
    );
  }
}
