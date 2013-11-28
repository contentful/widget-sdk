# This file is copied to spec/ when you run 'rails generate rspec:install'
ENV["RAILS_ENV"] ||= 'test'
require File.expand_path("../../config/environment", __FILE__)
require 'rspec/rails'
require 'rspec/autorun'
#require "sauce_helper"
#require 'capybara/rails'
require 'capybara/rspec'

Capybara.register_driver :selenium_chrome do |app|
  Capybara::Selenium::Driver.new(app, :browser => :chrome)
end

Capybara.run_server = false
Capybara.app_host = 'http://app.joistio.com:8888'
Capybara.default_wait_time = 5
Capybara.javascript_driver = :selenium

if ENV['CI']
  Capybara.default_wait_time = 60
end

if ENV['USE_SAUCE']
  Capybara.app_host = 'https:/app.flinkly.com'
  Capybara.default_wait_time = 60
  Capybara.javascript_driver = :sauce
end

# Requires supporting ruby files with custom matchers and macros, etc,
# in spec/support/ and its subdirectories.
Dir[Rails.root.join("spec/support/**/*.rb")].each {|f| require f}

RSpec.configure do |config|
  config.infer_base_class_for_anonymous_controllers = false
  config.order = "random"
  config.include EnvHelper
  config.include FeatureHelper
  config.before(:each) do
    Capybara.current_session.driver.browser.manage.window.resize_to(1440, 900)
  end
end

def accept_browser_dialog
  wait = Selenium::WebDriver::Wait.new(:timeout => 30)
  wait.until {
    begin
      page.driver.browser.switch_to.alert
      true
    rescue Selenium::WebDriver::Error::NoAlertPresentError
      false
    end
  }
  page.driver.browser.switch_to.alert.accept
end
