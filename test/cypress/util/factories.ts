import { validTokenResponse } from '../interactions/token';
import { noEnforcementsResponse } from '../interactions/enforcements';
import { getAllPublicContentTypesInDefaultSpace } from '../interactions/content_types';
import { masterEnvironmentResponse } from '../interactions/environments';
import { defaultLocaleResponse } from '../interactions/locales';

type DefaultHandlers = {
  tokenResponse: Function;
  enforcementsResponse: Function;
  publicContentTypesResponse: Function;
  environmentResponse: Function;
  localeResponse: Function;
};

const defaultHandlers: DefaultHandlers = {
  tokenResponse: validTokenResponse,
  enforcementsResponse: noEnforcementsResponse,
  publicContentTypesResponse: getAllPublicContentTypesInDefaultSpace.willReturnNoContentTypes,
  environmentResponse: masterEnvironmentResponse,
  localeResponse: defaultLocaleResponse
};

export function defaultRequestsMock(customHandlers: Partial<DefaultHandlers> = {}) {
  /*
   * This function provides a minimum amount of deafult requests
   * that is enough to render almost every page in the app.
   * It can be used only if these requests are not the main aspect of the test.
   */
  const handlers = Object.assign({}, defaultHandlers, customHandlers);
  handlers.tokenResponse();
  handlers.enforcementsResponse();
  handlers.publicContentTypesResponse();
  handlers.environmentResponse();
  handlers.localeResponse();
}
