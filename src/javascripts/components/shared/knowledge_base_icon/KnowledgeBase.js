import React from 'react';
import PropTypes from 'prop-types';
import { websiteUrl } from 'Config';

const items = {
  sales: 'contact/sales/',
  space: 'faq/terminology/#what-is-a-space',
  content_model: 'developers/docs/concepts/data-model/',
  content_type: 'faq/terminology/#what-is-a-content-type',
  space_creation: 'faq/terminology/#what-is-the-difference-between-a-content-type-and-a-space',
  hibernation: 'developers/docs/', // @todo needs proper article
  entry: 'developers/docs/concepts/data-model/',
  asset: 'developers/docs/concepts/data-model/',
  api_key: 'developers/docs/references/authentication/#the-delivery-api-and-preview-api',
  predefined_value: 'faq/basics/#how-can-i-use-predefined-values',
  locale: 'developers/docs/concepts/locales/',
  space_template: 'developers/docs/', // @todo needs proper article
  id_change: 'developers/docs/', // @todo needs proper article,
  roles: 'r/knowledgebase/roles-and-permissions/',
  field_lifecycle: 'faq/basics/#what-is-the-lifecycle-of-a-field',
  content_apis: 'developers/docs/concepts/apis/',
  delivery_api: 'developers/docs/references/content-delivery-api',
  management_api: 'developers/docs/references/content-management-api',
  cma_key: 'developers/docs/references/authentication/#the-management-api',
  content_preview: 'r/knowledgebase/setup-content-preview/',
  contentModellingBasics: 'r/knowledgebase/content-modelling-basics/',
  createOAuthApp: 'developers/docs/references/authentication/#creating-an-oauth-20-application',
  // TODO add it once it becomes available
  spaceEnvironments: 'developers/docs',
  spacesAndOrganizations: 'r/knowledgebase/spaces-and-organizations',
};

function getKnowledgeBaseUrl(name) {
  if (items[name]) {
    return websiteUrl(items[name]);
  }

  throw new Error('Incorrect Knowledge Base item "' + name + '".');
}

function KnowledgeBase({ target, text = '', inlineText, className = '', icon = true }) {
  const hasText = !text.length ? 'x--no-text' : '';
  const isInline = inlineText ? 'x--inline' : '';

  return (
    // eslint-disable-next-line rulesdir/restrict-non-f36-components
    <a
      data-test-id="knowledge-base-link"
      className={`knowledge-base-link ${hasText} ${isInline} ${className}`}
      href={getKnowledgeBaseUrl(target)}
      target="_blank"
      rel="noopener noreferrer">
      {text}
      {icon && <i className="fa fa-question-circle" data-test-id="icon" />}
    </a>
  );
}

KnowledgeBase.propTypes = {
  className: PropTypes.string,
  target: PropTypes.oneOf(Object.keys(items)).isRequired,
  text: PropTypes.string,
  inlineText: PropTypes.any,
  icon: PropTypes.bool,
};

export default KnowledgeBase;
