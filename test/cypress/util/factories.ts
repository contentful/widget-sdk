import { getTokenForUser } from '../interactions/token';
import { getAllEnforcementsForDefaultSpace } from '../interactions/enforcements';
import { getAllPublicContentTypesInDefaultSpace } from '../interactions/content_types';
import { queryFirst101EnvironmentsInDefaultSpace } from '../interactions/environments';
import { queryFirst100LocalesOfDefaultSpace } from '../interactions/locales';

type DefaultHandlers = {
  tokenResponse: Function;
  enforcementsResponse: Function;
  publicContentTypesResponse: Function;
  environmentResponse: Function;
  localeResponse: Function;
};

const defaultHandlers: DefaultHandlers = {
  tokenResponse: getTokenForUser.willReturnAValidToken,
  enforcementsResponse: getAllEnforcementsForDefaultSpace.willReturnNone,
  publicContentTypesResponse: getAllPublicContentTypesInDefaultSpace.willReturnNone,
  environmentResponse: queryFirst101EnvironmentsInDefaultSpace.willFindOne,
  localeResponse: queryFirst100LocalesOfDefaultSpace.willFindOne
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
