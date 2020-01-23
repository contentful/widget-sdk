import React, { useState, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import Menu from './Menu';
import useGlobalMouseUp from './useGlobalMouseUp';

const styles = {
  wrapper: css({
    position: 'relative'
  })
};

const CreateEntryMenuTrigger = ({
  contentTypes,
  onSelect,
  children,
  testId,
  suggestedContentTypeId
}) => {
  const [isOpen, setOpen] = useState(false);
  const [isSelecting, setSelecting] = useState(false);
  const wrapper = useRef(null);

  const mouseUpHandler = useCallback(
    event => {
      if (wrapper && !wrapper.current.contains(event.target)) {
        setOpen(false);
      }
    },
    [wrapper]
  );

  useGlobalMouseUp(mouseUpHandler);

  const handleSelect = item => {
    setOpen(false);
    const res = onSelect(item.sys.id);

    // TODO: Convert to controllable component.
    if (res && typeof res.then === 'function') {
      setSelecting(true);
      res.then(() => setSelecting(false), () => setSelecting(false));
    }
  };

  const openMenu = () => {
    if (contentTypes.length === 1) {
      handleSelect(contentTypes[0]);
    } else {
      setOpen(!isOpen);
    }
  };

  return (
    <span className={styles.wrapper} ref={ref => (wrapper.current = ref)} data-test-id={testId}>
      {children({ isOpen, isSelecting, openMenu })}
      {contentTypes.length > 1 && isOpen && (
        <Menu
          contentTypes={contentTypes}
          suggestedContentTypeId={suggestedContentTypeId}
          onSelect={handleSelect}
          onClose={() => setOpen(false)}
        />
      )}
    </span>
  );
};

CreateEntryMenuTrigger.propTypes = {
  contentTypes: PropTypes.array.isRequired,
  suggestedContentTypeId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  testId: PropTypes.string,
  children: PropTypes.func.isRequired
};

CreateEntryMenuTrigger.defaultProps = {
  testId: 'create-entry-button-menu-trigger'
};

export default CreateEntryMenuTrigger;
