export const arrayOfReferences = {
  sys: {
    type: 'Array',
  },
  errors: [
    {
      sys: {
        id: 'notResolvable',
        type: 'error',
      },
      details: {
        id: '5s1h70JCx0faANRHxwFyXx',
        type: 'Link',
        linkType: 'Entry',
      },
    },
    {
      sys: {
        id: 'notResolvable',
        type: 'error',
      },
      details: {
        type: 'Link',
        linkType: 'Entry',
        id: '5s1h70JCx0faANRHxwFyXx',
      },
    },
  ],
  items: [
    {
      sys: {
        space: {
          sys: {
            type: 'Link',
            linkType: 'Space',
            id: 'uxn1u7m0txgd',
          },
        },
        id: '4zaYBA8hYIxwRHsKfyJOVN',
        type: 'Entry',
        createdAt: '2019-12-16T12:22:36.218Z',
        updatedAt: '2020-03-04T16:36:17.263Z',
        environment: {
          sys: {
            id: 'master',
            type: 'Link',
            linkType: 'Environment',
          },
        },
        publishedVersion: 3,
        publishedAt: '2019-12-16T14:00:10.531Z',
        firstPublishedAt: '2019-12-16T14:00:10.531Z',
        createdBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        updatedBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        publishedCounter: 1,
        version: 26,
        publishedBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        contentType: {
          sys: {
            type: 'Link',
            linkType: 'ContentType',
            id: 'user',
          },
        },
      },
      fields: {
        name: {
          de: 'test',
          'en-US': 'Root',
        },
        arrayOfRefs: {
          'en-US': [
            {
              sys: {
                type: 'Link',
                linkType: 'Entry',
                id: '3ADrOROW1jot5jExFOjt4i',
              },
            },
            {
              sys: {
                type: 'Link',
                linkType: 'Entry',
                id: 'iFsN9FnCxUVNrXnUbGeJu',
              },
            },
            {
              sys: {
                type: 'Link',
                linkType: 'Entry',
                id: '5yFvj9td7s9n7GlRH1wqSA',
              },
            },
          ],
        },
        tags: {
          'en-US': ['Test 1', 'Test 2', 'Test 3', 'Test 4', 'Test 5'],
        },
      },
    },
  ],
  includes: {
    Entry: [
      {
        sys: {
          space: {
            sys: {
              type: 'Link',
              linkType: 'Space',
              id: 'uxn1u7m0txgd',
            },
          },
          id: '3ADrOROW1jot5jExFOjt4i',
          type: 'Entry',
          createdAt: '2020-02-04T15:20:18.181Z',
          updatedAt: '2020-02-04T15:20:18.181Z',
          environment: {
            sys: {
              id: 'master',
              type: 'Link',
              linkType: 'Environment',
            },
          },
          createdBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          updatedBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          publishedCounter: 0,
          version: 1,
          contentType: {
            sys: {
              type: 'Link',
              linkType: 'ContentType',
              id: 'user',
            },
          },
        },
        fields: {
          name: {
            de: 'Test (1)',
            'en-US': 'Entry 3',
          },
        },
      },
      {
        sys: {
          space: {
            sys: {
              type: 'Link',
              linkType: 'Space',
              id: 'uxn1u7m0txgd',
            },
          },
          id: '5yFvj9td7s9n7GlRH1wqSA',
          type: 'Entry',
          createdAt: '2020-01-10T16:22:32.755Z',
          updatedAt: '2020-01-10T16:22:32.755Z',
          environment: {
            sys: {
              id: 'master',
              type: 'Link',
              linkType: 'Environment',
            },
          },
          createdBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          updatedBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          publishedCounter: 0,
          version: 1,
          contentType: {
            sys: {
              type: 'Link',
              linkType: 'ContentType',
              id: 'user',
            },
          },
        },
        fields: {
          name: {
            'en-US': 'Entry 2',
          },
        },
      },
      {
        sys: {
          space: {
            sys: {
              type: 'Link',
              linkType: 'Space',
              id: 'uxn1u7m0txgd',
            },
          },
          id: 'iFsN9FnCxUVNrXnUbGeJu',
          type: 'Entry',
          createdAt: '2019-12-17T10:57:56.591Z',
          updatedAt: '2020-03-03T15:01:58.131Z',
          environment: {
            sys: {
              id: 'master',
              type: 'Link',
              linkType: 'Environment',
            },
          },
          publishedVersion: 11,
          publishedAt: '2020-01-10T16:22:14.228Z',
          firstPublishedAt: '2020-01-10T16:22:14.228Z',
          createdBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          updatedBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          publishedCounter: 1,
          version: 14,
          publishedBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          contentType: {
            sys: {
              type: 'Link',
              linkType: 'ContentType',
              id: 'user',
            },
          },
        },
        fields: {
          name: {
            'en-US': 'Entry 1',
          },
        },
      },
    ],
    Asset: [],
  },
};

