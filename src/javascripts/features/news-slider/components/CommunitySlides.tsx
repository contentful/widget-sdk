import React from 'react';
import { NewsSlider } from 'features/news-slider/NewsSlider';
import { Slide } from 'features/news-slider/Slide';
import { NewCommunitySpace, NewCommunityFeatures } from 'features/news-slider/components/community';

interface CommunitySlidesProps {
  isShown: boolean;
  onClose: () => boolean;
}

export function CommunitySlides({ isShown, onClose }: CommunitySlidesProps) {
  if (!isShown) return null;

  return (
    <NewsSlider onClose={onClose}>
      <Slide>{({ onNext }) => <NewCommunitySpace onNext={onNext} />}</Slide>
      <Slide>{() => <NewCommunityFeatures />}</Slide>
    </NewsSlider>
  );
}
