import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';

import FormSection from 'components/forms/FormSection.es6';
import WebhookSegmentation from './WebhookSegmentation.es6';
import { transformTopicsToMap, transformMapToTopics } from './WebhookSegmentationState.es6';
import WebhookFilters from './WebhookFilters.es6';
import { transformFiltersToList, transformListToFilters } from './WebhookFiltersState.es6';
import WebhookHeaders from './WebhookHeaders.es6';
import WebhookBasicAuth from './WebhookBasicAuth.es6';
import WebhookBodyTransformation from './WebhookBodyTransformation.es6';

const METHODS = ['POST', 'GET', 'PUT', 'PATCH', 'DELETE'];

const FORM_URLENCODED_CONTENT_TYPE = 'application/x-www-form-urlencoded';
const CONTENT_TYPES = [
  'application/vnd.contentful.management.v1+json',
  'application/vnd.contentful.management.v1+json; charset=utf-8',
  'application/json',
  'application/json; charset=utf-8',
  FORM_URLENCODED_CONTENT_TYPE,
  `${FORM_URLENCODED_CONTENT_TYPE}; charset=utf-8`
];

export default class WebhookForm extends React.Component {
  static propTypes = {
    webhook: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
  };

  updatedTransformation(change) {
    const { transformation } = this.props.webhook;
    const cur = transformation || {};
    return { transformation: { ...cur, ...change } };
  }

  render() {
    const { webhook } = this.props;
    const contentType = get(webhook, ['transformation', 'contentType'], CONTENT_TYPES[0]);
    const includeContentLength = get(webhook, ['transformation', 'includeContentLength'], false);

    return (
      <div className="webhook-editor__settings">
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
              onChange={e => this.props.onChange({ name: e.target.value })}
            />
          </div>
          <div className="cfnext-form__field">
            <label htmlFor="webhook-url">
              URL <span>(required)</span>
            </label>
            <div className="webhook-editor__settings-row">
              <select
                className="cfnext-select-box"
                id="webhook-method"
                value={get(webhook, ['transformation', 'method'], METHODS[0])}
                onChange={e =>
                  this.props.onChange(this.updatedTransformation({ method: e.target.value }))
                }>
                {METHODS.map(m => (
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
                onChange={e => this.props.onChange({ url: e.target.value })}
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Triggers" collapsible={true}>
          <WebhookSegmentation
            values={transformTopicsToMap(webhook.topics)}
            onChange={map => this.props.onChange({ topics: transformMapToTopics(map) })}
          />
          <WebhookFilters
            filters={transformFiltersToList(webhook.filters)}
            onChange={list => this.props.onChange({ filters: transformListToFilters(list) })}
          />
        </FormSection>

        <FormSection title="Headers" collapsible={true}>
          <WebhookHeaders
            headers={webhook.headers}
            onChange={headers => this.props.onChange({ headers })}
          />
          <WebhookBasicAuth
            httpBasicUsername={webhook.httpBasicUsername}
            onChange={credentials => this.props.onChange(credentials)}
          />
          <div className="cfnext-form__field">
            <label htmlFor="webhook-content-type">Content type</label>
            <select
              className="cfnext-select-box"
              id="webhook-content-type"
              value={contentType}
              onChange={e =>
                this.props.onChange(this.updatedTransformation({ contentType: e.target.value }))
              }>
              {CONTENT_TYPES.map(ct => (
                <option key={ct} value={ct}>
                  {ct}
                </option>
              ))}
            </select>
            <p className="entity-editor__field-hint">
              Select one of allowed MIME types to be used as the value of the{' '}
              <code>Content-Type</code> header. Any custom <code>Content-Type</code> header will be
              ignored.
            </p>
            {contentType.startsWith(FORM_URLENCODED_CONTENT_TYPE) && (
              <p className="entity-editor__field-hint">
                For your current selection JSON payload will be automatically converted to URL
                encoded form data.
              </p>
            )}
          </div>
          <div className="cfnext-form__field">
            <label htmlFor="webhook-content-length">Content length</label>
            <label htmlFor="webhook-content-length">
              <input
                id="webhook-content-length"
                type="checkbox"
                checked={includeContentLength}
                onChange={e =>
                  this.props.onChange(
                    this.updatedTransformation({ includeContentLength: e.target.checked })
                  )
                }
              />{' '}
              Automatically compute the value of the <code>Content-Length</code> header
            </label>
            <p className="entity-editor__field-hint">
              If this option is selected, the byte size of the final request body will be computed
              and used as the value of the <code>Content-Length</code> header.
            </p>
          </div>
        </FormSection>

        <FormSection title="Payload" collapsible={true}>
          <WebhookBodyTransformation
            body={get(webhook, ['transformation', 'body'])}
            onChange={body => this.props.onChange(this.updatedTransformation({ body }))}
          />
        </FormSection>
      </div>
    );
  }
}