export const circularReferences = {
  sys: {
    type: 'Array',
  },
  errors: [],
  items: [
    {
      sys: {
        space: {
          sys: {
            type: 'Link',
            linkType: 'Space',
            id: 'uxn1u7m0txgd',
          },
        },
        id: '4zaYBA8hYIxwRHsKfyJOVN',
        type: 'Entry',
        createdAt: '2019-12-16T12:22:36.218Z',
        updatedAt: '2020-03-04T16:36:17.263Z',
        environment: {
          sys: {
            id: 'master',
            type: 'Link',
            linkType: 'Environment',
          },
        },
        publishedVersion: 3,
        publishedAt: '2019-12-16T14:00:10.531Z',
        firstPublishedAt: '2019-12-16T14:00:10.531Z',
        createdBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        updatedBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        publishedCounter: 1,
        version: 26,
        publishedBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        contentType: {
          sys: {
            type: 'Link',
            linkType: 'ContentType',
            id: 'user',
          },
        },
      },
      fields: {
        name: {
          de: 'test',
          'en-US': 'Root',
        },
        entryRef1: {
          'en-US': {
            sys: {
              type: 'Link',
              linkType: 'Entry',
              id: '3ADrOROW1jot5jExFOjt4i',
            },
          },
        },
        tags: {
          'en-US': ['Test 1', 'Test 2', 'Test 3', 'Test 4', 'Test 5'],
        },
      },
    },
  ],
  includes: {
    Entry: [
      {
        sys: {
          space: {
            sys: {
              type: 'Link',
              linkType: 'Space',
              id: 'uxn1u7m0txgd',
            },
          },
          id: '3ADrOROW1jot5jExFOjt4i',
          type: 'Entry',
          createdAt: '2020-02-04T15:20:18.181Z',
          updatedAt: '2020-02-04T15:20:18.181Z',
          environment: {
            sys: {
              id: 'master',
              type: 'Link',
              linkType: 'Environment',
            },
          },
          createdBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          updatedBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          publishedCounter: 0,
          version: 1,
          contentType: {
            sys: {
              type: 'Link',
              linkType: 'ContentType',
              id: 'user',
            },
          },
        },
        fields: {
          name: {
            de: 'Test (1)',
            'en-US': 'TEst3 (sched) (1)',
          },
          ref: {
            'en-US': {
              sys: {
                type: 'Link',
                linkType: 'Entry',
                id: 'iFsN9FnCxUVNrXnUbGeJu',
              },
            },
          },
        },
      },
      {
        sys: {
          space: {
            sys: {
              type: 'Link',
              linkType: 'Space',
              id: 'uxn1u7m0txgd',
            },
          },
          id: 'iFsN9FnCxUVNrXnUbGeJu',
          type: 'Entry',
          createdAt: '2019-12-17T10:57:56.591Z',
          updatedAt: '2020-03-03T15:01:58.131Z',
          environment: {
            sys: {
              id: 'master',
              type: 'Link',
              linkType: 'Environment',
            },
          },
          publishedVersion: 11,
          publishedAt: '2020-01-10T16:22:14.228Z',
          firstPublishedAt: '2020-01-10T16:22:14.228Z',
          createdBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          updatedBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          publishedCounter: 1,
          version: 14,
          publishedBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          contentType: {
            sys: {
              type: 'Link',
              linkType: 'ContentType',
              id: 'user',
            },
          },
        },
        fields: {
          name: {
            de: 'Test (0)',
            'en-US': 'TEst3 (0)',
          },
          ref: {
            'en-US': {
              sys: {
                type: 'Link',
                linkType: 'Entry',
                id: '4zaYBA8hYIxwRHsKfyJOVN',
              },
            },
          },
        },
      },
    ],
    Asset: [],
  },
};

export const depthLimit = {
  sys: {
    type: 'Array',
  },
  errors: [],
  items: [
    {
      sys: {
        space: {
          sys: {
            type: 'Link',
            linkType: 'Space',
            id: 'uxn1u7m0txgd',
          },
        },
        id: '4zaYBA8hYIxwRHsKfyJOVN',
        type: 'Entry',
        createdAt: '2019-12-16T12:22:36.218Z',
        updatedAt: '2020-03-04T16:36:17.263Z',
        environment: {
          sys: {
            id: 'master',
            type: 'Link',
            linkType: 'Environment',
          },
        },
        publishedVersion: 3,
        publishedAt: '2019-12-16T14:00:10.531Z',
        firstPublishedAt: '2019-12-16T14:00:10.531Z',
        createdBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        updatedBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        publishedCounter: 1,
        version: 26,
        publishedBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        contentType: {
          sys: {
            type: 'Link',
            linkType: 'ContentType',
            id: 'user',
          },
        },
      },
      fields: {
        name: {
          de: 'test',
          'en-US': 'Root',
        },
        entryRef1: {
          'en-US': {
            sys: {
              type: 'Link',
              linkType: 'Entry',
              id: '3ADrOROW1jot5jExFOjt4i',
            },
          },
        },
        tags: {
          'en-US': ['Test 1', 'Test 2', 'Test 3', 'Test 4', 'Test 5'],
        },
      },
    },
  ],
  includes: {
    Entry: [
      {
        sys: {
          space: {
            sys: {
              type: 'Link',
              linkType: 'Space',
              id: 'uxn1u7m0txgd',
            },
          },
          id: '3ADrOROW1jot5jExFOjt4i',
          type: 'Entry',
          createdAt: '2020-02-04T15:20:18.181Z',
          updatedAt: '2020-02-04T15:20:18.181Z',
          environment: {
            sys: {
              id: 'master',
              type: 'Link',
              linkType: 'Environment',
            },
          },
          createdBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          updatedBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          publishedCounter: 0,
          version: 1,
          contentType: {
            sys: {
              type: 'Link',
              linkType: 'ContentType',
              id: 'user',
            },
          },
        },
        fields: {
          name: {
            de: 'Test (1)',
            'en-US': 'TEst3 (sched) (1)',
          },
          ref: {
            'en-US': {
              sys: {
                type: 'Link',
                linkType: 'Entry',
                id: 'iFsN9FnCxUVNrXnUbGeJu',
              },
            },
          },
        },
      },
      {
        sys: {
          space: {
            sys: {
              type: 'Link',
              linkType: 'Space',
              id: 'uxn1u7m0txgd',
            },
          },
          id: 'iFsN9FnCxUVNrXnUbGeJu',
          type: 'Entry',
          createdAt: '2019-12-17T10:57:56.591Z',
          updatedAt: '2020-03-03T15:01:58.131Z',
          environment: {
            sys: {
              id: 'master',
              type: 'Link',
              linkType: 'Environment',
            },
          },
          publishedVersion: 11,
          publishedAt: '2020-01-10T16:22:14.228Z',
          firstPublishedAt: '2020-01-10T16:22:14.228Z',
          createdBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          updatedBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          publishedCounter: 1,
          version: 14,
          publishedBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          contentType: {
            sys: {
              type: 'Link',
              linkType: 'ContentType',
              id: 'user',
            },
          },
        },
        fields: {
          name: {
            de: 'Test (0)',
            'en-US': 'TEst3 (0)',
          },
        },
      },
    ],
    Asset: [],
  },
};

