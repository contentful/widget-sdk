import React from 'react';
import ReactModal from 'react-modal';
import QuickNavSearch from './QuickNavSearch.es6';
import { Icon } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { trackOpenButtonClick, trackClose } from './analytics.es6';
try {
  ReactModal.setAppElement('.client');
} catch (e) {
  // do nothing
}

const styles = {
  searchButton: css({
    color: tokens.colorWhite,
    padding: `25px 20px`,
    height: `100%`
  }),
  searchIcon: css({})
};

const reactModalStyle = {
  content: {
    background: 'none',
    border: 'none',
    top: '20%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, 0)',
    padding: 0
  },
  overlay: {
    backgroundColor: 'rgba(12,20,28,0.75)'
  }
};

export default class QuickNav extends React.Component {
  state = {
    modalIsOpen: false
  };

  textInput = React.createRef();

  openModal = () => {
    this.setState({ modalIsOpen: true });
  };

  closeModal = () => {
    this.setState({ modalIsOpen: false });
  };

  onRequestClose = () => {
    trackClose();
    this.closeModal();
  };

  onQuickNavIconClick = () => {
    trackOpenButtonClick();
    this.openModal();
  };

  render() {
    const { modalIsOpen } = this.state;
    return (
      <>
        <button
          className={styles.searchButton}
          onClick={this.onQuickNavIconClick}
          role="search"
          data-test-id="quick-nav-search-button">
          <Icon className={styles.searchIcon} size="small" icon="Search" color="white" />
        </button>
        <ReactModal
          isOpen={modalIsOpen}
          onRequestClose={this.onRequestClose}
          contentLabel="QuickNav modal"
          style={reactModalStyle}>
          <QuickNavSearch closeModal={this.closeModal} />
        </ReactModal>
      </>
    );
  }
}
