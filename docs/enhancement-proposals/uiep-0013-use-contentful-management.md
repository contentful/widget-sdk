> id: UIEP-0013
> title: Use contentful-management
> champions: Alex Suevalov
> endDate: January 8th, 2021
> status: Approved

# [UIEP-0013] Use contentful-management

## Description

After the latest release of `contentful-management` it became possible to use this library in the web applications by using the plain version of the client. [Read release notes of contentful-management@7](https://github.com/contentful/contentful-management.js/releases/tag/v7.0.0)

Two new applications, Compose and Launch, are using `contentful-management` already and the plan is to use it for all front-end applications in Contentful.

## Motivation

`user_interface` has several CMA client for historical reasons:

- `src/javascripts/data/APIClient.js`
- `src/javascripts/data/CMA`
- `src/javascripts/libs/legacy_client`

The way we work with CMA is very inconsistent. At the same time now we can an official open-source library with built-in rate-limit mechanism and a first class Typescript support.

### Example of using it

See changed files in this PR.

## Plan

The very next goal once this PR is merged is to get rid of `legacy_client` and all things that depend on it (for example, `spaceContext.space`). This will be done in iterations.

Deadline: **End of Q1**
Responsible: @suevalov and @giotiskl

## Risks

Introducing one more CMA client for some time. Refactoring from all client to a new one can take a while.

## Outcome

To have only one client for all CMA operations - used internally and externally

## Resources

- https://github.com/contentful/contentful-management.js
