import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { Note, TextLink } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  warningContainer: css({
    marginBottom: tokens.spacingM,
  }),
};

function AssetLimitWarning({ isOrgOwner, onUpgradeSpace }) {
  return (
    <div className={styles.warningContainer}>
      <Note>
        The free community tier has a size limit of 50MB per asset.
        <br />
        To increase your limit,{' '}
        {isOrgOwner ? (
          <TextLink onClick={onUpgradeSpace}>upgrade this space</TextLink>
        ) : (
          <>the organization admin must upgrade this space.</>
        )}
      </Note>
    </div>
  );
}

AssetLimitWarning.propTypes = {
  isOrgOwner: PropTypes.bool,
  onUpgradeSpace: PropTypes.func.isRequired,
};

export default AssetLimitWarning;
