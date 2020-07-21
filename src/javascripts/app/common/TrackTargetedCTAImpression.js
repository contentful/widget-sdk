import { useEffect } from 'react';
import PropTypes from 'prop-types';

import { trackTargetedCTAImpression } from 'analytics/trackCTA';

export default function TrackTargetedCTAImpression({ children, impressionType, meta }) {
  useEffect(() => {
    trackTargetedCTAImpression(impressionType, meta);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return children;
}

TrackTargetedCTAImpression.propTypes = {
  children: PropTypes.node.isRequired,
  impressionType: PropTypes.string.isRequired,
  meta: PropTypes.object.isRequired,
};
