import React from 'react';
import PropTypes from 'prop-types';
import { getModule } from 'NgRegistry.es6';

// TODO: Use widgetApi instead!
const thumbnailHelpers = getModule('ui/cf/thumbnailHelpers.es6');

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
    const valid = thumbnail && thumbnailHelpers.isValidImage(thumbnail.contentType);
    if (!valid) {
      return null;
    }
    const imgUrl = thumbnailHelpers.getExternalImageUrl(thumbnail.url);

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
