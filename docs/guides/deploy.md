# Deployment with Samson

(This it a tl;dr version of https://contentful.atlassian.net/wiki/spaces/ENG/pages/129794049/Deployment+with+Samson for the user_interface repo)

We use Samson (https://samson.contentful.org/) to deploy the user interface on all stages.

## Preview and Staging

Both preview (quirely) an staging (flinkly) are automatically updated with the latest version of master. If you want to see your branch on quirely or flinkly, you can do it with a query parameter `?ui_version=<branch_or_commit>` so there should be no need to deploy custom versions or lock these stages.

## Production

We do manual deployment on production.

Prerequisites:

- E2E tests on master are passing (can be checked in github and Samson will give a warning when trying to deploy without all passing tests)

1. Create a Samson deployment on Production: https://samson.contentful.org/projects/user_interface/stages/production/deploys/new. Use a hash to point to the commit you want to deploy (usually it's the one that's currently on staging)
2. Review and confirm
3. A message from Samson will be posted in #dev-frontend channel for another developer to approve the deployment. You can also choose to bypass the approval (if there is a good reason for it)
4. Wait for success message in Samson UI or #dev-deployment

