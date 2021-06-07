import React from 'react';
import { websiteUrl } from 'Config';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';
import { IconButton, TextLink } from '@contentful/forma-36-react-components';

const items = {
  sales: 'contact/sales/',
  space: 'faq/terminology/#what-is-a-space',
  content_model: 'developers/docs/concepts/data-model/',
  content_type: 'faq/terminology/#what-is-a-content-type',
  space_creation: 'faq/terminology/#what-is-the-difference-between-a-content-type-and-a-space',
  hibernation: 'developers/docs/', // @todo needs proper article
  entry: 'help/content-tab/',
  asset: 'help/media-tab/',
  api_key: 'developers/docs/references/authentication/#the-delivery-and-preview-api',
  predefined_value: 'faq/basics/#how-can-i-use-predefined-values',
  locale: 'developers/docs/concepts/locales/',
  space_template: 'developers/docs/', // @todo needs proper article
  id_change: 'developers/docs/', // @todo needs proper article,
  roles: 'developers/docs/concepts/roles-permissions/',
  field_lifecycle: 'faq/basics/#what-is-the-lifecycle-of-a-field',
  content_apis: 'developers/docs/concepts/apis/',
  delivery_api: 'developers/docs/references/content-delivery-api/',
  management_api: 'developers/docs/references/content-management-api/',
  cma_key: 'developers/docs/references/authentication/#the-management-api/',
  content_preview: 'help/setup-content-preview/',
  contentModellingBasics: 'help/content-modelling-basics/',
  createOAuthApp: 'developers/docs/references/authentication/#creating-an-oauth-20-application',
  // TODO add it once it becomes available
  spaceEnvironments: 'developers/docs/',
  spacesAndOrganizations: 'help/spaces-and-organizations/',
};

function getKnowledgeBaseUrl(name) {
  const withInAppHelpUtmParams = buildUrlWithUtmParams({
    source: 'webapp',
    medium: `knowledge-base-${name}`,
    campaign: 'in-app-help',
  });

  if (items[name]) {
    return withInAppHelpUtmParams(websiteUrl(items[name]));
  }

  throw new Error('Incorrect Knowledge Base item "' + name + '".');
}

export enum KnowledgeBaseItems {
  sales = 'sales',
  space = 'space',
  content_model = 'content_model',
  content_type = 'content_type',
  space_creation = 'space_creation',
  hibernation = 'hibernation',
  entry = 'entry',
  asset = 'asset',
  api_key = 'api_key',
  predefined_value = 'predefined_value',
  locale = 'locale',
  space_template = 'space_template',
  id_change = 'id_change',
  roles = 'roles',
  field_lifecycle = 'field_lifecycle',
  content_apis = 'content_apis',
  delivery_api = 'delivery_api',
  management_api = 'management_api',
  cma_key = 'cma_key',
  content_preview = 'content_preview',
  content_modelling_basics = 'contentModellingBasics',
  createOAuthApp = 'createOAuthApp',
  spaceEnvironments = 'spaceEnvironments',
  spacesAndOrganizations = 'spacesAndOrganizations',
}

interface KnowledgeBaseProps {
  target: KnowledgeBaseItems;
  text?: string;
  className?: string;
  asIcon?: boolean;
}

const KnowledgeBase = ({ target, text = '', className = '', asIcon }: KnowledgeBaseProps) => {
  return asIcon ? (
    <IconButton
      iconProps={{
        icon: 'HelpCircle',
        size: 'tiny',
      }}
      buttonType="muted"
      data-test-id="knowledge-base-icon"
      href={getKnowledgeBaseUrl(target)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    />
  ) : (
    <TextLink
      data-test-id="knowledge-base-link"
      className={className}
      href={getKnowledgeBaseUrl(target)}
      target="_blank"
      rel="noopener noreferrer">
      {text}
    </TextLink>
  );
};

export default KnowledgeBase;
