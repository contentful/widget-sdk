import React, { useCallback, useMemo, useState } from 'react';

function useF36Modal(F36ModalComponent, initialProps = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const [props, setProps] = useState(initialProps);

  const showModal = useCallback(
    (args) => {
      setProps(args);
      setIsVisible(true);
    },
    [setIsVisible]
  );

  const onClose = useCallback(() => {
    setIsVisible(false);
  }, [setIsVisible]);

  const modalComponent = useMemo(() => {
    return isVisible ? (
      <F36ModalComponent isShown={isVisible} onClose={onClose} {...props} />
    ) : null;
  }, [isVisible, onClose, props]);

  return { modalComponent, showModal };
}

export default useF36Modal;
