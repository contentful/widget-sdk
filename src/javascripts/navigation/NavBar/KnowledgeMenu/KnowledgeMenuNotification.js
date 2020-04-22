import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { getBrowserStorage } from 'core/services/BrowserStorage';

const localStorage = getBrowserStorage('local');

const styles = {
  notificationIcon: css({
    position: 'absolute',
    top: '20px',
    right: '15px',
    height: '12px',
    width: '12px',
    borderRadius: '50%',
    backgroundColor: tokens.colorWarning,
    border: `2px solid ${tokens.colorContrastMid}`,
  }),
};

function KnowledgeMenuNotification(props) {
  const [hasSeenHelpMenu, setHasSeenHelpMenu] = useState(getHasSeenHelpMenu());

  useEffect(() => {
    if (!props.isMenuOpen || hasSeenHelpMenu) return;

    markHelpMenuAsSeen();
  }, [props.isMenuOpen, hasSeenHelpMenu]);

  function getHasSeenHelpMenu() {
    return localStorage.get('hasSeenHelpMenu') === 'yes';
  }

  function markHelpMenuAsSeen() {
    setHasSeenHelpMenu(true);
    localStorage.set('hasSeenHelpMenu', 'yes');
  }

  if (hasSeenHelpMenu) return null;

  return <span data-test-id="help-menu-notification" className={styles.notificationIcon} />;
}

KnowledgeMenuNotification.propTypes = {
  isMenuOpen: PropTypes.bool.isRequired,
};

export default KnowledgeMenuNotification;
