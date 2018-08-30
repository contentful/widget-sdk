import React from 'react';
import PropTypes from 'prop-types';

// TODO: move to the widgetAPI
import { isValidImage, getExternalImageUrl } from 'ui/cf/thumbnailHelpers.es6';

const dimensions = { w: 70, h: 70 };

export default class Thumbnail extends React.Component {
  static propTypes = {
    entryThumbnail: PropTypes.shape({
      url: PropTypes.string,
      contentType: PropTypes.string
    })
  };

  static defaultProps = {
    entryThumbnail: undefined
  };

  render() {
    const { entryThumbnail } = this.props;
    const valid = entryThumbnail && isValidImage(entryThumbnail.contentType);
    if (!valid) {
      return null;
    }
    const imgUrl = getExternalImageUrl(entryThumbnail.url);
    const thumbnailUrl = `${imgUrl}?w=${dimensions.w}&h=${dimensions.h}&fit=thumb`;
    return <img src={thumbnailUrl} height={`${dimensions.h}`} width={`${dimensions.w}`} />;
  }
}
