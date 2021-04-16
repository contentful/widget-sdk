import React from 'react';
import { css } from 'emotion';
import { Card, Typography, Heading, Flex, Grid } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import type { Document } from '@contentful/rich-text-types';
import type { Asset, Entry } from 'contentful';
import type { GetCustomRenderNodeOptions } from '../utils/getCustomRenderNode';

import { ContentfulRichText, ContentfulImage } from 'core/services/ContentfulCDA';
import { getCustomRenderNode } from '../utils/getCustomRenderNode';

const styles = {
  card: (color: string) =>
    css({
      position: 'relative',
      overflow: 'hidden',
      '&:before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        height: tokens.borderRadiusMedium,
        width: '100%',
        backgroundColor: tokens[color],
      },
    }),
};

interface BasePlanCardProps {
  // The content is fetched from Contentful and the model is defined by the "Tier" content model
  content: {
    title: string;
    colorAccent: Entry<{ name: string; value: string }>;
    description: Document;
    illustration: Asset;
  };
  organizationId: string;
  // Community orgs have one community space and we create a link in the card to upgrade them, for that we need that space’s id
  upgradableSpaceId?: GetCustomRenderNodeOptions['upgradableSpaceId'];
  users?: GetCustomRenderNodeOptions['users'];
}

export function BasePlanCard({
  content,
  organizationId,
  upgradableSpaceId,
  users,
}: BasePlanCardProps) {
  const colorAccent = content.colorAccent.fields.value;

  return (
    <Card className={styles.card(colorAccent)} padding="large">
      <Grid columns="60% 40%">
        <Typography>
          <Heading testId="base-plan-title">{content.title}</Heading>
          <ContentfulRichText
            testId="base-plan-description"
            document={content.description}
            customRenderNode={getCustomRenderNode(organizationId, {
              upgradableSpaceId,
              users,
              colorAccent,
            })}
          />
        </Typography>
        <Flex justifySelf="center">
          <ContentfulImage image={content.illustration} />
        </Flex>
      </Grid>
    </Card>
  );
}