export const nestedArrayOfReferences = {
  sys: {
    type: 'Array',
  },
  errors: [],
  items: [
    {
      sys: {
        space: {
          sys: {
            type: 'Link',
            linkType: 'Space',
            id: 'uxn1u7m0txgd',
          },
        },
        id: '4zaYBA8hYIxwRHsKfyJOVN',
        type: 'Entry',
        createdAt: '2019-12-16T12:22:36.218Z',
        updatedAt: '2020-03-04T16:36:17.263Z',
        environment: {
          sys: {
            id: 'master',
            type: 'Link',
            linkType: 'Environment',
          },
        },
        publishedVersion: 3,
        publishedAt: '2019-12-16T14:00:10.531Z',
        firstPublishedAt: '2019-12-16T14:00:10.531Z',
        createdBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        updatedBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        publishedCounter: 1,
        version: 26,
        publishedBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        contentType: {
          sys: {
            type: 'Link',
            linkType: 'ContentType',
            id: 'user',
          },
        },
      },
      fields: {
        name: {
          de: 'test',
          'en-US': 'Root',
        },
        entryArray: {
          'en-US': [
            {
              sys: {
                type: 'Link',
                linkType: 'Entry',
                id: '3ADrOROW1jot5jExFOjt4i',
              },
            },
            {
              sys: {
                type: 'Link',
                linkType: 'Entry',
                id: 'iFsN9FnCxUVNrXnUbGeJu',
              },
            },
          ],
        },
        tags: {
          'en-US': ['Test 1', 'Test 2', 'Test 3', 'Test 4', 'Test 5'],
        },
      },
    },
  ],
  includes: {
    Entry: [
      {
        sys: {
          space: {
            sys: {
              type: 'Link',
              linkType: 'Space',
              id: 'uxn1u7m0txgd',
            },
          },
          id: '3ADrOROW1jot5jExFOjt4i',
          type: 'Entry',
          createdAt: '2020-02-04T15:20:18.181Z',
          updatedAt: '2020-02-04T15:20:18.181Z',
          environment: {
            sys: {
              id: 'master',
              type: 'Link',
              linkType: 'Environment',
            },
          },
          createdBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          updatedBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          publishedCounter: 0,
          version: 1,
          contentType: {
            sys: {
              type: 'Link',
              linkType: 'ContentType',
              id: 'user',
            },
          },
        },
        fields: {
          name: {
            de: 'Test (1)',
            'en-US': 'TEst3 (sched) (1)',
          },
          innerSimpleRef: {
            'en-US': {
              sys: {
                type: 'Link',
                linkType: 'Entry',
                id: '4ADrOROW1jot5jExFOjt4j',
              },
            },
          },
        },
      },
      {
        sys: {
          space: {
            sys: {
              type: 'Link',
              linkType: 'Space',
              id: 'uxn1u7m0txgd',
            },
          },
          id: 'iFsN9FnCxUVNrXnUbGeJu',
          type: 'Entry',
          createdAt: '2019-12-17T10:57:56.591Z',
          updatedAt: '2020-03-03T15:01:58.131Z',
          environment: {
            sys: {
              id: 'master',
              type: 'Link',
              linkType: 'Environment',
            },
          },
          publishedVersion: 11,
          publishedAt: '2020-01-10T16:22:14.228Z',
          firstPublishedAt: '2020-01-10T16:22:14.228Z',
          createdBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          updatedBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          publishedCounter: 1,
          version: 14,
          publishedBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          contentType: {
            sys: {
              type: 'Link',
              linkType: 'ContentType',
              id: 'user',
            },
          },
        },
        fields: {
          name: {
            de: 'Test (0)',
            'en-US': 'TEst3 (0)',
          },
          innerSimpleRef: {
            'en-US': {
              sys: {
                type: 'Link',
                linkType: 'Entry',
                id: '4ADrOROW1jot5jExFOjt4j',
              },
            },
          },
        },
      },
      {
        sys: {
          space: {
            sys: {
              type: 'Link',
              linkType: 'Space',
              id: 'uxn1u7m0txgd',
            },
          },
          id: '4ADrOROW1jot5jExFOjt4j',
          type: 'Entry',
          createdAt: '2020-02-04T15:20:18.181Z',
          updatedAt: '2020-02-04T15:20:18.181Z',
          environment: {
            sys: {
              id: 'master',
              type: 'Link',
              linkType: 'Environment',
            },
          },
          createdBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          updatedBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          publishedCounter: 0,
          version: 1,
          contentType: {
            sys: {
              type: 'Link',
              linkType: 'ContentType',
              id: 'user',
            },
          },
        },
        fields: {
          name: {
            de: 'Test (1)',
            'en-US': 'Inner Entry',
          },
        },
      },
    ],
    Asset: [],
  },
};

