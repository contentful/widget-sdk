source 'https://rubygems.org'

gem 'rails', '3.2.12'
gem 'json', '>= 1.7.7' # Explicit version requirement because security
gem "haml"

group :assets do
  gem 'haml_coffee_assets', '~> 1.13.0'
  gem 'execjs'
  gem 'sass-rails',   '~> 3.2.6'
  gem 'coffee-rails', '~> 3.2.1'
  gem 'uglifier', '>= 1.0.3'
  gem 'asset_sync'
  gem "therubyracer"
  gem "compass", "~> 0.13.alpha.4"
  gem 'jquery-rails'
  gem 'jquery-ui-rails'
  gem 'sprockets-browserify'
  gem "compass-rails"
end

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
  gem 'rspec', '3.0.0.beta1'
  gem 'selenium-webdriver'
  gem 'capybara'
end
