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
    'prefix': '09_tochigi',
    // 'geojson': '/geojson/geojson/09_tochigi_ラーメン・餃子.geojson',
  },
  '大阪駅周辺': {
    'coordinates': [135.4959506, 34.7024854],
    'zoom': 16,
    // 'geojson': '/geojson/geojson/27_osaka_all.geojson',
  },
  '山梨県甲府市': {
    'coordinates': [138.5687848, 35.666674],
    'zoom': 16,
  },
  '埼玉県草加市': {
    'coordinates': [139.777649, 35.812065],
    'zoom': 14,
  },
  '群馬県高崎駅周辺': {
    'coordinates': [139.0126623, 36.3228267],
    'zoom': 14,
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
    'prefix': '13_tokyo',
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

const genres = {
  1: '居酒屋・バー・ダイニングバー・バル',
  2: '和食・割烹・寿司',
  3: '洋食・フレンチ・イタリアン',
  4: '中華',
  5: 'うどん・そば・ラーメン・餃子・丼',
  6: 'カレー・アジア・エスニック・各国料理',
  7: 'ステーキ・焼肉・ホルモン・すき焼き・しゃぶしゃぶ',
  8: 'ファーストフード・ファミレス・食堂',
  9: 'カフェ・スイーツ',
  10: 'その他',
}

// Marker用アイコンを読み込み
for (const [key, _] of Object.entries(genres)) {
  map.loadImage(`/img/genre${key}.png`, function (error, res) {
    map.addImage(`icon-image-genre${key}`, res);
  });
}
map.loadImage('https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png', function (error, res) {
  map.addImage('icon-image-common', res);
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
  // TODO: functionまわりをきちんと(jsダメな人のクソ実装なおす)
  const prefix = place.prefix;

  for (const [genre_id, genre_name] of Object.entries(genres)) {
    const layer_id = `layer-${genre_id}`;

    // GeoJSON読み込み
    map.addSource(`datasource-${genre_id}`, {
      type: 'geojson',
      data: `/geojson/geojson/${prefix}/genre${genre_id}.geojson`
    });

    // レイヤー設定
    map.addLayer({
      "id": layer_id,
      "source": `datasource-${genre_id}`,
      "type": "symbol",
      "layout": {
        'visibility': genre_name === 'all' ? 'visible' : 'none',
        // アイコン
        "icon-image": genre_name === 'all' ? 'icon-image-common' : `icon-image-genre${genre_id}`,  // 雑
        "icon-allow-overlap": true, // これ入れとかないとlatlngが重なったときにアイコンが確実に上書きされてしまう
        "icon-size": 0.8,
        // アイコンの下にshop_nameをラベル表示させる(フォント指定まわりドキュメントがあんまない)
        'text-field': "{shop_name}",
        "text-font": ["Noto Sans Regular"], // geoloniaで使えるフォント is 謎...
        'text-radial-offset': 1.8,
        // MEMO: 以下の設定入れとくとlatlngが近く、描画でテキストラベルが重なったときに
        // ラベル位置を再配置してくれる。特に本アプリの場合、ジオコーダの解像度が低いので
        // latlngが重複してしまう可能性が非常に高いため、必須
        'text-variable-anchor': ['top', 'bottom', 'left', 'right'], // アイコンの上下左右にラベル表示
        'text-size': 12
      },
    });

    // 左側に表示されるジャンル別メニューの設定
    // MEMO: allとかの排他制御とかは作り込んでない(あった方がいい気がする)
    // -> そもそもallは_all.geojsonを読むのではなく全選択表示にすべきなのでは、
    // 全選択/全選択解除は実際に触ってるとしばしばほしくなる // TODO
    // 初期状態は全選択表示状態でよい？ (現在は無選択なので微妙)
    const link = document.createElement('a');
    link.href = '#';
    link.className = genre_id === 'all' ? 'active' : '';
    link.textContent = genre_name;
    link.onclick = function (e) {
      const clickedLayer = layer_id;
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
  }

  document.getElementById('menu').style.visibility = 'visible';
});

