const map = new geolonia.Map("#map");

map.on('load', function () {
  // アイコン画像設定
  // MEMO?: https://qiita.com/kkdd/items/0eb24549d10e875c1fa5
  map.loadImage('https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png', function (error, res) {
    map.addImage('sample1_icon', res);
  });

  // アイコン設定
  map.addSource('sample1_datasource', {
    type: 'geojson',
    data: '/geojson/sample1.geojson'
  });

  // スタイル設定
  map.addLayer({
    "id": "layer1",
    "type": "symbol",
    "source": "sample1_datasource",
    "layout": {
      "icon-image": "sample1_icon",
      "icon-allow-overlap": true,
      "icon-size": 1.00
    },
    "paint": {}
  });

  // アイコンクリックイベント
  map.on('click', "layer1", function (e) {
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
  map.on('mouseenter', 'layer1', function () {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', 'layer1', function () {
    map.getCanvas().style.cursor = '';
  });

  //////////////////////////////////////////////////////////////////////////////
  // 同様にdatasource2を読み込み
  // TODO: 汎用的に

  // 地図アイコン
  map.loadImage('https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Cat_silhouette.svg/400px-Cat_silhouette.svg.png', function (error, res) {
    map.addImage('sample2_icon', res);
  });

  // GEOJSON
  map.addSource('sample2_datasource', {
    type: 'geojson',
    data: '/geojson/sample2.geojson'
  });

  // レイヤー指定
  map.addLayer({
    "id": "layer2",
    "type": "symbol",
    "source": "sample2_datasource",
    "layout": {
      "icon-image": "sample2_icon",
      "icon-allow-overlap": true,
      "icon-size": 0.1
    },
    "paint": {}
  });

  // 以下同様

});
