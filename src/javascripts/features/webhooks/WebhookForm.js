import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { getModule } from 'core/NgRegistry';

import FormSection from 'components/forms/FormSection';
import { WebhookSegmentation } from './WebhookSegmentation';
import { transformTopicsToMap, transformMapToTopics } from './WebhookSegmentationState';
import { WebhookHeaders } from './WebhookHeaders';
import { WebhookBasicAuth } from './WebhookBasicAuth';
import { WebhookBodyTransformation } from './WebhookBodyTransformation';
import { Paragraph } from '@contentful/forma-36-react-components';
import { WebhookFilters } from './WebhookFilters';
import { transformFiltersToList, transformListToFilters } from './WebhookFiltersState';
import { WILDCARD } from './WebhookSegmentationState';
import { WebhookOtherEventsSection } from './WebhookOtherEventsSection';

const METHODS = ['POST', 'GET', 'PUT', 'PATCH', 'DELETE'];

const FORM_URLENCODED_CONTENT_TYPE = 'application/x-www-form-urlencoded';
const CONTENT_TYPES = [
  'application/vnd.contentful.management.v1+json',
  'application/vnd.contentful.management.v1+json; charset=utf-8',
  'application/json',
  'application/json; charset=utf-8',
  FORM_URLENCODED_CONTENT_TYPE,
  `${FORM_URLENCODED_CONTENT_TYPE}; charset=utf-8`,
];

export class WebhookForm extends React.Component {
  static propTypes = {
    webhook: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
  };

  hasEnvironmentAliases() {
    return getModule('spaceContext').hasOptedIntoAliases();
  }

  updatedTransformation(change) {
    const { transformation } = this.props.webhook;
    const cur = transformation || {};
    return { transformation: { ...cur, ...change } };
  }

  render() {
    const { webhook } = this.props;
    const contentType = get(webhook, ['transformation', 'contentType'], CONTENT_TYPES[0]);
    const includeContentLength = get(webhook, ['transformation', 'includeContentLength'], false);
    const values = transformTopicsToMap(webhook.topics);
    const isWildcarded = values === WILDCARD;

    return (
      <div className="webhook-editor__settings f36-padding-top--s">
        <FormSection title="Details">
          <div className="cfnext-form__field">
            <label htmlFor="webhook-name">
              Name <span>(required)</span>
            </label>
            <input
              type="text"
              className="cfnext-form__input"
              id="webhook-name"
              value={webhook.name || ''}
              onChange={(e) => this.props.onChange({ name: e.target.value })}
            />
          </div>
          <div className="cfnext-form__field">
            <label htmlFor="webhook-url">
              URL <span>(required)</span>
            </label>
            <div className="webhook-editor__settings-row">
              <select
                data-test-id="webhook-method-select"
                className="cfnext-select-box"
                id="webhook-method"
                value={get(webhook, ['transformation', 'method'], METHODS[0])}
                onChange={(e) =>
                  this.props.onChange(this.updatedTransformation({ method: e.target.value }))
                }>
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                type="text"
                className="cfnext-form__input"
                id="webhook-url"
                value={webhook.url || ''}
                onChange={(e) => this.props.onChange({ url: e.target.value })}
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Triggers" collapsible={true}>
          <WebhookSegmentation
            webhook={webhook}
            values={values}
            onChange={(map) => this.props.onChange({ topics: transformMapToTopics(map) })}
          />
          <WebhookFilters
            filters={transformFiltersToList(webhook.filters)}
            onChange={(list) => this.props.onChange({ filters: transformListToFilters(list) })}
          />
          {this.hasEnvironmentAliases() && !isWildcarded && (
            <WebhookOtherEventsSection
              values={values}
              onChange={(map) => this.props.onChange({ topics: transformMapToTopics(map) })}
            />
          )}
        </FormSection>

        <FormSection title="Headers" collapsible={true}>
          <WebhookHeaders
            headers={webhook.headers}
            onChange={(headers) => this.props.onChange({ headers })}
          />
          <WebhookBasicAuth
            httpBasicUsername={webhook.httpBasicUsername}
            onChange={(credentials) => this.props.onChange(credentials)}
          />
          <div className="cfnext-form__field">
            <label htmlFor="webhook-content-type">Content type</label>
            <select
              data-test-id="content-type-select"
              className="cfnext-select-box"
              id="webhook-content-type"
              value={contentType}
              onChange={(e) =>
                this.props.onChange(this.updatedTransformation({ contentType: e.target.value }))
              }>
              {CONTENT_TYPES.map((ct) => (
                <option key={ct} value={ct}>
                  {ct}
                </option>
              ))}
            </select>
            <Paragraph className="entity-editor__field-hint">
              Select one of allowed MIME types to be used as the value of the{' '}
              <code>Content-Type</code> header. Any custom <code>Content-Type</code> header will be
              ignored.
            </Paragraph>
            {contentType.startsWith(FORM_URLENCODED_CONTENT_TYPE) && (
              <Paragraph className="entity-editor__field-hint">
                For your current selection JSON payload will be automatically converted to URL
                encoded form data.
              </Paragraph>
            )}
          </div>
          <div className="cfnext-form__field">
            <label htmlFor="webhook-content-length">Content length</label>
            <label htmlFor="webhook-content-length">
              <input
                id="webhook-content-length"
                type="checkbox"
                checked={includeContentLength}
                onChange={(e) =>
                  this.props.onChange(
                    this.updatedTransformation({ includeContentLength: e.target.checked })
                  )
                }
              />{' '}
              Automatically compute the value of the <code>Content-Length</code> header
            </label>
            <Paragraph className="entity-editor__field-hint">
              If this option is selected, the byte size of the final request body will be computed
              and used as the value of the <code>Content-Length</code> header.
            </Paragraph>
          </div>
        </FormSection>

        <FormSection title="Payload" collapsible={true}>
          <WebhookBodyTransformation
            body={get(webhook, ['transformation', 'body'])}
            onChange={(body) => this.props.onChange(this.updatedTransformation({ body }))}
          />
        </FormSection>
      </div>
    );
  }
}
