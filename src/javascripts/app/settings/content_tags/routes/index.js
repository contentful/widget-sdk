import React from 'react';
import TagsRoute from './TagsRoute';

export default {
  name: 'tags',
  url: '/tags',
  component: (props) => <TagsRoute {...props} redirectUrl={'spaces.detail'} />,
};
