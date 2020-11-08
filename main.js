const map = new geolonia.Map("#map");

map.on('load', function () {
  // アイコン画像設定
  // MEMO?: https://qiita.com/kkdd/items/0eb24549d10e875c1fa5
  map.loadImage('https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png', function (error, res) {
    map.addImage('sample1', res);
  });
  map.loadImage('https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png', function (error, res) {
    map.addImage('sample2', res);
  });

  // アイコン設定
  map.addSource('symbol_sample', {
    type: 'geojson',
    data: '/geojson/sample.geojson'
  });

  // スタイル設定
  map.addLayer({
    "id": "symbol_sample",
    "type": "symbol",
    "source": "symbol_sample",
    "layout": {
      "icon-image": "sample1",
      "icon-allow-overlap": true,
      "icon-size": 1.00
    },
    "paint": {}
  });

  // アイコンクリックイベント
  map.on('click', "symbol_sample", function (e) {
    const coordinates = e.lngLat;
    const props = e.features[0].properties;

    // 吹き出しの中身を組み立て
    const popup_html =
      'description: ' + props.description + '<br>' +
      '住所: ' + props['住所'] + '<br>' +
      '電話番号: ' + props['電話'] + '<br>' +
      `<a href="${props['ホームページ']}" target="_blank">公式ホームページ</a>`;

    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }
    new geolonia.Popup()
      .setLngLat(coordinates)
      .setHTML(popup_html)
      .addTo(map);
  });

  // ポイントにマウスホバーさせたときにマウスカーソルを変化させる
  map.on('mouseenter', 'symbol_sample', function () {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', 'symbol_sample', function () {
    map.getCanvas().style.cursor = '';
  });

});
