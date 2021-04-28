import React from 'react';
import { css } from 'emotion';
import {
  Card,
  Typography,
  Heading,
  Flex,
  Grid,
  SkeletonContainer,
  SkeletonDisplayText,
  SkeletonBodyText,
  SkeletonImage,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import type { BasePlanContent } from '../types';

import { ContentfulRichText, ContentfulImage } from 'core/services/ContentfulCDA';
import { getCustomRenderNode, GetCustomRenderNodeOptions } from '../utils/getCustomRenderNode';

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
        transition: `background-color ${tokens.transitionDurationDefault} ${tokens.transitionEasingDefault}`,
      },
    }),
  illustration: css({
    margin: '0 auto',
    height: '100%',
  }),
};

interface BasePlanCardProps {
  // The content is fetched from Contentful and the model is defined by the "Tier" content model
  content?: BasePlanContent;
  organizationId: string;
  // Community orgs have one community space and we create a link in the card to upgrade them, for that we need that space’s id
  upgradableSpaceId?: GetCustomRenderNodeOptions['upgradableSpaceId'];
  users?: GetCustomRenderNodeOptions['users'];
  daysOfTrial?: GetCustomRenderNodeOptions['daysOfTrial'];
  loading: boolean;
}

export function BasePlanCard({
  content,
  organizationId,
  upgradableSpaceId,
  users,
  daysOfTrial,
  loading,
}: BasePlanCardProps) {
  const colorAccent = loading ? 'colorElementLight' : content?.colorAccent?.fields.value;

  return (
    <Card
      testId="base-plan-card"
      className={colorAccent && styles.card(colorAccent)}
      padding="large">
      <Grid columns="3fr 2fr" columnGap="spacingL">
        {(loading || !content) && <LoadingState />}
        {!loading && content && (
          <>
            <Typography>
              <Heading testId="base-plan-title">{content.title}</Heading>
              <ContentfulRichText
                testId="base-plan-description"
                document={content.description}
                customRenderNode={getCustomRenderNode(organizationId, {
                  upgradableSpaceId,
                  users,
                  colorAccent,
                  daysOfTrial,
                })}
              />
            </Typography>
            <Flex flexDirection="column">
              <ContentfulImage image={content.illustration} className={styles.illustration} />
            </Flex>
          </>
        )}
      </Grid>
    </Card>
  );
}

function LoadingState() {
  return (
    <>
      <SkeletonContainer svgHeight={250}>
        <SkeletonDisplayText />
        <SkeletonBodyText numberOfLines={3} offsetTop={48} />
        <SkeletonBodyText numberOfLines={3} offsetTop={128} />
      </SkeletonContainer>
      <Flex justifySelf="center">
        <SkeletonContainer svgHeight={250}>
          <SkeletonImage width={400} height={250} />
        </SkeletonContainer>
      </Flex>
    </>
  );
}
