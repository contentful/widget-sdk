import React from 'react';
import PropTypes from 'prop-types';

// TODO: Use widgetApi instead!
import { isValidImage, getExternalImageUrl } from 'directives/thumbnailHelpers';

const dimensions = { width: 70, height: 70 };

class Thumbnail extends React.Component {
  static propTypes = {
    thumbnail: PropTypes.shape({
      url: PropTypes.string,
      contentType: PropTypes.string
    })
  };

  static defaultProps = {
    thumbnail: undefined
  };

  render() {
    const { thumbnail } = this.props;
    const valid = thumbnail && isValidImage(thumbnail.contentType);
    if (!valid) {
      return null;
    }
    const imgUrl = getExternalImageUrl(thumbnail.url);

    return (
      <img
        src={`${imgUrl}?w=${dimensions.width}&h=${dimensions.height}&fit=thumb`}
        height={dimensions.height}
        width={dimensions.width}
      />
    );
  }
}

export default Thumbnail;
