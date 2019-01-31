import React, { Component } from 'react';
import { range } from 'lodash';

export default class NoFieldsAdvice extends Component {
  render() {
    return (
      <div style={{ position: 'relative', maxWidth: '50em' }}>
        <ul className="ct-fields--dummy">
          {range(1, 6).map(i => (
            <li className="ct-field" key={i}>
              <div className="ct-field__drag-handle" />
              <div className="ct-field__name">Field {i}</div>
            </li>
          ))}
        </ul>
        <div className="ct-no-fields-advice advice">
          <div className="advice__frame">
            <header>
              <h1 className="advice__title">It’s time to add some fields</h1>
              <div className="advice__sub-title">Click the blue button on the right</div>
            </header>
            <p className="advice__description">
              The field type defines what content can be stored.
              <br />
              For instance, a text field accepts titles and descriptions, and a media field is used
              for images and videos.
            </p>
          </div>
        </div>
      </div>
    );
  }
}
