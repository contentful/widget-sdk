import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Select, Option, TextInput } from '@contentful/forma-36-react-components';

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
        return { ...siteConfig, netlifySiteId: site.id, netlifySiteName: site.name };
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
          return (
            <div key={configIndex} style={{ marginBottom: '20px' }}>
              <Select
                isDisabled={disabled}
                width="medium"
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
              </Select>
              <TextInput
                disabled={disabled}
                width="medium"
                value={siteConfig.name || ''}
                maxLength={50}
                onChange={e => this.onNameChange(configIndex, e.target.value)}
              />
              <Button
                disabled={disabled}
                buttonType="muted"
                onClick={() => this.onRemove(configIndex)}>
                Remove
              </Button>
            </div>
          );
        })}
        <Button disabled={disabled || siteConfigs.length >= MAX_CONFIGS} onClick={this.onAdd}>
          Add site (max {MAX_CONFIGS})
        </Button>
        <pre>{JSON.stringify(this.props.siteConfigs, null, 2)}</pre>
      </React.Fragment>
    );
  }
}
