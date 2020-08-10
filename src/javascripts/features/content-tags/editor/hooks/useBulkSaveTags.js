import React, { useEffect, useMemo, useState } from 'react';
import { useBulkActions } from 'core/hooks';
import LoadingOverlay from 'app/common/LoadingOverlay';

const useBulkSaveTags = (onClose, updateEntities) => {
  const [isRunning, setIsRunning] = useState(false);
  const [entities, setEntities] = useState([]);
  const entityType = entities.length > 0 ? entities[0].getSys().type : 'UNKNOWN';
  const [{ actions }] = useBulkActions({
    entityType,
    entities,
  });

  const progressComponent = useMemo(() => {
    if (!isRunning) {
      return null;
    }
    return <LoadingOverlay message="Updating tags" />;
  }, [isRunning]);

  useEffect(() => {
    if (entities.length > 0) {
      (async () => {
        setIsRunning(true);
        await actions.updateTagSelected();
        setIsRunning(false);
        updateEntities();
        onClose();
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entities]);

  return { setEntities, progressComponent, isRunning };
};

export { useBulkSaveTags };
