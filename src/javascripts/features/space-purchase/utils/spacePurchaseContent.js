import React from 'react';

export const SPACE_PURCHASE_TYPES = {
  COMMUNITY: 'Community',
  MEDIUM: 'Medium',
  LARGE: 'Large',
  ENTERPRISE: 'Enterprise',
};

export const SPACE_PURCHASE_CONTENT = [
  {
    type: SPACE_PURCHASE_TYPES.MEDIUM,
    title: (
      <>
        <b>Team</b> Medium
      </>
    ),
    description:
      'Simple microsites, or one-off projects managed by a small team who all have the same access permissions.',
    callToAction: 'Select',
    limitsTitle: 'What are the space limits:',
    limits: [
      '7 locales',
      '2 role types (Admin & Editor)',
      '25,000 assets & entries',
      '4 environments (1 master & 3 sandbox)',
      '48 content types',
    ],
  },
  {
    type: SPACE_PURCHASE_TYPES.LARGE,
    title: (
      <>
        <b>Team</b> Large
      </>
    ),
    description:
      'Stand-alone experiences like a blog, or suite of pages that need more discrete publishing permissions or serve up to 10 markets.',
    callToAction: 'Select',
    limitsTitle: 'What are the space limits:',
    limits: [
      '10 locales',
      '4 role types (Admin, Editor, Author & Translators)',
      '50,000 assets & entries',
      '6 environments (1 master & 5 sandbox)',
      '48 content types',
    ],
  },
  {
    type: SPACE_PURCHASE_TYPES.ENTERPRISE,
    title: <b>Enterprise</b>,
    description:
      'Organizations that require customization, training and fewer limitations to power one — or hundreds — of digital experiences.',
    callToAction: 'Talk to us',
    limitsTitle: 'All the Team features, plus:',
    limits: [
      'SSO, Teams, and User Management API ',
      'Customizable roles and tasks',
      'Access to Customer Success Managers, Solution Architects & Professional Services',
      'Options for single tenant & multi-region infrastructure',
    ],
  },
];
