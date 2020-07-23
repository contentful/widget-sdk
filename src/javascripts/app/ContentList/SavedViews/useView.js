import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

export const VIEWS_SHARED = 'shared';
export const VIEWS_PRIVATE = 'private';

export const viewPropTypes = PropTypes.oneOf([VIEWS_SHARED, VIEWS_PRIVATE]);

const useView = (initialView) => {
  const [selectedView, setSelectedView] = useState(initialView);

  useEffect(() => {
    setSelectedView(initialView);
  }, [initialView]);

  const setSharedViewSelected = () => {
    setSelectedView(VIEWS_SHARED);
  };

  const setPrivateViewSelected = () => {
    setSelectedView(VIEWS_PRIVATE);
  };

  return [selectedView, { setSharedViewSelected, setPrivateViewSelected, setSelectedView }];
};

export default useView;
