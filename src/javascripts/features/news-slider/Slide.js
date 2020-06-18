import { useContext } from 'react';
import { NewsSliderContext } from './NewsSlider';

export const Slide = ({ children }) => {
  const { onNext, onPrev } = useContext(NewsSliderContext);

  return children({ onNext, onPrev });
};
