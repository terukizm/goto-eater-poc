// 実装時に最低限覚えておくこと
// ・geoloniaはMapBox GL LSを薄くwrapしたものなので、mapboxglをgeoloniaに変えると大抵動く(らしい)
// 　・なんでMapBox GL LSの実装を参考にすると割となんとかなる(可能性が高い)
//   ・置換忘れててmapboxglのままでも動いたりする
// @see https://docs.geolonia.com/
// @see https://docs.mapbox.com/jp/mapbox-gl-js/example/

// 適当に決めた10ジャンル
const genres = {
  1: '居酒屋・バー・バル',
  2: '和食・寿司',
  3: '洋食・フレンチ・イタリアン',
  4: '中華',
  5: '麺類・餃子・丼物',
  6: 'カレー・各国料理・創作料理',
  7: 'ステーキ・鉄板焼き・焼肉',
  8: 'ファーストフード・ファミレス・食堂',
  9: 'カフェ・スイーツ',
  10: 'その他',
}


////////////////////////////////////////////////////////////////////////////////////////////////////
// main関数
//   lat, lng = geolonia.Mapの中心地として指定
//   pref_name = geojsonのディレクトリのprefix (都道府県名)
//   debug_mode = _debug/ 以下のgeojsonを見るかどうか(debug用のgeojsonはファイルサイズがでかい)
const main = (lat, lng, pref_name, debug_mode=false, zoom=15) => {
  console.log('target pref is ' + pref_name)

  // 地図の設定
  const map = new geolonia.Map({
    container: '#map',
    center: [lng, lat],
    zoom: zoom,
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
      zoom: zoom
    },
    trackUserLocation: false,
    showUserLocation: true,
  }));

  // TODO: ?_debug あたりのQuery Parameterが指定された場合にdebugモードに移行
  // _debug/以下のgeojsonを読んでデバッグ用のpopup(情報量が多い)を表示させるなどする
  // const popup_htmlの中身組み立てとか変えてやるのでよしなにうーんだるい
  if (debug_mode) {
    console.log('debug mode on')
    // debugモードを見分けやすいようにMapのスタイルを変更
    // const style = 'geolonia/notebook';  // original simple notebook style
    const style = 'terukizm/notebook';
    map.setStyle(`https://raw.githubusercontent.com/${style}/master/style.json`)
  }

  // Marker用アイコンを読み込み(genre[1-10].png)
  for (const [key, _] of Object.entries(genres)) {
    map.loadImage(`/img/genre${key}.png`, function (error, res) {
      map.addImage(`icon-image-genre${key}`, res);
    });
  }

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
  // ここのfunctionが遅延で実行されるのがよくわからん....
  // アロー関数突っ込んだら先に動いてしまってこける

  // on load
  map.on('load', function () {
    const prefix = pref_name;

    for (const [genre_id, genre_name] of Object.entries(genres)) {
      // FIEME: クラス名とかレイヤ名とかいい加減すぎる
      const layer_id = `layer-${genre_id}`;

      // GeoJSON読み込み
      const gjson = debug_mode ? `/geojson/geojson/${prefix}/_debug/genre${genre_id}.geojson` : `/geojson/geojson/${prefix}/genre${genre_id}.geojson`;
      // console.log(gjson);

      map.addSource(`datasource-${genre_id}`, {
        type: 'geojson',
        data: gjson
      });

      // レイヤー設定
      // MEMO: 以下を1:1:1対応     例: genre=1 (居酒屋)
      // * 1データソース(datasource-1)
      // * 1レイヤー(layer-1)
      // * 1アイコンイメージ(./img/genre1.png)
      map.addLayer({
        "id": layer_id,
        "source": `datasource-${genre_id}`,
        "type": "symbol",
        "layout": {
          'visibility': 'none',   // 初期状態ではレイヤを非表示
          // アイコン画像(Marker画像)
          "icon-image": `icon-image-genre${genre_id}`,
          "icon-allow-overlap": true, // これ入れとかないとlatlngが重なったときにアイコンが確実に上書きされてしまう
          "icon-size": 1.0,
          // アイコンの下にshop_nameをラベル表示させる(フォント指定まわりドキュメントがあんまない)
          'text-field': "{shop_name}",
          "text-font": ["Noto Sans Regular"], // geoloniaで使えるフォントはローカルに入ってるやつらしい(ほんとか？？？)、とりまNoto Sans...
          'text-radial-offset': 1.8,
          // MEMO: 以下の設定入れとくとテキストラベルが重なったときにラベル位置をMarkerの上下左右に再配置してくれる。
          // 特にGeoJSONをDAMSを使って作る場合、ジオコーダの解像度が低いのでlatlngが重複してしまう可能性が非常に高いため、必須
          'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
          'text-size': 12
        },
        "paint": {
          // 文字ラベル
          "text-color": "rgba(255,0,0,1)",  // TODO: アイコンカラーと合わせてあげるとおしゃれかも
          "text-halo-color": "rgba(255,255,255,1)",
          "text-halo-width": 1
          // MEMO: カスタムアイコンを利用している場合は効かないっぽい、png側で背景色つけてやるのが良さそう(やるなら)
          // "icon-color": "rgba(0,0,0,1)",
          // "icon-halo-color": "rgba(255,255,255,1)",
          // "icon-halo-width": 1,
        }
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

        if (map.getLayoutProperty(clickedLayer, 'visibility') === 'visible') {
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
    document.getElementById('layer-1').click();     // 雑にlayer-1(居酒屋)を選択
    // document.getElementById('layer-10').click(); // 雑にlayer-10(その他)を選択

    // MEMO:
    // メニューの背景色とかもマーカーの色と合わせてやるといい感じなのかもしれない
  });
}

////////////////////////////////////////////////////////////////////////////////////////////////////
// 1. 地名を指定(?place=地名)

// Mock: CommuniyGeoCoderのgetLatLng
// const getLatLng = (arg1, _callback) => {
//   return _callback({addr: "栃木県のどっか(ダミー)", lat: "36.303", lng: "139.588", code: "09204"});
// }

// getLatLngで取ったジオコーディング結果から、lat, lng, pref_nameを取って地図描画
const callback_func = (res) => {
  console.log(res)
  const pref_name = res.addr.match(/^(.{2,3}[都道府県]).*$/)[1];
  main(lat=res.lat, lng=res.lng, pref_name, debug_mode=false);
}


////////////////////////////////////////////////////////////////////////////////////////////////////
// 2. 現在地から取る場合(?placeが未指定)

const this_place_function = (lat, lng) => {
  // TODO: XHRで時間がかかるからmap描画のあたりを適当にloadingみたいなの入れてやると親切味がある

  // 農研APIを叩く(めんどいからMockにしてある)
  // $ curl -sS "https://aginfo.cgk.affrc.go.jp/ws/rgeocode.php?json&lat=36.305&lon=139.580"
  fetch("/mock/dummy.json", {
    method: "GET",
  }).then(response => response.json())
  .then(json => {
    const pref_name = json.result.prefecture.pname;
    console.log(pref_name);
    main(lat, lng, pref_name, debug_mode=false);
  });
}

// ブラウザから現在地のlatlngを取るやつ
const current_geolocation_success = (res) => {
  console.log(res);
  this_place_function(res.coords.latitude, res.coords.longitude);
}
const current_geolocation_error = (err) => {
  console.log(err);
}

////////////////////////////////////////////////////////////////////////////////////////////////////

// QueryParameter取得からの動作モード指定
// TODO: 本当はこっちがmain()...
const init = () => {
  const params = new URLSearchParams(window.location.search);
  const mode0 = params.has('mode0')       // ?mode0 があればハードコーディングした値で描写(動作確認用)
  const debug_mode = params.has('_debug') || params.has('debug')  // ?_debug があれば debug_mode === true
  const place = params.get('place')       // ?place=佐野市
  console.log('debug_mode=' + debug_mode);
  console.log('place=' + place);

  // 0. lat, lng, pref_nameのハードコーディング
  // 現在地のlat, lngを偽装するのもだるかろうという感じのもの(主に地図描画確認用)
  if (mode0) {
    console.log('MODE ZERO');
    // 佐野市
    main(lat=36.305, lng=139.580, pref_name='栃木県', debug_mode);
    // 亀戸
    // main(lat=35.6973225, lng=139.8265658, pref_name='東京都', debug_mode);

    return
  }

  // TODO: debugモード指定とか引き渡ってないよ
  if (place) {
    // 1. 地名指定で取る場合(?place=地名)
    // @see https://github.com/geolonia/community-geocoder#getlatlngaddress-callback-errorcallback
    getLatLng(place, callback_func);
    // TODO: ジオコーディングに失敗した場合のエラーハンドリング
  } else {
    // 2. 現在地から取る場合(?placeが未指定)
    navigator.geolocation.getCurrentPosition(current_geolocation_success, current_geolocation_error);
  }
}

init();


// latlngの値のメモ
// const place_list = {
//   '大阪駅周辺': {
//     'coordinates': [135.4959506, 34.7024854],
//     'zoom': 16,
//     'prefix': '27_osaka',
//   },
//   '山梨県甲府市': {
//     'coordinates': [138.5687848, 35.666674],
//     'zoom': 16,
//   },
//   '埼玉県草加市': {
//     'coordinates': [139.777649, 35.812065],
//     'zoom': 14,
//   },
//   '群馬県高崎駅周辺': {
//     'coordinates': [139.0126623, 36.3228267],
//     'zoom': 14,
//   },
//   '奈良県曽爾村': {
//     'coordinates': [136.1092048, 34.4905156],
//     'zoom': 12,
//     'prefix': '29_nara',
//   },
//   '宮崎県': {
//     'coordinates': [131.4178932, 31.9061487],
//     'zoom': 15,
//     'prefix': '45_miyazaki',
//   },
//   'まぞくの聖地': {
//     'coordinates': [139.4467943, 35.6496139],
//     'zoom': 15,
//     'prefix': '13_tokyo',
//   },
// };
