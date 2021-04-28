import { salesUrl } from 'Config';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';

const urlWithUtm = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'in-app-banner',
  campaign: 'cta-enterprise-banner',
  content: 'contact-us',
});

export const CONTACT_SALES_URL_WITH_IN_APP_BANNER_UTM = urlWithUtm(salesUrl);
