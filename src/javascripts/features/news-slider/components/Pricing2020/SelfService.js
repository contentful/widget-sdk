import React from 'react';
import PropTypes from 'prop-types';
import { NewsSlider } from 'features/news-slider/NewsSlider';
import { Slide } from 'features/news-slider/Slide';
import { PricingNewCommunitySpace } from './PricingNewCommunitySpace';
import { PricingNewFeatures } from './PricingNewFeatures';
import { PricingAssignedCommunitySpace } from './PricingAssignedCommunitySpace';

export function SelfService({ isShown, onClose, freeSpace, microSpaces }) {
  if (!isShown) return null;

  return (
    <NewsSlider onClose={onClose}>
      <Slide>{({ onNext }) => <PricingNewCommunitySpace onNext={onNext} />}</Slide>
      <Slide>{({ onNext }) => <PricingNewFeatures onNext={onNext} />}</Slide>
      <Slide>
        {() => (
          <PricingAssignedCommunitySpace
            communitySpaceName={freeSpace}
            microSpaceNames={microSpaces}
          />
        )}
      </Slide>
    </NewsSlider>
  );
}
SelfService.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired.prototype,
  freeSpace: PropTypes.string,
  microSpaces: PropTypes.arrayOf(PropTypes.string),
};
