import {once} from 'lodash';
import marked from 'libs/marked';
import {newClient as createCfClient} from 'contentfulClient';
import * as Config from 'Config';

/**
 * @ngdoc service
 * @name app/api/KeyEditor/BoilerplateCode
 * @description
 * This module exports a function to fetch data for boilerplate
 * projects from a contentful space.
 *
 * In the development environment we use the preview API. Otherwise the
 * delivery API.
 */


// Setup client to contentful space that provides the boilerplate data.
const usePreview = Config.env === 'development';
const boilerplateSpaceId = '2m3cigbhrkff';
const previewToken = 'f16c6afc8c29c70747010419ac7c67aca8554353b781127964a4da0d3d561bac';
const deliveryToken = '0823649eecd58e485f33874956959610ae30e53f1d8c9567e225a4a094644f4b';

const boilerplateSpace = createCfClient({
  space: boilerplateSpaceId,
  accessToken: usePreview ? previewToken : deliveryToken,
  host: `${usePreview ? 'preview' : 'cdn'}.contentful.com`
});


/**
 * @ngdoc service
 * @name app/api/KeyEditor/BoilerplateCode#get
 * @description
 * Fetches a list of boilerplate projects.
 *
 * Returns an array of items of the following shape
 * ~~~
 * {
 *   id: string,
 *   name: string,
 *   sourceUrl: string,
 *   repoUrl: string,
 *   instructions: string,
 * }
 * ~~~
 *
 * The data is fetched only once. Subsequent calls to `get()` return
 * the previously fetched data.
 */
export const get = once(fetch);

function fetch () {
  return boilerplateSpace.entries({
    content_type: 'boilerplate',
    order: 'fields.order'
  })
  .then((items) => items.map(makeBoilerplateData));
}


/**
 * @ngdoc service
 * @name app/api/KeyEditor/BoilerplateCode#renderInstructions
 * @description
 * Given a boilerplate entry and API parameters this function produces
 * an HTML string that shows the instructions.
 *
 * In particular it replaces the space ID and token variables and
 * renders the markdown.
 *
 * @param boilerplate
 * @param {string} spaceId
 * @param {string?} cdaToken
 * @returns {string}
 */
export function renderInstructions (boilerplate, spaceId, cdaToken) {
  const instructions =
    boilerplate.instructions
    .replace(/{{SPACE_ID}}/g, spaceId)
    .replace(/{{CDA_TOKEN}}/g, cdaToken || '{{CDA_TOKEN}}');
  return marked(instructions);
}

function makeBoilerplateData (entry) {
  return {
    id: entry.sys.id,
    name: entry.fields.name,
    sourceUrl: entry.fields.sourceUrl,
    repoUrl: entry.fields.repoUrl,
    instructions: entry.fields.instructions,
    platform: entry.fields.platformId
  };
}
