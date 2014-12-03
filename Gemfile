source 'https://rubygems.org'

gem 'rails', '3.2.12'
gem 'json', '>= 1.7.7' # Explicit version requirement because security
gem "jade", :git => 'http://github.com/janv/jade.git'

group :assets do
  gem 'execjs'
  gem 'sass-rails',   '~> 3.2.6'
  gem 'stylus', '~> 0.7.0'
  gem 'coffee-rails', '~> 3.2.1'
  gem 'uglifier', '>= 1.0.3'
  gem 'asset_sync'
  gem "therubyracer"
  gem "compass", "~> 0.13.alpha.4"
  gem 'jquery-rails'
  gem 'jquery-ui-rails'
  gem 'sprockets-browserify', '~> 0.3.0'
  gem "compass-rails"
end

group :development do
  gem 'quiet_assets'
end

group :acceptance do
  gem 'quiet_assets'
end

group :development, :test do
  gem "guard-livereload"
  gem 'rb-fsevent', '~> 0.9.1', :require => false
  gem "jasmine"
end

group :test do
  gem 'rspec', '3.0.0.beta1'
  gem 'selenium-webdriver'
  gem 'capybara'
end
