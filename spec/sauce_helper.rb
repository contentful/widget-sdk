require "sauce"
require "sauce/capybara"

Sauce.config do |c|
  c[:start_tunnel] = false
  if ENV['USE_SAUCE']
    c[:application_host] = "app.quirely.com"
    c[:application_port] = "80"
  end
  c[:start_local_application] = false
  c[:screen_resolution] = '1280x1024'
  # https://saucelabs.com/docs/additional-config :
  #c[:record_video] = false
  c[:record_screenshots] = false
  c[:capture_html] = false
  c[:sauce_advisor] = false
  c[:browsers] = [
    #["Windows 8", "Internet Explorer", "10"],
    #["Windows 7", "Firefox", "20"],
    #["OS X 10.8", "Chrome", nil],
    ["Windows 7", "Chrome", nil],
    #["Linux", "Chrome", nil]
  ]
end
