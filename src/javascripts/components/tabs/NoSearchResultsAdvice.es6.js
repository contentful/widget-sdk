import React from 'react';
import cn from 'classnames';
import { Icon } from '@contentful/forma-36-react-components';

import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

const styles = {
  icon: css({
    width: tokens.spacing4Xl,
    height: tokens.spacing4Xl
  })
};

export default function NoSearchResultsAdvice() {
  return (
    <div className={cn('advice', 'advice--row-aligned')}>
      <Icon
        extraClassNames={cn(styles.icon, 'f36-margin-right--s')}
        icon="Search"
        size="large"
        color="muted"
      />
      <div className={cn('advice__frame', 'advice__frame--no-margin', 'advice__frame--align-left')}>
        <div className={cn('advice__title', 'advice__title--normal')}>
          Sadly, we didn&#39;t find anything matching your search
        </div>
        <p className="advice__subtext">
          Have you tried a different search term or filter? Here&#39;s&nbsp;
          <a
            href="https://www.contentful.com/r/knowledgebase/content-search/"
            target="_blank"
            rel="noopener noreferrer">
            how search works
          </a>
        </p>
      </div>
    </div>
  );
}
