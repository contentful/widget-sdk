# This file is copied to spec/ when you run 'rails generate rspec:install'
ENV["RAILS_ENV"] ||= 'test'
ENV["USE_QUIRELY"] = 'true' if ENV["USE_BSTACK"]
require File.expand_path("../../config/environment", __FILE__)
require 'rspec/autorun'
require 'capybara/rspec'

Capybara::Node::Element.class_eval do
  def click_at(x, y)
    synchronize do
      right = x - (native.size.width / 2)
      top = y - (native.size.height / 2)
      driver.browser.action.move_to(native).move_by(right.to_i, top.to_i).click.perform
    end
  end
end

Capybara.register_driver :selenium_chrome do |app|
  Capybara::Selenium::Driver.new(app, :browser => :chrome)
end

Capybara.register_driver :browser_stack do |app|
  url = "http://janvarwig:YJ8Wp7iZz7tyszpZGHgR@hub.browserstack.com/wd/hub"
  capabilities = Selenium::WebDriver::Remote::Capabilities.chrome
  capabilities.platform = :WINDOWS
  capabilities["browserstack.debug"] = "true"
  capabilities["resolution"] = "1280x1024"
   
  Capybara::Selenium::Driver.new(app,
    :browser => :remote,
    :url => url,
    :desired_capabilities => capabilities)
end

Capybara.run_server = false

if ENV['USE_QUIRELY']
  Capybara.app_host = 'https://app.quirely.com'
  Capybara.default_wait_time = 30
else
  Capybara.app_host = 'http://app.joistio.com:8888'
  Capybara.default_wait_time = 5
end

if ENV['USE_BSTACK']
  Capybara.javascript_driver = :browser_stack
else
  Capybara.javascript_driver = :selenium
end

# Requires supporting ruby files with custom matchers and macros, etc,
# in spec/support/ and its subdirectories.
Dir[Rails.root.join("spec/support/**/*.rb")].each {|f| require f}

RSpec.configure do |config|
  config.order = :random
  config.include EnvHelper
  config.include FeatureHelper
  config.filter_run_excluding :quirely_only => true unless ENV['USE_QUIRELY']
  config.before(:all) do
    clear_access_token if ENV['USE_QUIRELY']
  end
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
