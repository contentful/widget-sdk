# HTML Client App

##Get it running:

1. Start private_content_api at `http://localhost:3000` (the default) with -d flag
2. Seed the server
3. git submodule update --init
4. Start rails with `rails -s -p3001` and visit `http://localhost:3001`

##Running tests

### Unit/integration tests

Located under `spec/javascripts/contentful/`

On the main project directory:

1. On one terminal run the server `bundle exec rake jasmine JASMINE_PORT=8112`
2. Then `./run_js_unit_tests.sh`

### Acceptance tests

Located under `spec/features`

On the main project directory:

1. `bundle exec rspec spec/features`
