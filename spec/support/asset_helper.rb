module AssetHelper
  DEFAULT_LOCALE = 'en-US'
  ASSET = {
    :fields => {
      :title => Hash[*[DEFAULT_LOCALE, 'Bacon']],
      :description => Hash[*[DEFAULT_LOCALE, 'So chunky and crispy']],
      :file => Hash[*[DEFAULT_LOCALE, {
        :contentType => 'image/jpeg',
        :fileName => 'example.jpg',
        :details => {
          :image => {
            :width => 333,
            :height => 300
          },
          :size => 17812
        },
        :url => "//images.joistio.com:8888/jvghydx4zq2t/4iX7NmIA0wsIWkGOmm2OWS/4871dd9962d7a6120696d984bf078b80/evilmonkey.jpg"
      }]],
    }
  }

  def set_asset(scope_selector)
    eval_scope scope_selector, "otDoc.at('fields').set(#{ASSET[:fields].to_json})"
    sleep 0.5
    eval_scope scope_selector, "otUpdateEntity()"
    apply_scope scope_selector
  end
end
