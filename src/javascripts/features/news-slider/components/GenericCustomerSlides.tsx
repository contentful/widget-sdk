import React from 'react';
import { NewsSlider } from 'features/news-slider/NewsSlider';
import { Slide } from 'features/news-slider/Slide';
import {
  NewSpaceUpdate,
  NewFeatures,
} from 'features/news-slider/components/genericCustomersSlides';

export enum BasePlanNames {
  COMMUNITY = 'Community',
  TEAM = 'Team',
  PRO_BONO = 'Pro Bono',
  PARTNER = 'Partner',
}

interface GenericCustomerProps {
  isShown: boolean;
  onClose: () => boolean;
  basePlanName: BasePlanNames;
}

export function GenericCustomerSlides({ isShown, onClose, basePlanName }: GenericCustomerProps) {
  if (!isShown) return null;

  return (
    <NewsSlider onClose={onClose}>
      <Slide>
        {({ onNext }) => <NewSpaceUpdate onNext={onNext} basePlanName={basePlanName} />}
      </Slide>
      <Slide>{() => <NewFeatures basePlanName={basePlanName} />}</Slide>
    </NewsSlider>
  );
}