export const nestedSimpleReferences = {
  sys: {
    type: 'Array',
  },
  errors: [],
  items: [
    {
      sys: {
        space: {
          sys: {
            type: 'Link',
            linkType: 'Space',
            id: 'uxn1u7m0txgd',
          },
        },
        id: '4zaYBA8hYIxwRHsKfyJOVN',
        type: 'Entry',
        createdAt: '2019-12-16T12:22:36.218Z',
        updatedAt: '2020-03-04T16:36:17.263Z',
        environment: {
          sys: {
            id: 'master',
            type: 'Link',
            linkType: 'Environment',
          },
        },
        publishedVersion: 3,
        publishedAt: '2019-12-16T14:00:10.531Z',
        firstPublishedAt: '2019-12-16T14:00:10.531Z',
        createdBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        updatedBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        publishedCounter: 1,
        version: 26,
        publishedBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        contentType: {
          sys: {
            type: 'Link',
            linkType: 'ContentType',
            id: 'user',
          },
        },
      },
      fields: {
        name: {
          de: 'test',
          'en-US': 'Root',
        },
        entryRef1: {
          'en-US': {
            sys: {
              type: 'Link',
              linkType: 'Entry',
              id: '3ADrOROW1jot5jExFOjt4i',
            },
          },
        },
        entryRef2: {
          'en-US': {
            sys: {
              type: 'Link',
              linkType: 'Entry',
              id: 'iFsN9FnCxUVNrXnUbGeJu',
            },
          },
        },
        tags: {
          'en-US': ['Test 1', 'Test 2', 'Test 3', 'Test 4', 'Test 5'],
        },
      },
    },
  ],
  includes: {
    Entry: [
      {
        sys: {
          space: {
            sys: {
              type: 'Link',
              linkType: 'Space',
              id: 'uxn1u7m0txgd',
            },
          },
          id: '3ADrOROW1jot5jExFOjt4i',
          type: 'Entry',
          createdAt: '2020-02-04T15:20:18.181Z',
          updatedAt: '2020-02-04T15:20:18.181Z',
          environment: {
            sys: {
              id: 'master',
              type: 'Link',
              linkType: 'Environment',
            },
          },
          createdBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          updatedBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          publishedCounter: 0,
          version: 1,
          contentType: {
            sys: {
              type: 'Link',
              linkType: 'ContentType',
              id: 'user',
            },
          },
        },
        fields: {
          name: {
            de: 'Test (1)',
            'en-US': 'TEst3 (sched) (1)',
          },
          innerSimpleRef: {
            'en-US': {
              sys: {
                type: 'Link',
                linkType: 'Entry',
                id: '4ADrOROW1jot5jExFOjt4j',
              },
            },
          },
        },
      },
      {
        sys: {
          space: {
            sys: {
              type: 'Link',
              linkType: 'Space',
              id: 'uxn1u7m0txgd',
            },
          },
          id: 'iFsN9FnCxUVNrXnUbGeJu',
          type: 'Entry',
          createdAt: '2019-12-17T10:57:56.591Z',
          updatedAt: '2020-03-03T15:01:58.131Z',
          environment: {
            sys: {
              id: 'master',
              type: 'Link',
              linkType: 'Environment',
            },
          },
          publishedVersion: 11,
          publishedAt: '2020-01-10T16:22:14.228Z',
          firstPublishedAt: '2020-01-10T16:22:14.228Z',
          createdBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          updatedBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          publishedCounter: 1,
          version: 14,
          publishedBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          contentType: {
            sys: {
              type: 'Link',
              linkType: 'ContentType',
              id: 'user',
            },
          },
        },
        fields: {
          name: {
            de: 'Test (0)',
            'en-US': 'TEst3 (0)',
          },
          innerSimpleRef: {
            'en-US': {
              sys: {
                type: 'Link',
                linkType: 'Entry',
                id: '4ADrOROW1jot5jExFOjt4j',
              },
            },
          },
        },
      },
      {
        sys: {
          space: {
            sys: {
              type: 'Link',
              linkType: 'Space',
              id: 'uxn1u7m0txgd',
            },
          },
          id: '4ADrOROW1jot5jExFOjt4j',
          type: 'Entry',
          createdAt: '2020-02-04T15:20:18.181Z',
          updatedAt: '2020-02-04T15:20:18.181Z',
          environment: {
            sys: {
              id: 'master',
              type: 'Link',
              linkType: 'Environment',
            },
          },
          createdBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          updatedBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          publishedCounter: 0,
          version: 1,
          contentType: {
            sys: {
              type: 'Link',
              linkType: 'ContentType',
              id: 'user',
            },
          },
        },
        fields: {
          name: {
            de: 'Test (1)',
            'en-US': 'Inner Entry',
          },
        },
      },
    ],
    Asset: [],
  },
};

