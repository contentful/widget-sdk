import React from 'react';
import { Asset } from 'contentful';

interface ContentfulImageProps {
  image: Asset;
  className?: string;
}

const ContentfulImage = ({ image, className }: ContentfulImageProps) => {
  const imageURL = 'https:' + image.fields.file.url;

  return <img src={imageURL} alt={image.fields.file.fileName} className={className} />;
};

export { ContentfulImage };
