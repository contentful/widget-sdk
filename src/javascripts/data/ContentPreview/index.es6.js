import { env } from 'Config.es6';

/**
 * @description
 * Returns true if the space has atleast one content preview that uses a TEA
 * and has a published content type with the id `layoutHighlightedCourse`
 *
 * @param {object} contentPreviews
 * @param {array} publishedCTs
 *
 * @return {boolean}
 */
export function isExampleSpace(contentPreviews, publishedCTs) {
  return hasTEAContentPreviews(contentPreviews) && hasHighlightedCourseCT(publishedCTs);
}

/**
 * @description
 * Given content previews for a space, this function returns
 * true if the content previews are powered by the example app
 * suite.
 *
 * @param {object} contentPreviews
 *
 * @returns {boolean}
 */
export function hasTEAContentPreviews(contentPreviews) {
  // Since TEAs are hosted on different domains for prod and staging
  const domain = env === 'production' ? 'contentful' : 'flinkly';

  // For example, https://the-example-app-nodejs.contentful.com/courses/...
  // http:// schema is supported as well.
  const regex = new RegExp(`^https?:\\/\\/the-example-app.+?\\.${domain}\\.com`);

  // no previews at all
  if (!contentPreviews) {
    return false;
  }

  const ids = Object.keys(contentPreviews);

  // no previews at all again
  if (ids.length === 0) {
    return false;
  }

  // return true if atleast one content preview uses an app from the TEA suite
  return ids.some(id => {
    const contentPreview = contentPreviews[id];

    return contentPreview.configurations.some(configuration => regex.test(configuration.url));
  });
}

/**
 * @description
 * Given a list of published content types, return true if there is one
 * with the id `layoutHighlightedCourse`
 *
 * @param {Array[ContentType]} publishedCTs
 *
 * @return {boolean}
 */
export function hasHighlightedCourseCT(publishedCTs = []) {
  return publishedCTs.some(({ sys: { id } }) => id === 'layoutHighlightedCourse');
}
