// 実装時に最低限覚えておくこと
// ・geoloniaはMapBox GL LSを薄くwrapしたものなので、mapboxglをgeoloniaに変えると大抵動く(らしい)
// 　・なんでMapBox GL LSの実装を参考にすると割となんとかなる(可能性が高い)
//   ・置換忘れててmapboxglのままでも動いたりする
// @see https://docs.geolonia.com/
// @see https://docs.mapbox.com/jp/mapbox-gl-js/example/

const map = new geolonia.Map("#map");

// 中心地, 拡大率、GeoJSONのurlを設定 (開発用に決め打ち)
// TODO: 最初に現在位置取得から自動で中心位置を設定できるとよい

// MEMO: 開発確認用セットリスト
// GeoJSON名に都道府県コードとpref_name併記するのだるいな…
const place_list = {
  '栃木県佐野市': {
    'coordinates': [139.580, 36.305],   // [lng(経度), lat(緯度)]  なので注意
    'zoom': 13,
    // 'geojson': '/geojson/geojson/09_tochigi_all.geojson',
    'geojson': '/geojson/geojson/09_tochigi_ラーメン・餃子.geojson',
  },
  '大阪駅周辺': {
    'coordinates': [135.4959506, 34.7024854],
    'zoom': 16,
    // 'geojson': '/geojson/geojson/27_osaka_all.geojson',
    'geojson': '/geojson/geojson/27_osaka_お好み焼き・たこ焼き.geojson',
  },
  '山梨県甲府市': {
    'coordinates': [138.5687848, 35.666674],
    'zoom': 16,
    'geojson': '/geojson/geojson/19_yamanashi_all.geojson',
  },
  '埼玉県草加市': {
    'coordinates': [139.777649, 35.812065],
    'zoom': 14,
    'geojson': '/geojson/geojson/11_saitama_all.geojson',
  },
  '群馬県高崎駅周辺': {
    'coordinates': [139.0126623, 36.3228267],
    'zoom': 14,
    'geojson': '/geojson/geojson/10_gunma_all.geojson',
  },
  '奈良県曽爾村': {
    'coordinates': [136.1092048, 34.4905156],
    'zoom': 12,
    'geojson': '/geojson/geojson/29_nara_all.geojson',
  },
  '宮崎県': {
    'coordinates': [131.4178932, 31.9061487],
    'zoom': 15,
    'geojson': '/geojson/geojson/45_miyazaki_all.geojson',
  },
  '亀戸': {
    'coordinates': [139.8265658, 35.6973225],
    'zoom': 15,
    'geojson': '/geojson/geojson/kameido_all.geojson',
  },
};
// const place = place_list['栃木県佐野市']
// const place = place_list['大阪駅周辺']
// const place = place_list['山梨県甲府市']
// const place = place_list['埼玉県草加市']
// const place = place_list['群馬県高崎駅周辺']
// const place = place_list['奈良県曽爾村']
// const place = place_list['宮崎県']
const place = place_list['亀戸']

// MEMO: これだと中心地を後から移動してるので他マップの読み込みとかも入る(??)から良くなさそう
// speedを遅くしてみると顕著にわかる。Mapをnew()してるあたりでcenter, zoomを指定してやる感じか…？
const data_geojson = place.geojson
map.flyTo({
  center: place.coordinates,
  zoom: place.zoom,
  speed: 100000056562,
});
map.addControl(new geolonia.ScaleControl({
  // 左下に地図の縮尺(スケール)を表示
  maxWidth: 200,
  unit: 'metric'
}));

// TODO: 飲食店のジャンル別にレイヤーを分けて、それぞれ別のアイコンで表示させ、出し分けできるようにする
// 例: ジャンルが「ラーメン・餃子」と「和食・寿司」の店だけ表示させる
//
// 参考:
// https://docs.mapbox.com/jp/mapbox-gl-js/example/toggle-layers/
// https://docs.mapbox.com/jp/mapbox-gl-js/example/filter-markers-by-input/

