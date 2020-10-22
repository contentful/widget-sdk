import React from 'react';
import PropTypes from 'prop-types';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';

import { styles } from './styles';

const IconRaw = ({ icon, className, size }) => {
  if (!icon) {
    return (
      <div className={className}>
        <ProductIcon icon="Apps" tag="span" size={size ? size : 'large'} />
      </div>
    );
  }

  return <img src={icon} className={className} />;
};
IconRaw.propTypes = {
  icon: PropTypes.string,
  className: PropTypes.string.isRequired,
  size: PropTypes.string,
};

const NavigationAppIcon = ({ icon }) => (
  <IconRaw className={styles.navbarIcon} icon={icon} size="medium" />
);
NavigationAppIcon.propTypes = {
  icon: IconRaw.propTypes.icon,
};

const AppIcon = ({ icon }) => <IconRaw className={styles.icon} icon={icon} />;
AppIcon.propTypes = {
  icon: IconRaw.propTypes.icon,
};

export { AppIcon, NavigationAppIcon };
