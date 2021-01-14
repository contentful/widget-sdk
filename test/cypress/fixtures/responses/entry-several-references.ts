import { Matchers } from '@pact-foundation/pact-web';
import {
  defaultContentTypeId,
  defaultEntryId,
  defaultSpaceId,
  defaultEnvironmentId,
} from '../../util/requests';

export const severalEntryReferencesResponse = {
  sys: {
    type: 'Array',
  },
  items: [
    entry({
      sys: { id: Matchers.somethingLike(defaultEntryId) },
      fields: {
        entryRef1: {
          'en-US': {
            sys: {
              type: 'Link',
              linkType: 'Entry',
              id: 'EntryId_01',
            },
          },
        },
        entryRef2: {
          'en-US': {
            sys: {
              type: 'Link',
              linkType: 'Entry',
              id: 'EntryId_02',
            },
          },
        },
      },
    }),
  ],
  includes: {
    Entry: [
      entry({ sys: { id: Matchers.somethingLike('EntryId_01') }, fields: {} }),
      entry({ sys: { id: Matchers.somethingLike('EntryId_02') }, fields: {} }),
    ],
  },
};

export const severalEntryReferencesWithVersionResponse = {
  sys: {
    type: 'Array',
  },
  items: [
    entry({
      sys: { id: Matchers.somethingLike(defaultEntryId) },
      fields: {
        entryRef1: {
          'en-US': {
            sys: {
              type: 'Link',
              linkType: 'Entry',
              id: 'testEntryId1',
            },
          },
        },
        entryRef2: {
          'en-US': {
            sys: {
              type: 'Link',
              linkType: 'Entry',
              id: 'testEntryId2',
            },
          },
        },
      },
    }),
  ],
  includes: {
    Entry: [
      entry({
        sys: { id: Matchers.somethingLike('testEntryId1'), version: 1, publishedCounter: 0 },
        fields: {},
      }),
      entry({
        sys: { id: Matchers.somethingLike('testEntryId2'), version: 1, publishedCounter: 0 },
        fields: {},
      }),
    ],
  },
};

export const severalEntryReferencesWithUnresolvedResponse = {
  sys: {
    type: 'Array',
  },
  items: [
    entry({
      sys: { id: Matchers.somethingLike(defaultEntryId) },
      fields: {
        entryRef1: {
          'en-US': {
            sys: {
              type: 'Link',
              linkType: 'Entry',
              id: 'EntryId_01',
            },
          },
        },
        unresolvedEntryReference: {
          'en-US': {
            sys: {
              type: 'Link',
              linkType: 'Entry',
              id: 'unresolved_id',
            },
          },
        },
        entryRef2: {
          'en-US': {
            sys: {
              type: 'Link',
              linkType: 'Entry',
              id: 'EntryId_02',
            },
          },
        },
      },
    }),
  ],
  includes: {
    Entry: [
      entry({ sys: { id: Matchers.somethingLike('EntryId_01') }, fields: {} }),
      entry({ sys: { id: Matchers.somethingLike('EntryId_02') }, fields: {} }),
    ],
  },
};

export const validateEntryReferencesSeveralRequest = {
  action: 'publish',
  entities: [
    {
      sys: {
        id: defaultEntryId,
        linkType: 'Entry',
        type: 'Link',
      },
    },
    {
      sys: {
        id: 'EntryId_01',
        linkType: 'Entry',
        type: 'Link',
      },
    },
    {
      sys: {
        id: 'EntryId_02',
        linkType: 'Entry',
        type: 'Link',
      },
    },
  ],
};

export const validateEntryReferencesSeveralErrorsResponse = {
  sys: {
    id: 'immediate',
    type: 'ReleaseValidation',
  },
  errored: [
    {
      sys: {
        type: 'Link',
        linkType: 'Entry',
        id: defaultEntryId,
      },
      error: {
        sys: {
          type: 'Error',
          id: 'InvalidEntry',
        },
        message: 'Validation error',
        details: {
          errors: [
            {
              name: 'required',
              path: ['fields', 'requiredText'],
              details: 'The property "requiredText" is required here',
            },
          ],
        },
      },
    },
  ],
};

export const publishEntryReferencesSeveralSuccessResponse = {
  sys: {
    type: 'Release',
    id: 'immediate',
  },
  entities: validateEntryReferencesSeveralRequest,
};

export const publishEntryReferencesSeveralRequest = validateEntryReferencesSeveralRequest;
export const publishEntryReferencesSeveralErrorsResponse = {
  sys: {
    id: 'immediate',
    type: 'Release',
  },
  details: {
    errors: validateEntryReferencesSeveralErrorsResponse.errored,
  },
};

export function entry(entryPayload = { sys: {}, fields: {} }) {
  const environment = {
    sys: {
      type: 'Link',
      linkType: 'Environment',
      id: defaultEnvironmentId,
    },
  };

  const sys = {
    id: 'entryID',
    type: 'Entry',
    createdAt: Matchers.iso8601DateTimeWithMillis('2119-09-02T13:00:00.000Z'),
    publishedCounter: 0,
    version: 1,
    createdBy: {
      sys: {
        id: '1AMbGlddLG0ISEoa1I423p',
        linkType: 'User',
        type: 'Link',
      },
    },
    space: {
      sys: {
        id: defaultSpaceId,
        linkType: 'Space',
        type: 'Link',
      },
    },
    environment,
    contentType: {
      sys: {
        id: defaultContentTypeId,
        linkType: 'ContentType',
        type: 'Link',
      },
    },
    ...entryPayload.sys,
  };

  const fields = {
    fieldID: {
      'en-US': '1',
    },
    ...entryPayload.fields,
  };

  return {
    sys,
    fields,
  };
}
