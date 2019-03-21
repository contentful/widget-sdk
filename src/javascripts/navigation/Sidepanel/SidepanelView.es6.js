import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import store from 'redux/store.es6';
import Sidepanel from './Sidepanel.es6';

export default function SidepanelView(props) {
  const { sidePanelIsShown, orgDropdownIsShown, closeOrgsDropdown, closeSidePanel } = props;

  return (
    <Provider store={store}>
      <div className="nav-sidepanel-container">
        <div
          className={`nav-sidepanel__bg ${sidePanelIsShown ? 'nav-sidepanel__bg--is-visible' : ''}`}
          onClick={orgDropdownIsShown ? closeOrgsDropdown : closeSidePanel}
        />
        <Sidepanel {...props} />
      </div>
    </Provider>
  );
}

SidepanelView.propTypes = {
  sidePanelIsShown: PropTypes.bool,
  closeOrgsDropdown: PropTypes.func,
  closeSidePanel: PropTypes.func,
  orgDropdownIsShown: PropTypes.bool
};
