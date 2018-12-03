import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  SelectField,
  Option,
  TextField,
  TextLink
} from '@contentful/forma-36-react-components';

const PICK_OPTION_VALUE = '__pick__';
const MAX_CONFIGS = 3;

export default class NetlifyConfigEditor extends Component {
  static propTypes = {
    disabled: PropTypes.bool.isRequired,
    siteConfigs: PropTypes.array.isRequired,
    netlifySites: PropTypes.array.isRequired,
    onSiteConfigsChange: PropTypes.func.isRequired
  };

  onNetlifySiteChange = (configIndex, netlifySiteId) => {
    const { netlifySites, siteConfigs, onSiteConfigsChange } = this.props;
    const site = netlifySites.find(site => site.id === netlifySiteId) || {};

    const updated = siteConfigs.map((siteConfig, i) => {
      if (configIndex === i) {
        return {
          ...siteConfig,
          netlifySiteId: site.id,
          netlifySiteName: site.name,
          netlifySiteUrl: site.ssl_url || site.url
        };
      } else {
        return siteConfig;
      }
    });

    onSiteConfigsChange(updated);
  };

  onNameChange = (configIndex, name) => {
    const { siteConfigs, onSiteConfigsChange } = this.props;
    const updated = siteConfigs.map((siteConfig, i) => {
      return configIndex === i ? { ...siteConfig, name } : siteConfig;
    });
    onSiteConfigsChange(updated);
  };

  onAdd = () => {
    const { siteConfigs, onSiteConfigsChange } = this.props;
    const updated = siteConfigs.concat([{}]);
    onSiteConfigsChange(updated);
  };

  onRemove = configIndex => {
    const { siteConfigs, onSiteConfigsChange } = this.props;
    const updated = siteConfigs.filter((_, i) => i !== configIndex);
    onSiteConfigsChange(updated);
  };

  render() {
    const { disabled, siteConfigs, netlifySites } = this.props;

    return (
      <React.Fragment>
        {siteConfigs.map((siteConfig, configIndex) => {
          const selectId = `site-select-${configIndex}`;
          const inputId = `site-input-${configIndex}`;
          return (
            <div key={configIndex} className="netlify-app__site-config-row">
              <SelectField
                extraClassNames="netlify-app__site-config-item"
                id={selectId}
                name={selectId}
                labelText="Netlify site:"
                selectProps={{ isDisabled: disabled, width: 'medium' }}
                value={siteConfig.netlifySiteId || PICK_OPTION_VALUE}
                onChange={e => this.onNetlifySiteChange(configIndex, e.target.value)}>
                <Option value={PICK_OPTION_VALUE}>Pick site</Option>
                {netlifySites.map(netlifySite => {
                  return (
                    <Option key={netlifySite.id} value={netlifySite.id}>
                      {netlifySite.name}
                    </Option>
                  );
                })}
              </SelectField>
              <TextField
                extraClassNames="netlify-app__site-config-item"
                id={inputId}
                name={inputId}
                labelText="Display name:"
                textInputProps={{ disabled, width: 'medium', maxLength: 50 }}
                value={siteConfig.name || ''}
                onChange={e => this.onNameChange(configIndex, e.target.value)}
              />
              <TextLink
                extraClassNames="netlify-app__site-config-remove"
                disabled={disabled}
                onClick={() => this.onRemove(configIndex)}>
                Remove
              </TextLink>
            </div>
          );
        })}
        <Button
          disabled={disabled || siteConfigs.length >= MAX_CONFIGS}
          buttonType="muted"
          onClick={this.onAdd}>
          Add another site (max {MAX_CONFIGS})
        </Button>
      </React.Fragment>
    );
  }
}
