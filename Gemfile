source 'https://rubygems.org'

gem 'rails', '3.2.12'
gem 'json', '>= 1.7.7' # Explicit version requirement because security

# Bundle edge Rails instead:
# gem 'rails', :git => 'git://github.com/rails/rails.git'

gem "therubyracer"
gem "haml"
gem "compass", "~> 0.13.alpha.4"
gem "compass-rails"

# Gems used only for assets and not required
# in production environments by default.
group :assets do
  gem 'haml_coffee_assets'
  gem 'execjs'
  gem 'sass-rails',   '~> 3.2.6'
  gem 'coffee-rails', '~> 3.2.1'

  # See https://github.com/sstephenson/execjs#readme for more supported runtimes
  # gem 'therubyracer', :platforms => :ruby

  gem 'uglifier', '>= 1.0.3'
  gem 'asset_sync'
end

gem 'jquery-rails'
gem 'jquery-ui-rails'
#gem 'sprockets-browserify', :path => '/Users/jan/development/rails_plugins/sprockets-browserify'
gem 'sprockets-browserify'

group :development do
  gem 'debugger'
  gem 'quiet_assets'
end

group :acceptance do
  gem 'quiet_assets'
end

group :development, :test do
  gem "guard-livereload"
  gem 'rb-fsevent', '~> 0.9.1', :require => false
  gem "jasmine", :git => 'git://github.com/janv/jasmine-gem.git', :branch => 'patch-1'
  gem 'sauce'
  gem 'sauce-connect'
end

group :test do
  gem 'rspec-rails'
  gem 'selenium-webdriver'
  gem 'capybara'
end

# To use ActiveModel has_secure_password
# gem 'bcrypt-ruby', '~> 3.0.0'

# To use Jbuilder templates for JSON
# gem 'jbuilder'

# Use unicorn as the app server
# gem 'unicorn'

# Deploy with Capistrano
# gem 'capistrano'
