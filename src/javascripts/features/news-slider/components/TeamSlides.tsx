import React from 'react';
import { NewsSlider } from 'features/news-slider/NewsSlider';
import { Slide } from 'features/news-slider/Slide';
import { NewTeamSpace, NewTeamFeatures } from 'features/news-slider/components/team';

interface TeamSlidesProps {
  isShown: boolean;
  onClose: () => boolean;
}

export function TeamSlides({ isShown, onClose }: TeamSlidesProps) {
  if (!isShown) return null;

  return (
    <NewsSlider onClose={onClose}>
      <Slide>{({ onNext }) => <NewTeamSpace onNext={onNext} />}</Slide>
      <Slide>{() => <NewTeamFeatures />}</Slide>
    </NewsSlider>
  );
}
