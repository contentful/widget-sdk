# HTML Client App

## Environments

### Integration
The environment running on the integration server (for Capybara testing). Like Staging

### Acceptance
For running Capybara tests?

### Test
For locally running unit tests

##Running tests

### Unit/integration tests

Located under `spec/javascripts/contentful/`

On the main project directory:

1. On one terminal run the server `bundle exec rake jasmine`
2. Open browser at localhost:8889

You might want to use `RAILS_ENV=test bundle exec rake jasmine` to use
localhost as the asset host instead of static.joistio.com.

### Acceptance tests

Located under `spec/features`

On the main project directory:

1. `bundle exec rspec spec/features`

Possible ENV VARS:

- `USE_QUIRELY=true` to run against the integration server
  instead of localhost
- `USE_SAUCE=true` to use sauce labs instead of local firefox.
  Implies `USE_QUIRELY`
