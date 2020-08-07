/* eslint-disable rulesdir/restrict-non-f36-components */

import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useDebounce } from 'use-debounce';
import * as LazyLoader from 'utils/LazyLoader';
import { maybeSanitizeUrl } from 'utils/StringUtils';

function PreviewRenderer(props) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      const loader = window.embedly('card', ref.current);
      if (loader && loader.on) {
        loader.on('card.rendered', () => {
          props.onLoad();
        });
      }
    }
  }, [props]);

  return (
    <div>
      <a
        ref={ref}
        href={props.url}
        target="_blank"
        rel="noopener noreferrer"
        data-card-controls={0}
        data-card-chrome={0}
        data-card-align="left"></a>
    </div>
  );
}

PreviewRenderer.propTypes = {
  url: PropTypes.string.isRequired,
  onLoad: PropTypes.func.isRequired,
};

export default function EmbedlyPreview(props) {
  const [isReady, setIsReady] = useState(false);

  const [url] = useDebounce(props.previewUrl, props.delay);

  useEffect(() => {
    LazyLoader.get('embedly').then(() => {
      setIsReady(true);
    });
  }, []);

  if (!isReady) {
    return null;
  }
  const safeUrl = maybeSanitizeUrl(url);
  if (!safeUrl) {
    return null;
  }

  return <PreviewRenderer key={safeUrl} url={safeUrl} onLoad={props.onLoad}></PreviewRenderer>;
}

EmbedlyPreview.propTypes = {
  previewUrl: PropTypes.string,
  onLoad: PropTypes.func,
  delay: PropTypes.number,
};
EmbedlyPreview.defaultProps = {
  delay: 500,
  onLoad: () => {},
};