export const richTextEmbeddedInlineEntryReferences = {
  sys: {
    type: 'Array',
  },
  errors: [
    {
      sys: {
        id: 'notResolvable',
        type: 'error',
      },
      details: {
        id: '5s1h70JCx0faANRHxwFyXx',
        type: 'Link',
        linkType: 'Entry',
      },
    },
    {
      sys: {
        id: 'notResolvable',
        type: 'error',
      },
      details: {
        type: 'Link',
        linkType: 'Entry',
        id: '5s1h70JCx0faANRHxwFyXx',
      },
    },
  ],
  items: [
    {
      sys: {
        space: {
          sys: {
            type: 'Link',
            linkType: 'Space',
            id: 'uxn1u7m0txgd',
          },
        },
        id: '4zaYBA8hYIxwRHsKfyJOVN',
        type: 'Entry',
        createdAt: '2019-12-16T12:22:36.218Z',
        updatedAt: '2020-03-04T16:36:17.263Z',
        environment: {
          sys: {
            id: 'master',
            type: 'Link',
            linkType: 'Environment',
          },
        },
        publishedVersion: 3,
        publishedAt: '2019-12-16T14:00:10.531Z',
        firstPublishedAt: '2019-12-16T14:00:10.531Z',
        createdBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        updatedBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        publishedCounter: 1,
        version: 26,
        publishedBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        contentType: {
          sys: {
            type: 'Link',
            linkType: 'ContentType',
            id: 'user',
          },
        },
      },
      fields: {
        name: {
          de: 'test',
          'en-US': 'Root',
        },
        monologue: {
          'en-US': {
            data: {},
            content: [
              {
                data: {},
                content: [
                  {
                    data: {},
                    marks: [],
                    value: '',
                    nodeType: 'text',
                  },
                  {
                    data: {
                      target: {
                        sys: {
                          id: '5yFvj9td7s9n7GlRH1wqSA',
                          type: 'Link',
                          linkType: 'Entry',
                        },
                      },
                    },
                    content: [],
                    nodeType: 'embedded-entry-inline',
                  },
                  {
                    data: {},
                    marks: [],
                    value: '',
                    nodeType: 'text',
                  },
                ],
                nodeType: 'paragraph',
              },
            ],
            nodeType: 'document',
          },
        },
        tags: {
          'en-US': ['Test 1', 'Test 2', 'Test 3', 'Test 4', 'Test 5'],
        },
      },
    },
  ],
  includes: {
    Entry: [
      {
        sys: {
          space: {
            sys: {
              type: 'Link',
              linkType: 'Space',
              id: 'uxn1u7m0txgd',
            },
          },
          id: '5yFvj9td7s9n7GlRH1wqSA',
          type: 'Entry',
          createdAt: '2020-01-10T16:22:32.755Z',
          updatedAt: '2020-01-10T16:22:32.755Z',
          environment: {
            sys: {
              id: 'master',
              type: 'Link',
              linkType: 'Environment',
            },
          },
          createdBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          updatedBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          publishedCounter: 0,
          version: 1,
          contentType: {
            sys: {
              type: 'Link',
              linkType: 'ContentType',
              id: 'user',
            },
          },
        },
        fields: {
          name: {
            'en-US': 'Entry',
          },
        },
      },
    ],
    Asset: [],
  },
};

export const richTextHyperlinkReference = {
  sys: {
    type: 'Array',
  },
  errors: [
    {
      sys: {
        id: 'notResolvable',
        type: 'error',
      },
      details: {
        id: '5s1h70JCx0faANRHxwFyXx',
        type: 'Link',
        linkType: 'Entry',
      },
    },
    {
      sys: {
        id: 'notResolvable',
        type: 'error',
      },
      details: {
        type: 'Link',
        linkType: 'Entry',
        id: '5s1h70JCx0faANRHxwFyXx',
      },
    },
  ],
  items: [
    {
      sys: {
        space: {
          sys: {
            type: 'Link',
            linkType: 'Space',
            id: 'uxn1u7m0txgd',
          },
        },
        id: '4zaYBA8hYIxwRHsKfyJOVN',
        type: 'Entry',
        createdAt: '2019-12-16T12:22:36.218Z',
        updatedAt: '2020-03-04T16:36:17.263Z',
        environment: {
          sys: {
            id: 'master',
            type: 'Link',
            linkType: 'Environment',
          },
        },
        publishedVersion: 3,
        publishedAt: '2019-12-16T14:00:10.531Z',
        firstPublishedAt: '2019-12-16T14:00:10.531Z',
        createdBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        updatedBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        publishedCounter: 1,
        version: 26,
        publishedBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        contentType: {
          sys: {
            type: 'Link',
            linkType: 'ContentType',
            id: 'user',
          },
        },
      },
      fields: {
        name: {
          de: 'test',
          'en-US': 'Root',
        },
        monologue: {
          'en-US': {
            data: {},
            content: [
              {
                nodeType: 'entry-hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'test link',
                    marks: [],
                    data: {},
                  },
                ],
                data: {
                  target: {
                    sys: {
                      id: '5yFvj9td7s9n7GlRH1wqSA',
                      type: 'Link',
                      linkType: 'Entry',
                    },
                  },
                },
              },
            ],
            nodeType: 'document',
          },
        },
        tags: {
          'en-US': ['Test 1', 'Test 2', 'Test 3', 'Test 4', 'Test 5'],
        },
      },
    },
  ],
  includes: {
    Entry: [
      {
        sys: {
          space: {
            sys: {
              type: 'Link',
              linkType: 'Space',
              id: 'uxn1u7m0txgd',
            },
          },
          id: '5yFvj9td7s9n7GlRH1wqSA',
          type: 'Entry',
          createdAt: '2020-01-10T16:22:32.755Z',
          updatedAt: '2020-01-10T16:22:32.755Z',
          environment: {
            sys: {
              id: 'master',
              type: 'Link',
              linkType: 'Environment',
            },
          },
          createdBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          updatedBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          publishedCounter: 0,
          version: 1,
          contentType: {
            sys: {
              type: 'Link',
              linkType: 'ContentType',
              id: 'user',
            },
          },
        },
        fields: {
          name: {
            'en-US': 'Entry',
          },
        },
      },
    ],
    Asset: [],
  },
};

