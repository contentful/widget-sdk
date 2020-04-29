import React, { useEffect, useState } from 'react';
import { identity } from 'lodash';
import PropTypes from 'prop-types';
import { APP_DEFINITION_TYPE, USER_TYPE } from './constants';
import { getActionPerformer, getActionPerformerName } from './utils';

// TODO: This component should be moved to core once we have a good foundation there

const defaultLoadingComponent = <div data-test-id="loading-variant">Loading...</div>;

export const ActionPerformer = ({ children, link, loadingComponent, formatName }) => {
  const [isReady, setIsReady] = useState(false);
  const [actionPerformer, setActionPerformer] = useState('');

  useEffect(() => {
    (async function () {
      try {
        setIsReady(false);
        setActionPerformer(await getActionPerformer(link));
      } catch {
        setActionPerformer('');
      } finally {
        setIsReady(true);
      }
    })();
  }, [link, children]);

  if (!isReady) {
    return loadingComponent;
  }

  return children({
    actionPerformer,
    formattedName: formatName(getActionPerformerName(link.sys.linkType, actionPerformer)),
  });
};

ActionPerformer.propTypes = {
  children: PropTypes.func.isRequired,
  link: PropTypes.shape({
    sys: PropTypes.shape({
      type: PropTypes.oneOf(['Link']).isRequired,
      linkType: PropTypes.oneOf([APP_DEFINITION_TYPE, USER_TYPE]).isRequired,
      id: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  loadingComponent: PropTypes.element,
  formatName: PropTypes.func,
};

ActionPerformer.defaultProps = {
  loadingComponent: defaultLoadingComponent,
  formatName: identity,
};
