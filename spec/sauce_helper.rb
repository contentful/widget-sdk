require "sauce"
require "sauce/capybara"

Sauce.config do |c|
  c[:start_tunnel] = false
  c[:application_host] = "app.flinkly.com"
  c[:application_port] = "80"
  c[:start_local_application] = false
  c[:screen_resolution] = '1280x1024'
  c[:browsers] = [
    #["Windows 8", "Internet Explorer", "10"],
    #["Windows 7", "Firefox", "20"],
    #["OS X 10.8", "Chrome", nil],
    ["Windows 7", "Chrome", nil],
    #["Linux", "Chrome", nil]
  ]
end
