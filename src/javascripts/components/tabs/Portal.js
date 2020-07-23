import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';

const Portal = ({ children, containerRef, id }) => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  if (!isMounted || (!containerRef?.current && !id)) return null;

  const container = containerRef?.current || document.getElementById(id);
  return createPortal(children, container);
};

Portal.propTypes = {
  containerRef: PropTypes.any,
  children: PropTypes.node,
  id: PropTypes.string,
};

export default Portal;