export const richTextSimpleReferences = {
  sys: {
    type: 'Array',
  },
  errors: [
    {
      sys: {
        id: 'notResolvable',
        type: 'error',
      },
      details: {
        id: '5s1h70JCx0faANRHxwFyXx',
        type: 'Link',
        linkType: 'Entry',
      },
    },
    {
      sys: {
        id: 'notResolvable',
        type: 'error',
      },
      details: {
        type: 'Link',
        linkType: 'Entry',
        id: '5s1h70JCx0faANRHxwFyXx',
      },
    },
  ],
  items: [
    {
      sys: {
        space: {
          sys: {
            type: 'Link',
            linkType: 'Space',
            id: 'uxn1u7m0txgd',
          },
        },
        id: '4zaYBA8hYIxwRHsKfyJOVN',
        type: 'Entry',
        createdAt: '2019-12-16T12:22:36.218Z',
        updatedAt: '2020-03-04T16:36:17.263Z',
        environment: {
          sys: {
            id: 'master',
            type: 'Link',
            linkType: 'Environment',
          },
        },
        publishedVersion: 3,
        publishedAt: '2019-12-16T14:00:10.531Z',
        firstPublishedAt: '2019-12-16T14:00:10.531Z',
        createdBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        updatedBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        publishedCounter: 1,
        version: 26,
        publishedBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        contentType: {
          sys: {
            type: 'Link',
            linkType: 'ContentType',
            id: 'user',
          },
        },
      },
      fields: {
        name: {
          de: 'test',
          'en-US': 'Root',
        },
        monologue: {
          'en-US': {
            data: {},
            content: [
              {
                data: {
                  target: {
                    sys: {
                      id: '5yFvj9td7s9n7GlRH1wqSA',
                      type: 'Link',
                      linkType: 'Entry',
                    },
                  },
                },
                content: [],
                nodeType: 'embedded-entry-block',
              },
              {
                data: {
                  target: {
                    sys: {
                      id: '7c1UsDsOc6bZEAiR4aqLBE',
                      type: 'Link',
                      linkType: 'Entry',
                    },
                  },
                },
                content: [],
                nodeType: 'embedded-entry-block',
              },
              {
                data: {
                  target: {
                    sys: {
                      id: '3ax6WfgrHJXRQIZT4Fi6my',
                      type: 'Link',
                      linkType: 'Entry',
                    },
                  },
                },
                content: [],
                nodeType: 'embedded-entry-block',
              },
              {
                data: {
                  target: {
                    sys: {
                      id: '1TW36Lhg6vjjiOwnS4pK6f',
                      type: 'Link',
                      linkType: 'Asset',
                    },
                  },
                },
                content: [],
                nodeType: 'embedded-asset-block',
              },
            ],
            nodeType: 'document',
          },
        },
        tags: {
          'en-US': ['Test 1', 'Test 2', 'Test 3', 'Test 4', 'Test 5'],
        },
      },
    },
  ],
  includes: {
    Entry: [
      {
        sys: {
          space: {
            sys: {
              type: 'Link',
              linkType: 'Space',
              id: 'uxn1u7m0txgd',
            },
          },
          id: '3ax6WfgrHJXRQIZT4Fi6my',
          type: 'Entry',
          createdAt: '2019-12-12T14:55:59.408Z',
          updatedAt: '2019-12-12T14:55:59.408Z',
          environment: {
            sys: {
              id: 'master',
              type: 'Link',
              linkType: 'Environment',
            },
          },
          createdBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          updatedBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          publishedCounter: 0,
          version: 1,
          contentType: {
            sys: {
              type: 'Link',
              linkType: 'ContentType',
              id: 'user',
            },
          },
        },
        fields: {
          name: {
            'en-US': 'TEst3',
          },
        },
      },
      {
        sys: {
          space: {
            sys: {
              type: 'Link',
              linkType: 'Space',
              id: 'uxn1u7m0txgd',
            },
          },
          id: '5yFvj9td7s9n7GlRH1wqSA',
          type: 'Entry',
          createdAt: '2020-01-10T16:22:32.755Z',
          updatedAt: '2020-01-10T16:22:32.755Z',
          environment: {
            sys: {
              id: 'master',
              type: 'Link',
              linkType: 'Environment',
            },
          },
          createdBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          updatedBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          publishedCounter: 0,
          version: 1,
          contentType: {
            sys: {
              type: 'Link',
              linkType: 'ContentType',
              id: 'user',
            },
          },
        },
        fields: {
          name: {
            'en-US': 'Entry',
          },
        },
      },
      {
        sys: {
          space: {
            sys: {
              type: 'Link',
              linkType: 'Space',
              id: 'uxn1u7m0txgd',
            },
          },
          id: '7c1UsDsOc6bZEAiR4aqLBE',
          type: 'Entry',
          createdAt: '2019-12-16T12:22:27.477Z',
          updatedAt: '2019-12-16T12:22:27.477Z',
          environment: {
            sys: {
              id: 'master',
              type: 'Link',
              linkType: 'Environment',
            },
          },
          createdBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          updatedBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          publishedCounter: 0,
          version: 1,
          contentType: {
            sys: {
              type: 'Link',
              linkType: 'ContentType',
              id: 'user',
            },
          },
        },
        fields: {
          name: {
            'en-US': 'TEst3 (2)',
          },
        },
      },
    ],
    Asset: [
      {
        sys: {
          space: {
            sys: {
              type: 'Link',
              linkType: 'Space',
              id: 'uxn1u7m0txgd',
            },
          },
          id: '1TW36Lhg6vjjiOwnS4pK6f',
          type: 'Asset',
          createdAt: '2019-12-06T14:01:55.853Z',
          updatedAt: '2019-12-06T14:01:56.600Z',
          environment: {
            sys: {
              id: 'master',
              type: 'Link',
              linkType: 'Environment',
            },
          },
          createdBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          updatedBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          publishedCounter: 0,
          version: 2,
        },
        fields: {
          title: {
            'en-US': 'Parrot',
          },
          file: {
            'en-US': {
              url:
                '//images.flinkly.com/uxn1u7m0txgd/1TW36Lhg6vjjiOwnS4pK6f/7963059fc276dee74e3bf6921d907b86/parrot.jpg',
              details: {
                size: 76313,
                image: {
                  width: 640,
                  height: 480,
                },
              },
              fileName: 'Parrot',
              contentType: 'image/jpeg',
            },
          },
        },
      },
    ],
  },
};

