// 実装時に最低限覚えておくこと
// ・geoloniaはMapBox GL LSを薄くwrapしたものなので、mapboxglをgeoloniaに変えると大抵動く(らしい)
// 　・なんでMapBox GL LSの実装を参考にすると割となんとかなる(可能性が高い)
//   ・置換忘れててmapboxglのままでも動いたりする
// @see https://docs.geolonia.com/
// @see https://docs.mapbox.com/jp/mapbox-gl-js/example/

// 中心地, 拡大率、GeoJSONのurlを設定 (開発用に決め打ち)
// TODO: 最初に現在位置取得から自動で中心位置を設定できるとよい

// MEMO: 開発確認用セットリスト
// GeoJSON名に都道府県コードとpref_name併記するのだるいな…
const place_list = {
  '栃木県佐野市': {
    'coordinates': [139.580, 36.305], // [lng(経度), lat(緯度)]  なので注意
    'zoom': 13,
    'geojson': '/geojson/geojson/09_tochigi_all.geojson',
    // 'geojson': '/geojson/geojson/09_tochigi_ラーメン・餃子.geojson',
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
const place = place_list['栃木県佐野市']
// const place = place_list['大阪駅周辺']
// const place = place_list['山梨県甲府市']
// const place = place_list['埼玉県草加市']
// const place = place_list['群馬県高崎駅周辺']
// const place = place_list['奈良県曽爾村']
// const place = place_list['宮崎県']
// const place = place_list['亀戸']

// 地図の設定
const map = new geolonia.Map({
  container: '#map',
  center: place.coordinates,
  zoom: place.zoom,
}).addControl(new geolonia.ScaleControl({
  // 左下に地図の縮尺(スケール)を表示
  maxWidth: 200,
  unit: 'metric'
}));

// Point用各種イメージを読み込み
// アイコン画像設定
// MEMO?: https://qiita.com/kkdd/items/0eb24549d10e875c1fa5
map.loadImage('/img/image1.png', function (error, res) {
  map.addImage('icon-image-1', res);
});
map.loadImage('https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png', function (error, res) {
  map.addImage('icon-image-2', res);
});
map.loadImage('/img/ramen.png', function (error, res) {
  map.addImage('icon-ramen', res);
});

// マウスオーバーでポインタを人差し指にする
const mouse_enter_function = () => {
  map.getCanvas().style.cursor = 'pointer';
}
const mouse_leave_function = () => {
  map.getCanvas().style.cursor = '';
}
// クリックしたときにPOPUPで吹き出しを出す
const click_point_function = (e) => {
  console.log(e)
  const coordinates = e.lngLat;
  const props = e.features[0].properties;

  const popup_html =
    `店舗名 ${props.shop_name} <br>` +
    `住所: ${props.address} <br>` +
    `カテゴリ: ${props.genre_name} <br>` +
    (props.tel ? `電話番号: ${props.tel} <br>` : '') +
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
}


map.on('load', function () {
  const prefix = '09_tochigi';
  const genre_list = [
    'all',
    '洋食',
    'その他',
    '居酒屋',
    '中華料理',
    '和食・寿司',
    'ラーメン・餃子',
    'うどん・そば・丼',
    'カフェ・スイーツ',
    'ファーストフード',
    'バー・ダイニングバー',
    'フレンチ・イタリアン',
    'すき焼き・しゃぶしゃぶ',
    '焼肉・ホルモン・韓国料理',
    'ファミリーレストラン・食堂',
    'アジア・エスニック・各国料理',
  ]

  genre_list.forEach(function (genre) {
    const layer_id = `layer-${genre}`;

    // GeoJSON読み込み
    map.addSource(`datasource-${layer_id}`, {
      type: 'geojson',
      data: `/geojson/geojson/${prefix}_${genre}.geojson`
      // data: '/geojson/sample3.geojson'
    });

    // アイコン設定
    map.loadImage('https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png', function (error, res) {
      map.addImage(`icon-image-${layer_id}`, res);
    });

    // レイヤー設定
    map.addLayer({
      "id": layer_id,
      "source": `datasource-${layer_id}`,
      "type": "symbol",
      "layout": {
        'visibility': genre === 'all' ? 'visible' : 'none',
        // アイコン
        "icon-image": genre === 'all' ? 'icon-image-2' : 'icon-image-1',  // 雑
        "icon-allow-overlap": true, // これ入れとかないとlatlngが重なったときにアイコンが確実に上書きされてしまう
        "icon-size": 0.8,
        // アイコンの下にshop_nameをラベル表示させる(フォント指定まわりドキュメントがあんまない)
        'text-field': "{shop_name}",
        "text-font": ["Noto Sans Regular"], // geoloniaで使えるフォント is 謎...
        'text-radial-offset': 1.8,
        // MEMO: 以下の設定入れとくとlatlngが重なったときにわかりやすい
        'text-variable-anchor': ['top', 'bottom', 'left', 'right'], // アイコンの上下左右にラベル表示
        // 'text-variable-anchor': ['top'], // MEMO: ホントはこっちだけでいい
        'text-size': 12
      },
    });

    // ジャンル別メニューの設定
    // MEMO: allとかの排他制御とかは作り込んでない、雑い
    const link = document.createElement('a');
    link.href = '#';
    link.className = genre === 'all' ? 'active' : '';
    link.textContent = genre;
    link.onclick = function (e) {
      const clickedLayer = 'layer-' + this.textContent;
      e.preventDefault();
      e.stopPropagation();

      if ( map.getLayoutProperty(clickedLayer, 'visibility') === 'visible') {
        map.setLayoutProperty(clickedLayer, 'visibility', 'none');
        this.className = '';
      } else {
        this.className = 'active';
        map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
      }
    };
    document.getElementById('menu').appendChild(link);

    // 各種イベントを設定
    map.on('click', layer_id, click_point_function);
    map.on('mouseenter', layer_id, mouse_enter_function);
    map.on('mouseleave', layer_id, mouse_leave_function);
  });
});
