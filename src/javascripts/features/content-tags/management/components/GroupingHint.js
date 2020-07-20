import React, { useMemo } from 'react';
import { Note, TextLink } from '@contentful/forma-36-react-components';
import { DEFAULT_GROUP, GROUP_DELIMITERS, groupForLabel } from 'features/content-tags/editor/utils';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';

const GroupingHint = ({ tagName }) => {
  const href = useMemo(
    () =>
      buildUrlWithUtmParams({
        source: 'webapp',
        medium: 'tags-management',
        campaign: 'in-app-help',
      })('https://www.contentful.com/help/tags/#grouping-tags'),
    []
  );

  const group = groupForLabel(tagName, GROUP_DELIMITERS);
  if (group !== DEFAULT_GROUP) {
    return (
      <Note>
        Nice to see you’re creating <TextLink href={href}>tag groups</TextLink>! This tag will be
        grouped under{' '}
        <strong>
          <code>{group}</code>
        </strong>{' '}
        in entries and assets.
      </Note>
    );
  } else {
    return (
      <Note>
        Tip: use prefixes in tag names separated with a symbol (hyphen, colon, dot, underscore or
        hash) and we will show them grouped by prefix in entries and assets, e.g.,{' '}
        <strong>
          <code>Year:&nbsp;2019</code>
        </strong>{' '}
        and{' '}
        <strong>
          <code>Year:&nbsp;2020</code>
        </strong>
        . <TextLink href={href}>Learn more</TextLink>
      </Note>
    );
  }
};
export { GroupingHint };
