import React from 'react';
import SidepanelTrigger from './SidepanelTrigger';
import Sidepanel from './Sidepanel';
import keycodes from 'utils/keycodes';

export default class SidepanelContainer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      sidePanelIsShown: false,
      orgDropdownIsShown: false,
    };
  }

  componentDidMount() {
    window.addEventListener('keyup', this.handleEsc);
  }

  componentWillUnmount() {
    window.removeEventListener('keyup', this.handleEsc);
  }

  setOrgDropdownIsShown = (value) => {
    this.setState({ orgDropdownIsShown: value });
  };

  setSidePanelIsShown = (value) => {
    this.setState({ sidePanelIsShown: value });
  };

  closeDropdownOrPanel = () => {
    if (this.state.orgDropdownIsShown) {
      this.setOrgDropdownIsShown(false);
    } else {
      this.setSidePanelIsShown(false);
    }
  };

  handleEsc = (ev) => {
    if (ev.keyCode === keycodes.ESC) {
      this.closeDropdownOrPanel();
    }
  };

  render() {
    return (
      <React.Fragment>
        <div className="nav-sidepanel-container">
          <div
            className={`nav-sidepanel__bg ${
              this.state.sidePanelIsShown ? 'nav-sidepanel__bg--is-visible' : ''
            }`}
            onClick={this.closeDropdownOrPanel}
          />
          <Sidepanel
            sidePanelIsShown={this.state.sidePanelIsShown}
            orgDropdownIsShown={this.state.orgDropdownIsShown}
            openOrgsDropdown={(event) => {
              if (this.state.orgDropdownIsShown === false) {
                this.setOrgDropdownIsShown(true);
                // Don't bubble click event to container that would close the dropdown
                event.stopPropagation();
              }
            }}
            closeOrgsDropdown={() => {
              this.setOrgDropdownIsShown(false);
            }}
            closeSidePanel={() => {
              this.setSidePanelIsShown(false);
            }}
          />
        </div>
        <SidepanelTrigger
          onClick={() => {
            this.setSidePanelIsShown(true);
          }}
        />
      </React.Fragment>
    );
  }
}
