import { useRef, useState, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';

const StatusSwitchPortal = memo(({ entityId, children }) => {
  const [isMounted, setMounted] = useState(false);
  const statusSwitchContainerElement = useRef();

  useEffect(() => {
    if (entityId) {
      const portal = document.getElementById(`editor-status-switch-${entityId}`);
      const div = document.createElement('div');
      portal.appendChild(div);
      statusSwitchContainerElement.current = div;
      setMounted(true);
    }

    return () => {
      if (statusSwitchContainerElement.current) {
        statusSwitchContainerElement.current.parentElement.removeChild(
          statusSwitchContainerElement.current
        );
        statusSwitchContainerElement.current = null;
      }
    };
  }, [entityId]);

  if (!entityId || !isMounted) {
    return null;
  }

  return createPortal(children, statusSwitchContainerElement.current);
});

StatusSwitchPortal.propTypes = {
  entityId: PropTypes.string.isRequired,
};

export default StatusSwitchPortal;
