import React from 'react';
import PropTypes from 'prop-types';
import DefaultIcon from 'ui/Components/Icon';
import styles from './styles';

const IconRaw = ({ icon, className }) => {
  if (!icon) {
    return <DefaultIcon name="page-apps" className={className} />;
  }

  return <img src={icon} className={className} />;
};
IconRaw.propTypes = {
  icon: PropTypes.string,
  className: PropTypes.string.isRequired,
};

const NavigationAppIcon = ({ icon }) => <IconRaw className={styles.navbarIcon} icon={icon} />;
NavigationAppIcon.propTypes = {
  icon: IconRaw.propTypes.icon,
};

const AppIcon = ({ icon }) => <IconRaw className={styles.icon} icon={icon} />;
AppIcon.propTypes = {
  icon: IconRaw.propTypes.icon,
};

export { AppIcon, NavigationAppIcon };
