import { NetlifyWebhookTemplate } from './NetlifyWebhookTemplate';
import { GoogleCloudWebhookTemplate } from './GoogleCloudWebhookTemplate';
import { SlackWebhookTemplate } from './SlackWebhookTemplate';
import { TwilioWebhookTemplate } from './TwilioWebhookTemplate';
import { MailgunWebhookTemplate } from './MailgunWebhookTemplate';
import { JiraWebhookTemplate } from './JiraWebhookTemplate';
import { PubNubWebhookTemplate } from './PubNubWebhookTemplate';
import { CircleCIWebhookTemplate } from './CircleCIWebhookTemplate';
import { HerokuWebhookTemplate } from './HerokuWebhookTemplate';
import { TravisCIWebhookTemplate } from './TravisCIWebhookTemplate';
import { GitlabWebhookTemplate } from './GitlabWebhookTemplate';
import { AlgoliaWebhookTemplate } from './AlgoliaWebhookTemplate';
import { ElasticWebhookTemplate } from './ElasticWebhookTemplate';
import { AwsLambdaWebhookTemplate } from './AwsLambdaWebhookTemplate';
import { AwsS3WebhookTemplate } from './AwsS3WebhookTemplate';
import { AwsSqsWebhookTemplate } from './AwsSqsWebhookTemplate';
import { BitbucketWebhookTemplate } from './BitbucketWebhookTemplate';
import { VercelWebhookTemplate } from './VercelWebhookTemplate';

// eslint-disable-next-line rulesdir/allow-only-import-export-in-index
export const WebhookTemplates = [
  NetlifyWebhookTemplate,
  HerokuWebhookTemplate,
  TravisCIWebhookTemplate,
  CircleCIWebhookTemplate,
  VercelWebhookTemplate,
  GitlabWebhookTemplate,
  BitbucketWebhookTemplate,
  AwsLambdaWebhookTemplate,
  GoogleCloudWebhookTemplate,
  SlackWebhookTemplate,
  TwilioWebhookTemplate,
  MailgunWebhookTemplate,
  AwsSqsWebhookTemplate,
  PubNubWebhookTemplate,
  AwsS3WebhookTemplate,
  AlgoliaWebhookTemplate,
  ElasticWebhookTemplate,
  JiraWebhookTemplate,
];
