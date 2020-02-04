# Contribution Guidelines

The user interface project is maintained by the frontend team but we welcome contributions from anyone.

Here are the guidelines we'd like you to follow:

- [Issue reporting](#issue)
- [Request a feature](#feature)
- [Version switcher](#switcher)
- [Submission guidelines](#guidelines)
- [More information](#info)

## <a name="issue"></a> Issue reporting

If you find a bug, you can help us by creating an issue under the "Bugs pool" in Target Process and assigning it to "Frontend". Please check for duplicates first though.

Better still, submit a pull request with a fix. You can also talk to the support person for dev-frontend, or ask in slack channel for things tackled by teams, not chapter.

## <a name="feature"></a> Requesting a feature

If you have a small improvement suggestion, add it to the "Features Pool" in Target Process and talk to PM. Ask in product-experts channel, and talk to one of the PMs who deal with UI for larger features.

## <a name="switcher"></a> Version switcher

You can run the code for a specific commit in the user interface by navigating to `https://app.quirely.com?ui_version={commithash}` in your browser.

## <a name="guidelines"></a> Code submission guidelines

- Make your changes in a new git branch based off `master`. We generally use the prefixes `fix`,`feature`, `refactor` or `release` for our branches.
- Include relevant test cases
- Open a PR to merge to master
- Make the required checks pass
- Use the GitHub label `Please review` when your code is ready for review
- You can assign the PR to a specific individual, multiple individuals to increase your chances of review or leave it unassigned for anyone to pick up
- Make sure QA has been done for possibly breaking / big changes

  Unless there are no user facing changes or excellent test coverage for the changed components. In all other cases explicit approval needs to be obtained from manual QA. When in doubt, consult with QA.

For an in-depth reference of the submission process see the [code submission guide](./docs/guides/code-submission.md)
and [code review guide](./docs/guides/code-review.md)

## <a name="info"></a> More information

- See the [frontend chapter](https://contentful.atlassian.net/wiki/spaces/ENG/pages/3637664/Frontend+Chapter) on the wiki
- Ping the `#dev-frontend` channel on Slack
