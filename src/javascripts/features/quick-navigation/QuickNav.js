import React from 'react';
import { GlobalHotKeys } from 'react-hotkeys';
import { Icon, Modal } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { ModalLauncher } from '@contentful/forma-36-react-components';
import { trackOpenButtonClick, trackClose, trackOpenShortcut } from './analytics';
import { QuickNavSearch } from './components/QuickNavSearch';

const keyMap = {
  QUICK_NAV: 'q',
};

const styles = {
  searchButton: css({
    color: tokens.colorWhite,
    padding: `25px 20px`,
    height: `100%`,
  }),
  modal: css({
    boxShadow: 'none',
    border: 0,
    marginTop: 0,
  }),
  shortcut: css({
    display: 'inline-block',
    color: tokens.colorTextLightest,
    backgroundColor: tokens.colorContrastLight,
    borderRadius: '2px',
    marginLeft: tokens.spacing2Xs,
    width: '18px',
    fontWeight: tokens.fontWeightMedium,
    fontFamily: tokens.fontStackMonospace,
  }),
};

export class QuickNavigation extends React.Component {
  textInput = React.createRef();

  onRequestClose = () => {
    trackClose();
  };

  hasActiveModals = () => {
    const modal = {
      FILESTACK: document.querySelector('.fsp-picker'),
      F36: document.querySelector('[data-test-id="cf-ui-modal-content"]'),
      LEGACY: document.querySelector('.modal-background.is-visible'),
    };

    return !!modal.FILESTACK || !!modal.F36 || !!modal.LEGACY;
  };

  openModal = () => {
    ModalLauncher.open(({ isShown, onClose }) => (
      <Modal
        position="top"
        topOffset="20%"
        isShown={isShown}
        onClose={onClose}
        size="560px"
        className={styles.modal}
        modalContentProps={{
          style: {
            background: 'none',
            padding: 0,
          },
        }}>
        <QuickNavSearch closeModal={onClose} />
      </Modal>
    ));
  };

  render() {
    return (
      <GlobalHotKeys
        keyMap={keyMap}
        handlers={{
          QUICK_NAV: (event) => {
            if (this.hasActiveModals()) {
              return;
            }
            event.preventDefault();
            trackOpenShortcut();
            this.openModal();
          },
        }}>
        {/* eslint-disable-next-line rulesdir/restrict-non-f36-components */}
        <button
          className={styles.searchButton}
          onClick={() => {
            trackOpenButtonClick();
            this.openModal();
          }}
          role="search"
          data-test-id="quick-nav-search-button">
          <Icon size="small" icon="Search" color="white" />
        </button>
      </GlobalHotKeys>
    );
  }
}
