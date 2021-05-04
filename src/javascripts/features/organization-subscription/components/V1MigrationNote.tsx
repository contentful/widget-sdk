import React from 'react';
import { Note, TextLink } from '@contentful/forma-36-react-components';

export enum BasePlanNames {
  COMMUNITY = 'Community',
  TEAM = 'Team',
  PRO_BONO = 'Pro Bono',
  PARTNER = 'Partner',
}

type V1MigrationNoteProps = {
  basePlanName: BasePlanNames;
  className: string;
};

export const V1MigrationNote = ({ basePlanName, className }: V1MigrationNoteProps) => {
  return (
    <Note
      className={className}
      title={`Your Contentful account has been upgraded to our ${basePlanName} tier`}>
      {'Check out your new plan in the overview below! Got Questions? Visit our '}
      <TextLink
        href="https://www.contentful.com/faq/legacy-spaces/"
        target="_blank"
        rel="noopener noreferrer">
        FAQ page
      </TextLink>
      {' or '}
      <TextLink
        href="https://www.contentful.com/support/"
        target="_blank"
        rel="noopener noreferrer">
        contact us
      </TextLink>
    </Note>
  );
};
