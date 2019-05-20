import stream from 'getstream';

import createMicroBackendsClient from 'MicroBackendsClient.es6';
import * as logger from 'services/logger.es6';
import * as Telemetry from 'i13n/Telemetry.es6';
import { services } from 'Config.es6';

// same key as in microbackend
const FEED_NAME = 'entry_activity';
const API_KEY = services.getstream_io.api_key;
const APP_ID = services.getstream_io.app_id;

export const MAX_FEED_SIZE = 150;

export async function feed(feedId) {
  const mbClient = createMicroBackendsClient({ backendName: 'streamtoken' });
  const res = await mbClient.call('/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: feedId })
  });

  if (!res.ok) {
    throw new Error(`Could not get stream token for ${feedId}`);
  }

  const userToken = await res.text();
  const client = stream.connect(API_KEY, userToken, APP_ID);
  const feed = client.feed(FEED_NAME, feedId);

  return {
    get: options => feed.get(options),
    getAll,
    subscribe: cb => feed.subscribe(cb),
    addActivity: activity =>
      feed.addActivity(activity).catch(error => {
        logger.logError('Could not add feed activity', {
          feedId,
          activity,
          ...error
        });
      })
  };

  async function getAll() {
    const activities = [];
    let i = 0;
    let shouldFetchMore = true;

    while (shouldFetchMore) {
      try {
        const nextPage = await feed.get({ limit: 100, offset: 100 * i });

        if (!nextPage) {
          shouldFetchMore = false;
          break;
        }

        activities.push(...nextPage.results);
        i++;
        shouldFetchMore = nextPage.next.length > 0 && activities.length < MAX_FEED_SIZE;

        // We want to know how many feeds are larger than the max size
        // to be able to adjust this in the future.
        if (activities.length >= MAX_FEED_SIZE) {
          Telemetry.count('entry-activity-feed.exceeded-limit', {
            feedId,
            maxFeedSize: MAX_FEED_SIZE,
            page: i
          });
        }
      } catch (error) {
        logger.logError('Could not fetch feed', {
          feedId,
          page: i,
          ...error
        });
      }
    }

    return activities;
  }
}
