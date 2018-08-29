import React from 'react';
import PropTypes from 'prop-types';
import { find } from 'lodash';
import { byName as Colors } from 'Styles/Colors';
import marked from 'marked';

export default class Boilerplate extends React.Component {
  static propTypes = {
    boilerplates: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string })).isRequired,
    spaceId: PropTypes.string.isRequired,
    deliveryToken: PropTypes.string.isRequired,
    track: PropTypes.shape({
      select: PropTypes.func,
      download: PropTypes.func
    }).isRequired
  };

  state = { selectedId: this.props.boilerplates[0].id };

  render() {
    const { boilerplates, spaceId, deliveryToken, track } = this.props;
    const selected = find(boilerplates, { id: this.state.selectedId });
    return (
      <div
        data-test-id="apiKey.boilerplate"
        style={{
          color: Colors.textMid,
          backgroundColor: Colors.iceMid,
          border: `1px solid ${Colors.iceDark}`,
          padding: '0.75em 2em',
          marginBottom: '4em'
        }}>
        <h4 className="h-reset">Getting started</h4>
        <p>Prototype faster with boilerplate code as a base.</p>
        <label style={{ display: 'block', marginBottom: '0.375em' }}>Select your language</label>
        <select
          className="cfnext-select-box"
          style={{ display: 'block', width: '100%' }}
          value={selected.id}
          onChange={e => {
            const id = e.target.value;
            const next = find(boilerplates, { id });
            if (next) {
              track.select(next.platform);
            }
            this.setState({ selectedId: id });
          }}>
          {boilerplates.map(bp => (
            <option key={bp.id} value={bp.id}>
              {bp.name}
            </option>
          ))}
        </select>
        <a
          className="btn-action x--block"
          style={{ margin: '0.75em 0' }}
          href={selected.sourceUrl(spaceId, deliveryToken)}
          onClick={() => track.download(selected.platform)}>
          Download boilerplate .zip
        </a>
        <h4 className="h-reset" style={{ marginTop: '1.5em' }}>
          Run locally
        </h4>
        <div
          className="api-key-boilerplate-instructions"
          style={{ overflowWrap: 'break-word' }}
          dangerouslySetInnerHTML={{ __html: marked(selected.instructions) }}
        />
      </div>
    );
  }
}
