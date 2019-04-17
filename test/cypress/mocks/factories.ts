import { validTokenResponse } from './token';
import { noEnforcementsResponse } from './enforcements';
import { noPublicContentTypesResponse } from './content_types';
import { masterEnvironmentResponse } from './environments';
import { freePlanResponse } from './plans';
import { defaultLocaleResponse } from './locales';
import { productCatalogFeaturesResponse } from './product_catalog_features';
import { emptyUiConfigResponse, uiConfigMeResponse } from './ui_config';
import { noPreviewEnvironmentsResponse } from './preview_environments';

type DefaultHandlers = {
  tokenResponse: Function;
  enforcementsResponse: Function;
  publicContentTypesResponse: Function;
  environmentResponse: Function;
  planResponse: Function;
  localeResponse: Function;
  productCatalogFeaturesResponse: Function;
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
  productCatalogFeaturesResponse: productCatalogFeaturesResponse,
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
  handlers.productCatalogFeaturesResponse();
  handlers.uiConfigResponse();
  handlers.uiConfigMeResponse();
  handlers.previewEnvironmentsResponse();
}