export const simpleReferences = {
  sys: {
    type: 'Array',
  },
  errors: [],
  items: [
    {
      sys: {
        space: {
          sys: {
            type: 'Link',
            linkType: 'Space',
            id: 'uxn1u7m0txgd',
          },
        },
        id: '4zaYBA8hYIxwRHsKfyJOVN',
        type: 'Entry',
        createdAt: '2019-12-16T12:22:36.218Z',
        updatedAt: '2020-03-04T16:36:17.263Z',
        environment: {
          sys: {
            id: 'master',
            type: 'Link',
            linkType: 'Environment',
          },
        },
        publishedVersion: 3,
        publishedAt: '2019-12-16T14:00:10.531Z',
        firstPublishedAt: '2019-12-16T14:00:10.531Z',
        createdBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        updatedBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        publishedCounter: 1,
        version: 26,
        publishedBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        contentType: {
          sys: {
            type: 'Link',
            linkType: 'ContentType',
            id: 'user',
          },
        },
      },
      fields: {
        name: {
          de: 'test',
          'en-US': 'Root',
        },
        entryRef1: {
          'en-US': {
            sys: {
              type: 'Link',
              linkType: 'Entry',
              id: '3ADrOROW1jot5jExFOjt4i',
            },
          },
        },
        entryRef2: {
          'en-US': {
            sys: {
              type: 'Link',
              linkType: 'Entry',
              id: 'iFsN9FnCxUVNrXnUbGeJu',
            },
          },
        },
        assetRef: {
          'en-US': {
            sys: {
              type: 'Link',
              linkType: 'Asset',
              id: '1RuPXX12mNeIzKQIcuOWQW',
            },
          },
        },
        tags: {
          'en-US': ['Test 1', 'Test 2', 'Test 3', 'Test 4', 'Test 5'],
        },
      },
    },
  ],
  includes: {
    Entry: [
      {
        sys: {
          space: {
            sys: {
              type: 'Link',
              linkType: 'Space',
              id: 'uxn1u7m0txgd',
            },
          },
          id: '3ADrOROW1jot5jExFOjt4i',
          type: 'Entry',
          createdAt: '2020-02-04T15:20:18.181Z',
          updatedAt: '2020-02-04T15:20:18.181Z',
          environment: {
            sys: {
              id: 'master',
              type: 'Link',
              linkType: 'Environment',
            },
          },
          createdBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          updatedBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          publishedCounter: 0,
          version: 1,
          contentType: {
            sys: {
              type: 'Link',
              linkType: 'ContentType',
              id: 'user',
            },
          },
        },
        fields: {
          name: {
            de: 'Test (1)',
            'en-US': 'TEst3 (sched) (1)',
          },
        },
      },
      {
        sys: {
          space: {
            sys: {
              type: 'Link',
              linkType: 'Space',
              id: 'uxn1u7m0txgd',
            },
          },
          id: 'iFsN9FnCxUVNrXnUbGeJu',
          type: 'Entry',
          createdAt: '2019-12-17T10:57:56.591Z',
          updatedAt: '2020-03-03T15:01:58.131Z',
          environment: {
            sys: {
              id: 'master',
              type: 'Link',
              linkType: 'Environment',
            },
          },
          publishedVersion: 11,
          publishedAt: '2020-01-10T16:22:14.228Z',
          firstPublishedAt: '2020-01-10T16:22:14.228Z',
          createdBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          updatedBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          publishedCounter: 1,
          version: 14,
          publishedBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          contentType: {
            sys: {
              type: 'Link',
              linkType: 'ContentType',
              id: 'user',
            },
          },
        },
        fields: {
          name: {
            de: 'Test (0)',
            'en-US': 'TEst3 (0)',
          },
        },
      },
    ],
    Asset: [
      {
        sys: {
          space: {
            sys: {
              type: 'Link',
              linkType: 'Space',
              id: 'uxn1u7m0txgd',
            },
          },
          id: '1RuPXX12mNeIzKQIcuOWQW',
          type: 'Asset',
          createdAt: '2019-12-06T14:01:55.785Z',
          updatedAt: '2019-12-06T14:01:56.599Z',
          environment: {
            sys: {
              id: 'master',
              type: 'Link',
              linkType: 'Environment',
            },
          },
          createdBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          updatedBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '1ISXbiKugJkNkSrTE3jn25',
            },
          },
          publishedCounter: 0,
          version: 2,
        },
        fields: {
          title: {
            'en-US': 'Parrot',
          },
          file: {
            'en-US': {
              url:
                '//images.flinkly.com/uxn1u7m0txgd/1RuPXX12mNeIzKQIcuOWQW/0879b108af6582e87a24f6be7255a6ff/parrot.jpg',
              details: {
                size: 90059,
                image: {
                  width: 426,
                  height: 640,
                },
              },
              fileName: 'Parrot',
              contentType: 'image/jpeg',
            },
          },
        },
      },
    ],
  },
};

export const unresolvedReferences = {
  sys: {
    type: 'Array',
  },
  errors: [],
  items: [
    {
      sys: {
        space: {
          sys: {
            type: 'Link',
            linkType: 'Space',
            id: 'uxn1u7m0txgd',
          },
        },
        id: '4zaYBA8hYIxwRHsKfyJOVN',
        type: 'Entry',
        createdAt: '2019-12-16T12:22:36.218Z',
        updatedAt: '2020-03-04T16:36:17.263Z',
        environment: {
          sys: {
            id: 'master',
            type: 'Link',
            linkType: 'Environment',
          },
        },
        publishedVersion: 3,
        publishedAt: '2019-12-16T14:00:10.531Z',
        firstPublishedAt: '2019-12-16T14:00:10.531Z',
        createdBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        updatedBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        publishedCounter: 1,
        version: 26,
        publishedBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        contentType: {
          sys: {
            type: 'Link',
            linkType: 'ContentType',
            id: 'user',
          },
        },
      },
      fields: {
        name: {
          de: 'test',
          'en-US': 'Root',
        },
        entryRef1: {
          'en-US': {
            sys: {
              type: 'Link',
              linkType: 'Entry',
              id: '3ADrOROW1jot5jExFOjt4i',
            },
          },
        },
        entryRef2: {
          'en-US': {
            sys: {
              type: 'Link',
              linkType: 'Entry',
              id: 'iFsN9FnCxUVNrXnUbGeJu',
            },
          },
        },
        assetRef: {
          'en-US': {
            sys: {
              type: 'Link',
              linkType: 'Asset',
              id: '1RuPXX12mNeIzKQIcuOWQW',
            },
          },
        },
        tags: {
          'en-US': ['Test 1', 'Test 2', 'Test 3', 'Test 4', 'Test 5'],
        },
      },
    },
  ],
  includes: {
    Entry: [],
    Asset: [],
  },
};

