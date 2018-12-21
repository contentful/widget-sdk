import React from 'react';
import Icon from 'ui/Components/Icon.es6';
import { getModule } from 'NgRegistry.es6';

const { goToPreviousSlideOrExit } = getModule('navigation/SlideInNavigator');
const closeState = getModule('navigation/closeState');

class BackNav extends React.Component {
  handleClick = () => {
    goToPreviousSlideOrExit('arrow_back', closeState);
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
