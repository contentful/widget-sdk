import { Matchers } from '@pact-foundation/pact-web';
import {
  defaultSpaceId,
  defaultEntryId,
  defaultUserId,
  defaultContentTypeId,
  defaultEnvironmentId,
} from '../../util/requests';

interface EntryProps {
  id: string;
  fields: object;
  publishedCounter: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface List<T> {
  sys: { type: 'Array' };
  total: number;
  skip: ReturnType<typeof Matchers.integer>;
  limit: ReturnType<typeof Matchers.integer>;
  items: T[];
}

interface MatchedLink<T extends string = string> {
  readonly sys: {
    type: 'Link';
    linkType: T;
    id: ReturnType<typeof Matchers.string>;
  };
}

interface PublishableEntityWithMatchers {
  sys: {
    id: ReturnType<typeof Matchers.string>;
    type: 'Entry';
    version: ReturnType<typeof Matchers.integer>;
    publishedCounter: ReturnType<typeof Matchers.integer>;
    createdAt: ReturnType<typeof Matchers.iso8601DateTimeWithMillis>;
    updatedAt: ReturnType<typeof Matchers.iso8601DateTimeWithMillis>;
    createdBy: MatchedLink<'User'>;
    contentType: MatchedLink<'ContentType'>;
    space: MatchedLink<'Space'>;
    environment: MatchedLink<'Environment'>;
    updatedBy: MatchedLink<'User'>;
  };
  fields: object;
}

const linkTo = <T extends string>(linkType: T, id: string): MatchedLink<T> => ({
  sys: {
    type: 'Link',
    linkType,
    id: Matchers.somethingLike(id),
  },
});

const entry = ({
  id,
  fields,
  publishedCounter,
  version,
  createdAt,
  updatedAt,
}: EntryProps): PublishableEntityWithMatchers => ({
  sys: {
    id: Matchers.somethingLike(id),
    version: Matchers.integer(version),
    publishedCounter: Matchers.integer(publishedCounter),
    type: 'Entry',
    space: linkTo('Space', defaultSpaceId),
    createdAt: Matchers.iso8601DateTimeWithMillis(createdAt),
    updatedAt: Matchers.iso8601DateTimeWithMillis(updatedAt),
    environment: linkTo('Environment', defaultEnvironmentId),
    createdBy: linkTo('User', defaultUserId),
    updatedBy: linkTo('User', defaultUserId),
    contentType: linkTo('ContentType', defaultContentTypeId),
  },
  fields,
});

export const severalEntriesResponse = (): List<PublishableEntityWithMatchers> => ({
  sys: {
    type: 'Array',
  },
  total: 3,
  skip: Matchers.integer(0),
  limit: Matchers.integer(40),
  items: [
    entry({
      id: defaultEntryId + '3',
      fields: {
        fieldID: { 'en-US': Matchers.somethingLike('three') },
      },
      publishedCounter: 0,
      version: 3,
      createdAt: '2019-05-07T11:38:57.320Z',
      updatedAt: '2019-05-07T11:39:00.262Z',
    }),
    entry({
      id: defaultEntryId + '2',
      fields: {
        fieldID: { 'en-US': Matchers.somethingLike('two') },
      },
      publishedCounter: 0,
      version: 3,
      createdAt: '2019-05-07T11:38:51.352Z',
      updatedAt: '2019-05-07T11:38:54.548Z',
    }),
    entry({
      id: defaultEntryId,
      fields: {
        fieldID: { 'en-US': Matchers.somethingLike('one') },
        arrayOfRefs: {
          'en-US': Matchers.eachLike(linkTo('Entry', defaultEntryId + '3'), { min: 1 }),
        },
      },
      publishedCounter: 0,
      version: 1,
      createdAt: '2019-05-07T11:38:44.841Z',
      updatedAt: '2019-05-07T11:38:48.879Z',
    }),
  ],
});
