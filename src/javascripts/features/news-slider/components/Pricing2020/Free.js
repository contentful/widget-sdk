import React from 'react';
import PropTypes from 'prop-types';
import { NewsSlider } from 'features/news-slider/NewsSlider';
import { Slide } from 'features/news-slider/Slide';
import { PricingNewCommunitySpace } from './PricingNewCommunitySpace';
import { PricingNewFeatures } from './PricingNewFeatures';

export function Free({ isShown, onClose }) {
  if (!isShown) return null;

  return (
    <NewsSlider onClose={onClose}>
      <Slide>{({ onNext }) => <PricingNewCommunitySpace onNext={onNext} />}</Slide>
      <Slide>{() => <PricingNewFeatures />}</Slide>
    </NewsSlider>
  );
}
Free.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