export const noReferences = {
  sys: {
    type: 'Array',
  },
  errors: [],
  items: [
    {
      sys: {
        space: {
          sys: {
            type: 'Link',
            linkType: 'Space',
            id: 'uxn1u7m0txgd',
          },
        },
        id: '4zaYBA8hYIxwRHsKfyJOVN',
        type: 'Entry',
        createdAt: '2019-12-16T12:22:36.218Z',
        updatedAt: '2020-03-04T16:36:17.263Z',
        environment: {
          sys: {
            id: 'master',
            type: 'Link',
            linkType: 'Environment',
          },
        },
        publishedVersion: 3,
        publishedAt: '2019-12-16T14:00:10.531Z',
        firstPublishedAt: '2019-12-16T14:00:10.531Z',
        createdBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        updatedBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        publishedCounter: 1,
        version: 26,
        publishedBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '1ISXbiKugJkNkSrTE3jn25',
          },
        },
        contentType: {
          sys: {
            type: 'Link',
            linkType: 'ContentType',
            id: 'user',
          },
        },
      },
      fields: {
        name: {
          de: 'test',
          'en-US': 'Root',
        },
        tags: {
          'en-US': ['Test 1', 'Test 2', 'Test 3', 'Test 4', 'Test 5'],
        },
      },
    },
  ],
  includes: {
    Entry: [],
    Asset: [],
  },
};

export const simpleReferencesValidationErrorResponse = {
  sys: {
    type: 'ReleaseValidation',
    id: 'immediate',
  },
  errored: [
    {
      sys: {
        type: 'Link',
        linkType: 'Entry',
        id: '3ADrOROW1jot5jExFOjt4i',
      },
      error: {
        sys: {
          type: 'Error',
          id: 'InvalidEntry',
        },
        message: 'Validation error message',
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
    {
      sys: {
        type: 'Link',
        linkType: 'Asset',
        id: '1RuPXX12mNeIzKQIcuOWQW',
      },
      error: {
        sys: {
          type: 'Error',
          id: 'InvalidEntry',
        },
        message: 'Validation error message',
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

export const simpleReferencesValidationSuccessResponse = {
  sys: {
    type: 'ReleaseValidation',
    id: 'immediate',
  },
  errored: [],
};

export const entity = {
  sys: {
    space: {
      sys: {
        type: 'Link',
        linkType: 'Space',
        id: 'uxn1u7m0txgd',
      },
    },
    id: '4zaYBA8hYIxwRHsKfyJOVN',
    type: 'Entry',
    createdAt: '2019-12-16T12:22:36.218Z',
    updatedAt: '2020-03-04T16:36:17.263Z',
    environment: {
      sys: {
        id: 'master',
        type: 'Link',
        linkType: 'Environment',
      },
    },
    publishedVersion: 3,
    publishedAt: '2019-12-16T14:00:10.531Z',
    firstPublishedAt: '2019-12-16T14:00:10.531Z',
    createdBy: {
      sys: {
        type: 'Link',
        linkType: 'User',
        id: '1ISXbiKugJkNkSrTE3jn25',
      },
    },
    updatedBy: {
      sys: {
        type: 'Link',
        linkType: 'User',
        id: '1ISXbiKugJkNkSrTE3jn25',
      },
    },
    publishedCounter: 1,
    version: 26,
    publishedBy: {
      sys: {
        type: 'Link',
        linkType: 'User',
        id: '1ISXbiKugJkNkSrTE3jn25',
      },
    },
    contentType: {
      sys: {
        type: 'Link',
        linkType: 'ContentType',
        id: 'user',
      },
    },
  },
  fields: {
    name: {
      de: 'test',
      'en-US': 'Root',
    },
    entryRef1: {
      'en-US': {
        sys: {
          type: 'Link',
          linkType: 'Entry',
          id: '3ADrOROW1jot5jExFOjt4i',
        },
      },
    },
    entryRef2: {
      'en-US': {
        sys: {
          type: 'Link',
          linkType: 'Entry',
          id: 'iFsN9FnCxUVNrXnUbGeJu',
        },
      },
    },
    assetRef: {
      'en-US': {
        sys: {
          type: 'Link',
          linkType: 'Asset',
          id: '1RuPXX12mNeIzKQIcuOWQW',
        },
      },
    },
    tags: {
      'en-US': ['Test 1', 'Test 2', 'Test 3', 'Test 4', 'Test 5'],
    },
  },
};

export const simpleReferencesPublicationSuccessResponse = {
  sys: {
    id: 'immediate',
    type: 'Release',
  },
  entities: {
    action: 'publish',
    entities: [
      {
        sys: {
          id: 'EntryId_00',
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
  },
};

export const simpleReferencesPublicationInvalidErrorResponse = {
  sys: {
    type: 'ReleaseValidation',
    id: 'immediate',
  },
  details: {
    errors: [
      {
        sys: {
          type: 'Link',
          linkType: 'Entry',
          id: '3ADrOROW1jot5jExFOjt4i',
        },
        error: {
          sys: {
            type: 'Error',
            id: 'InvalidEntry',
          },
          message: 'Validation error message',
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
      {
        sys: {
          type: 'Link',
          linkType: 'Asset',
          id: '1RuPXX12mNeIzKQIcuOWQW',
        },
        error: {
          sys: {
            type: 'Error',
            id: 'InvalidEntry',
          },
          message: 'Validation error message',
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
  },
};
