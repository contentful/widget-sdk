import { Matchers } from '@pact-foundation/pact-web';
import {
  defaultSpaceId,
  defaultEntryId,
  defaultUserId,
  defaultContentTypeId,
  defaultEnvironmentId,
} from '../../util/requests';

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
    version: number;
    publishedCounter: number;
    createdAt: ReturnType<typeof Matchers.iso8601DateTimeWithMillis>;
    updatedAt: ReturnType<typeof Matchers.iso8601DateTimeWithMillis>;
    createdBy: MatchedLink<'User'>;
    contentType: MatchedLink<'ContentType'>;
    space: MatchedLink<'Space'>;
    environment: MatchedLink<'Environment'>;
    updatedBy: MatchedLink<'User'>;
  };
  fields: {};
}

// TODO make common function for this
const linkTo = <T extends string>(linkType: T, id: string): MatchedLink<T> => ({
  sys: {
    type: 'Link',
    linkType,
    id: Matchers.somethingLike(id),
  },
});

export const newEntryResponse = (): PublishableEntityWithMatchers => ({
  sys: {
    id: Matchers.somethingLike(defaultEntryId),
    version: 1,
    publishedCounter: 0,
    type: 'Entry',
    space: linkTo('Space', defaultSpaceId),
    createdAt: Matchers.iso8601DateTimeWithMillis(),
    updatedAt: Matchers.iso8601DateTimeWithMillis(),
    environment: linkTo('Environment', defaultEnvironmentId),
    createdBy: linkTo('User', defaultUserId),
    updatedBy: linkTo('User', defaultUserId),
    contentType: linkTo('ContentType', defaultContentTypeId),
  },
  fields: {},
});
