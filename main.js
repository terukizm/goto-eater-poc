
// 適当に決めた10ジャンル
const genres = {
  1: '居酒屋・バー・ダイニングバー・バル',
  2: '和食・割烹・寿司',
  3: '洋食・フレンチ・イタリアン',
  4: '中華',
  5: 'うどん・そば・ラーメン・餃子・丼',
  6: 'カレー・アジア・エスニック・各国料理',
  7: 'ステーキ・焼肉・すき焼き・しゃぶしゃぶ',
  8: 'ファーストフード・ファミレス・食堂',
  9: 'カフェ・スイーツ',
  10: 'その他',
}

// 実装時に最低限覚えておくこと
// ・geoloniaはMapBox GL LSを薄くwrapしたものなので、mapboxglをgeoloniaに変えると大抵動く(らしい)
// 　・なんでMapBox GL LSの実装を参考にすると割となんとかなる(可能性が高い)
//   ・置換忘れててmapboxglのままでも動いたりする
// @see https://docs.geolonia.com/
// @see https://docs.mapbox.com/jp/mapbox-gl-js/example/

// 中心地, 拡大率、GeoJSONのurlを設定 (開発用に決め打ち)
// TODO: 最初に現在位置取得から自動で中心位置を設定できるとよい

// MEMO: 開発確認用セットリスト
const place_list = {
  '栃木県佐野市': {
    'coordinates': [139.580, 36.305], // [lng(経度), lat(緯度)]  なので注意
    'zoom': 14,
    'prefix': '09_tochigi',
  },
  '大阪駅周辺': {
    'coordinates': [135.4959506, 34.7024854],
    'zoom': 16,
    'prefix': '27_osaka',
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
    'prefix': '29_nara',
  },
  '宮崎県': {
    'coordinates': [131.4178932, 31.9061487],
    'zoom': 15,
    'prefix': '45_miyazaki',
  },
  '亀戸': {
    'coordinates': [139.8265658, 35.6973225],
    'zoom': 15,
    'prefix': '13_tokyo',
  },
  'まぞくの聖地': {
    'coordinates': [139.4467943, 35.6496139],
    'zoom': 15,
    'prefix': '13_tokyo',
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
// const place = place_list['まぞくの聖地']

// 地図の設定
const map = new geolonia.Map({
  container: '#map',
  center: place.coordinates,
  zoom: place.zoom,
}).addControl(new geolonia.ScaleControl({
  // 左下に地図の縮尺(スケール)を表示
  maxWidth: 200,
  unit: 'metric'
})).addControl(new geolonia.GeolocateControl({
  // 現在地を表示 (Chromeだと範囲が広くて画面が真っ青になるが謎)
  positionOptions: {
    enableHighAccuracy: true
  },
  fitBoundsOptions: {
    linear: true,
    zoom: place.zoom
  },
	trackUserLocation: false,
	showUserLocation: true,
}));

// TODO: ?_debug あたりのQuery Parameterが指定された場合にdebugモードに移行
// _debug/以下のgeojsonを読んでデバッグ用のpopup(情報量が多い)を表示させるなどする
// const popup_htmlの中身組み立てとか変えてやるのでよしなにうーん
const debug = false;
if (location.search === '?_debug') {
  // debugモードを見分けやすいようにMapのスタイルを変更
  // TODO: 変化がわかりづらいのでforkして白黒反転させたダークモードを設定
  console.log('🔧 _debug mode....　')
  const style = 'geolonia/notebook'
  map.setStyle(`https://raw.githubusercontent.com/${style}/master/style.json`)
}


// Marker用アイコンを読み込み(genre[1-10].png)
for (const [key, _] of Object.entries(genres)) {
  map.loadImage(`/img/genre${key}.png`, function (error, res) {
    map.addImage(`icon-image-genre${key}`, res);
  });
}
// 最初使ってた汎用Marker
// map.loadImage('https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png', function (error, res) {
//   map.addImage('icon-image-common', res);
// });

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

// TODO: functionまわりをきちんとする(jsダメな人のクソ実装なおす)
map.on('load', function () {
  const prefix = place.prefix;

  for (const [genre_id, genre_name] of Object.entries(genres)) {
    // FIEME: クラス名とかレイヤ名とかいい加減すぎる
    const layer_id = `layer-${genre_id}`;

    // GeoJSON読み込み
    map.addSource(`datasource-${genre_id}`, {
      type: 'geojson',
      data: `/geojson/geojson/${prefix}/genre${genre_id}.geojson`
    });

    // レイヤー設定
    // MEMO: 1データソース(例: genre=1(居酒屋))と1レイヤー(layer-1)、1アイコンイメージ(./img/genre1.png)が1:1対応
    map.addLayer({
      "id": layer_id,
      "source": `datasource-${genre_id}`,
      "type": "symbol",
      "layout": {
        'visibility': 'none',   // 初期状態ではレイヤを非表示
        // アイコン(Marker)画像
        "icon-image": `icon-image-genre${genre_id}`,
        "icon-allow-overlap": true, // これ入れとかないとlatlngが重なったときにアイコンが確実に上書きされてしまう
        "icon-size": 1,
        // アイコンの下にshop_nameをラベル表示させる(フォント指定まわりドキュメントがあんまない)
        'text-field': "{shop_name}",
        "text-font": ["Noto Sans Regular"], // geoloniaで使えるフォントはローカルに入ってるやつらしい(ほんとか？？？)、とりまNoto Sans...
        'text-radial-offset': 1.8,
        // MEMO: 以下の設定入れとくとテキストラベルが重なったときにラベル位置をMarkerの上下左右に再配置してくれる。
        // 特に本アプリの場合、ジオコーダの解像度が低いのでlatlngが重複してしまう可能性が非常に高いため、必須
        'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
        'text-size': 12
      },
    });

    // 左側に表示されるジャンル別メニューの設定
    // MEMO: 排他制御とかは作り込んでない(あった方がいい気がする)
    // TODO: 全選択/全選択解除ボタンは実際に触ってるとしばしばほしくなる
    const link = document.createElement('a');
    link.href = '#';
    link.id = layer_id;
    link.className = '';
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

  // 初期状態(クソ雑)
  document.getElementById('menu').style.visibility = 'visible';
  document.getElementById('layer-1').click(); // 雑にlayer-1(和食)を選択
  // document.getElementById('layer-10').click(); // 雑その他選択

  // MEMO: メニューの文字数によってメニューの縦幅が変わってしまうのでCSSで決め打ちにしてやる
  // (例: その他とか中華とかは1行なので幅が狭い)
  // メニューの背景色とかもマーカーの色と合わせてやるといい感じなのかもしれない
});

