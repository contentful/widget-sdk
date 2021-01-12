import { Heading, TextLink } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { MarketplaceApp } from 'features/apps-core';
import React from 'react';
import { externalLinkProps } from './shared';

const styles = {
  icon: css({
    width: '60px',
    height: '60px',
    marginRight: tokens.spacingM,
  }),
};

export function AppHeader(props: { app: MarketplaceApp }) {
  const { app } = props;
  return (
    <div className={css({ display: 'flex', marginBottom: tokens.spacingL })}>
      <img src={app.icon} className={styles.icon} />
      <div>
        <Heading
          element="h1"
          className={css({
            lineHeight: tokens.lineHeightCondensed,
            fontSize: tokens.fontSize2Xl,
            fontWeight: tokens.fontWeightMedium,
          })}>
          {app.title}
        </Heading>
        {app.author && (
          <div>
            App • Developed by{' '}
            <TextLink href={app.author.url} {...externalLinkProps}>
              {app.author.name}
            </TextLink>
          </div>
        )}
      </div>
    </div>
  );
}
