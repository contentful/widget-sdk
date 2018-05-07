import React from 'react';
import PropTypes from 'prop-types';
import parseGithubUrl from 'parse-github-url';
import {byName as Colors} from 'Styles/Colors';

import {fetchExtension} from './GitHubFetcher';

const SAMPLES = [
  {
    name: 'Vanilla UI Extension template',
    description: 'Starter UI Extension. Allows modification of a textual value.',
    url: 'https://github.com/contentful/extensions/blob/master/samples/template-vanilla/extension.json'
  },
  {
    name: 'External API Dropdown',
    description: 'Populate a dropdown using data fetched from an external service.',
    url: 'https://github.com/contentful/extensions/blob/master/samples/external-api/extension.json'
  },
  {
    name: 'Diff',
    description: 'Allows diffing draft and published values of a field.',
    url: 'https://github.com/contentful/extensions/blob/master/samples/diff/extension.json'
  },
  {
    name: 'Alloy Editor',
    description: 'Enables WYSIWYG editing using an open-source Alloy Editor library.',
    url: 'https://github.com/contentful/extensions/blob/master/samples/alloy-editor/extension.json'
  },
  {
    name: 'Optimizely Audiences',
    description: 'Tag structured content in Contentful with audience IDs loaded from a project in Optimizely.',
    url: 'https://github.com/contentful/extensions/blob/master/samples/optimizely-audiences/extension.json'
  }
];

const SamplePicker = ({confirm, cancel}) => {
  return <div className="modal-dialog">
    <header className="modal-dialog__header">
      <h1>Install a sample</h1>
      <button className="modal-dialog__close" onClick={cancel} />
    </header>
    <div className="modal-dialog__content">
      <p className="modal-dialog__richtext">
        You can install one of our predefined sample UI Extensions.
      </p>
      <div style={{
        border: `1px solid ${Colors.iceDark}`,
        borderWidth: '1px 0',
        backgroundColor: Colors.elementLightest,
        width: '600px',
        maxHeight: '450px',
        overflow: 'auto'
      }}>
        {SAMPLES.map(sample => {
          return <div key={sample.url} style={{
            color: Colors.textDark,
            padding: '10px 20px',
            border: `1px solid ${Colors.iceDark}`,
            borderTopWidth: '0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h3>{sample.name}</h3>
              <p>{sample.description}</p>
            </div>
            <button
              className="btn-action"
              style={{marginLeft: '40px'}}
              onClick={() => fetchExtension(parseGithubUrl(sample.url)).then(confirm)}
            >
              Install
            </button>
          </div>;
        })}
      </div>
    </div>
    <div className="modal-dialog__controls">
      <button className="btn-secondary-action" onClick={cancel}>Close</button>
    </div>
  </div>;
};

SamplePicker.propTypes = {
  confirm: PropTypes.func.isRequired,
  cancel: PropTypes.func.isRequired
};

export default SamplePicker;
