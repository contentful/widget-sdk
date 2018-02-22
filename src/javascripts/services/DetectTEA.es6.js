/**
 * @module services/DetectTEA
 *
 * This module contains a function to detect whether a space we are in right now
 * is TEA or not. The problem is that space from a template has no additional
 * information which can help us distinguish between manually created space and TEA
 *
 * It detects based on content preview configurations. We simply check that at least
 * one configuration contains url `https://the-example-app-{...}.contentful.com`.
 * While it is not the most reliable check, it is good enough for us.
 *
 * You can read more about rationale in TP:
 * https://contentful.tpondemand.com/entity/27089-dev-detect-tea-to-render-different
 */

import contentPreview from 'contentPreview';
import {env} from 'Config';

// we separate only two environments in TEA, production and staging
const domain = env === 'production' ? 'contentful' : 'flinkly';

// for example, https://the-example-app-nodejs.contentful.com/courses/...
// http:// schema is supported as well.
// this should be good enough for us -- while people can actually set it up manually
// it is definitely an edge-case
const regex = new RegExp(`^https?:\\/\\/the-example-app.+?\\.${domain}\\.com`);

/**
 * This function returns a promise, whether we are in TEA space right now or not
 * You can call this function from different places, it will cache results for the space
 * @returns {Promise<boolean>} -- whether we are in TEA space right now or not
 */
export function detectTEA () {
  return new Promise(resolve => {
    contentPreview.getAll().then(contentPreviews => {
      // no previews at all
      if (!contentPreviews) {
        return resolve(false);
      }

      const ids = Object.keys(contentPreviews);

      // no previews at all again
      if (ids.length === 0) {
        return resolve(false);
      }

      // check that at least some configuration works
      const isTEA = ids.some(id => {
        const contentPreview = contentPreviews[id];

        return contentPreview.configurations.some(configuration => regex.test(configuration.url));
      });

      resolve(isTEA);
    }).catch(() => {
      resolve(false);
    });
  });
}
