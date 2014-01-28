module GatekeeperHelper
  def plan_row(plan_name)
    find(:xpath, "//div[@class=\"plan-big-row\" and contains(text(), \"#{plan_name}\")]/../..")
  end

  def choose_plan(plan_name)
    find(:xpath, "//div[@class=\"plan-big-row\" and contains(text(), \"#{plan_name}\")]/../../*/a").click
  end

  def reset_system
    return unless ENV['USE_QUIRELY']
    uri = URI.parse("https://reset.quirely.com/123abc")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.verify_mode = OpenSSL::SSL::VERIFY_NONE
    request = Net::HTTP::Get.new(uri.request_uri)
    http.request(request)
    clear_access_token
  end
end