map.on('load', function () {
  // アイコン画像設定
  // MEMO?: https://qiita.com/kkdd/items/0eb24549d10e875c1fa5
  map.loadImage('https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png', function (error, res) {
    map.addImage('icon-image-sample1', res);
  });

  // GeoJSON読み込み
  map.addSource('datasource-sample1', {
    type: 'geojson',
    data: data_geojson
    // data: '/geojson/sample3.geojson'
  });

  // レイヤー設定
  // MEMO: warn吐いてる、loadImageが終わってないタイミングでicon-image-sample1読み込みにいくから？
  map.addLayer({
    "id": "layer1",
    "source": "datasource-sample1",
    "type": "symbol",
    "layout": {
      // アイコン
      "icon-image": "icon-image-sample1",
      "icon-allow-overlap": true,         // これ入れとかないとlatlngが重なったときにアイコンが確実に上書きされてしまう
      "icon-size": 0.8,
      // アイコンの下にshop_nameをラベル表示させる
      // (フォント指定まわりドキュメントがあんまない)
      'text-field': "{shop_name}",
      "text-font": ["Noto Sans Regular"], // geoloniaで使えるフォント is 謎...
      'text-radial-offset': 1.8,
      // MEMO: 以下の設定入れとくとlatlngが重なったときにわかりやすい
      'text-variable-anchor': ['top', 'bottom', 'left', 'right'],   // アイコンの上下左右にラベル表示
      // 'text-variable-anchor': ['top'], // MEMO: ホントはこっちだけでいい
      'text-size': 12
    },
    "paint": {}
  });

  // ポイントのクリックイベント
  map.on('click', "layer1", function (e) {
    console.log(e)
    const coordinates = e.lngLat;
    const props = e.features[0].properties;

    // クリックしたときにPOPUPで出る吹き出しの中身のHTML(出力項目、デザインとかは要検討)
    const popup_html =
      `店舗名 ${props.shop_name} <br>` +
      `住所: ${props.address} <br>` +
      `カテゴリ: ${props.genre_name} <br>` +
      (props.tel ? `電話番号: ${props.tel} <br>`: '') +
      (props.offical_page ? `<a href="${props.offical_page}" target="_blank">公式ホームページ</a><br>` : '') +
      `<a href="${props['GoogleMap']}" target="_blank">GoogleMap</a>` + '<br>' +
      `<a href="${props['_国土地理院地図のURL']}" target="_blank">国土地理院地図</a>` + '<br>' +
    '';
    // TODO: 公式ホームページURL、電話番号あたりはそもそも入力されてない場合があるので出し分けがいる
    // geojson出力のときにちゃんと出し分けしてないのがよろしくない、以下の選択肢があるが今んとこ1.
    // (とりあえず手を抜いてるが決めの問題なんでどれでもいい、データサイズの観点からは3かもしれない)
    //   1. 電話番号が公式ホームページにない場合は props.tel === ''
    //   2. 電話番号が公式ホームページにない場合は props.tel === null
    //   3. 電話番号が公式ホームページにない場合は props.telを存在させない

    // 吹き出し表示
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }
    new geolonia.Popup()
      .setLngLat(coordinates)
      .setHTML(popup_html)
      .addTo(map);
  });

  // ポイントにマウスホバーさせたときにマウスカーソルを指に変化
  map.on('mouseenter', 'layer1', function () {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', 'layer1', function () {
    map.getCanvas().style.cursor = '';
  });

  //////////////////////////////////////////////////////////////////////////////
  // 同様にdatasource2を読み込み
  // TODO: 汎用的につくる
  // GeoJsonを飲食店のジャンル別(カテゴリ別)に出し分けるにはどうしたらよいか？
  //   案1: GeoJson自体をジャンル別でファイル分割(geojson作る側で分ける)
  //     -> 現状こっち想定
  //   案2: 一つのでっかいGeoJson(_all)読み込んだあとにjs側で分ける(dataSourcesかそのへん)
  //     -> https://docs.mapbox.com/jp/mapbox-gl-js/example/multiple-geometries/ こういうの？

  // この辺で完全にやる気を失っているのがおわかりいただけますね？

  // ﾈｺﾁｬﾝ!!!!!!
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
