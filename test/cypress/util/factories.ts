import { validTokenResponse } from '../interactions/token';
import { noEnforcementsResponse } from '../interactions/enforcements';
import { noPublicContentTypesResponse } from '../interactions/content_types';
import { masterEnvironmentResponse } from '../interactions/environments';
import { freePlanResponse } from '../interactions/plans';
import { defaultLocaleResponse } from '../interactions/locales';
import { orgProductCatalogFeaturesResponse } from '../interactions/product_catalog_features';
import { emptyUiConfigResponse, uiConfigMeResponse } from '../interactions/ui_config';
import { noPreviewEnvironmentsResponse } from '../interactions/preview_environments';

type DefaultHandlers = {
  tokenResponse: Function;
  enforcementsResponse: Function;
  publicContentTypesResponse: Function;
  environmentResponse: Function;
  planResponse: Function;
  localeResponse: Function;
  orgProductCatalogFeaturesResponse: Function;
  uiConfigResponse: Function;
  uiConfigMeResponse: Function;
  previewEnvironmentsResponse: Function;
};

const defaultHandlers: DefaultHandlers = {
  tokenResponse: validTokenResponse,
  enforcementsResponse: noEnforcementsResponse,
  publicContentTypesResponse: noPublicContentTypesResponse,
  environmentResponse: masterEnvironmentResponse,
  planResponse: freePlanResponse,
  localeResponse: defaultLocaleResponse,
  orgProductCatalogFeaturesResponse: orgProductCatalogFeaturesResponse,
  uiConfigResponse: emptyUiConfigResponse,
  uiConfigMeResponse: uiConfigMeResponse,
  previewEnvironmentsResponse: noPreviewEnvironmentsResponse
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
  handlers.planResponse();
  handlers.localeResponse();
  handlers.orgProductCatalogFeaturesResponse();
  handlers.uiConfigResponse();
  handlers.uiConfigMeResponse();
  handlers.previewEnvironmentsResponse();
}
