'use strict';

// 実装時に最低限覚えておくこと
// ・geoloniaはMapBox GL LSを薄くwrapしたものなので、mapboxglをgeoloniaに変えると大抵動く(らしい)
// 　・なんでMapBox GL LSの実装を参考にすると割となんとかなる(可能性が高い)
//   ・置換忘れててmapboxglのままでも動いたりする
// @see https://docs.geolonia.com/
// @see https://docs.mapbox.com/jp/mapbox-gl-js/example/


// 適当に決めた10ジャンル
// MEMO: テキストラベルでちょっと色薄いのがいくつか
//
// 1	居酒屋・ダイニングバー・バル	#FAB462
// 2	和食	#72CB7F
// 3	洋食	#6BA0FF
// 4	中華	#F03800
// 5	麺類	#C7B949
// 6	カレー・アジア・エスニック・各国料理	#E86CFF
// 7	ステーキ・焼き肉/ホルモン	#AB9465
// 8	ファーストフード・ファミレス	#85BECC
// 9	カフェ/スイーツ	#FFA1C4
// 10	その他	#808080
const genres = {
  1: {
    name: '居酒屋・バー・バル',
    color: 'rgba(250,180,98,1)',
  },
  2: {
    name: '和食・寿司',
    color: 'rgba(114,203,127,1)',
  },
  3: {
    name: '洋食',
    color: 'rgba(107,160,255,1)',
  },
  4: {
    name: '中華',
    color: 'rgba(240,56,0,1)',
  },
  5: {
    name: '麺類(+餃子)',
    color: 'rgba(199,185,73,1)',
  },
  6: {
    name: 'カレー・各国料理・創作料理',
    color: 'rgba(232,108,255,1)',
  },
  7: {
    name: 'ステーキ・鉄板焼き・焼肉',
    color: 'rgba(171,148,101,1)',
  },
  8: {
    name: 'ファーストフード・ファミレス・食堂',
    color: 'rgba(133,190,204,1)',
  },
  9: {
    name: 'カフェ・スイーツ',
    color: 'rgba(255,161,196,1)',
  },
  10: {
    name: 'その他',
    color: 'rgba(128,128,128,1)',
  }
}

// @see ISO 3166-2 とか (なんかいいライブラリないですか)
// ライブラリ探して使い方読むよりベタ書きの方が早そうだったので…
// https://so-zou.jp/web-app/tech/data/code/japanese-prefecture.htm#no1
const prefs = {
  "北海道": "hokkaido",
  "青森県": "aomori",
  "岩手県": "iwate",
  "宮城県": "miyagi",
  "秋田県": "akita",
  "山形県": "yamagata",
  "福島県": "fukushima",
  "茨城県": "ibaraki",
  "栃木県": "tochigi",
  "群馬県": "gunma",
  "埼玉県": "saitama",
  "千葉県": "chiba",
  "東京都": "tokyo",
  "神奈川県": "kanagawa",
  "新潟県": "niigata",
  "富山県": "toyama",
  "石川県": "ishikawa",
  "福井県": "fukui",
  "山梨県": "yamanashi",
  "長野県": "nagano",
  "岐阜県": "gifu",
  "静岡県": "shizuoka",
  "愛知県": "aichi",
  "三重県": "mie",
  "滋賀県": "shiga",
  "京都府": "kyoto",
  "大阪府": "osaka",
  "兵庫県": "hyogo",
  "奈良県": "nara",
  "和歌山県": "wakayama",
  "鳥取県": "tottori",
  "島根県": "shimane",
  "岡山県": "okayama",
  "広島県": "hiroshima",
  "山口県": "yamaguchi",
  "徳島県": "tokushima",
  "香川県": "kagawa",
  "愛媛県": "ehime",
  "高知県": "kochi",
  "福岡県": "fukuoka",
  "佐賀県": "saga",
  "長崎県": "nagasaki",
  "熊本県": "kumamoto",
  "大分県": "oita",
  "宮崎県": "miyazaki",
  "鹿児島県": "kagoshima",
  "沖縄県": "okinawa",
}

////////////////////////////////////////////////////////////////////////////////////////////////////
// 地図描画
//   lat, lng = geolonia.Mapの中心地として指定
//   pref_name_ja = 都道府県名(例: 栃木県) => geojsonの格納ディレクトリと対応するので必須
//   debug_mode = _debug/ 以下のgeojsonを見るかどうか(debug用のgeojsonはファイルサイズがでかい)
const draw = (lat, lng, pref_name_ja, debug_mode=false, zoom=15) => {
  console.log('lat: ' + lat)
  console.log('lng: ' + lng)
  console.log('pref_name_ja: ' + pref_name_ja)

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
    // debugモードを見分けやすいようにMapのスタイルを変更
    // const style = 'geolonia/notebook';  // original simple notebook style
    const style = 'terukizm/notebook';  // ダークモード風味
    map.setStyle(`https://raw.githubusercontent.com/${style}/master/style.json`)
  }

  // Marker用アイコン画像を読み込み(genre[1-10].png)
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
  // クリックしたときにPopup()で吹き出しを出す
  // MEMO: 試してないけど各種HTMLタグとかcssとか使えそうな気はする(試してないけど)
  const click_point_function = (e) => {
    console.log(e)
    const coordinates = e.lngLat;

    // @see /geojson/{都道府県名}/xxxxx.geojson
    const props = e.features[0].properties;
    let popup_html = `<strong>店舗名:</strong> ${props.shop_name}<br>`;   // MEMO: 普通にdlとかの方がよくない…？
    popup_html += `<strong>住所:</strong> ${props.address} <br>`;
    popup_html += (props.detail_page ? `<a href="${props.detail_page}" target="_blank">[GoTo詳細ページ]</a><br>` : '');
    popup_html += (props.area_name ? `<strong>エリア</strong>: ${props.area_name} <br>` : '');
    popup_html += `<strong>ジャンル:</strong> ${props.genre_name} <br>`;
    popup_html += (props.closing_day ? `<strong>定休日:</strong> ${props.closing_day} <br>` : '');
    popup_html += (props.opening_hours ? `<strong>営業時間:</strong> ${props.opening_hours} <br>` : '');
    popup_html += (props.tel ? `<strong>電話番号:</strong> ${props.tel} <br>` : '');
    popup_html += (props.offical_page ? `<a href="${props.offical_page}" target="_blank">[公式HP]</a><br>` : '');
    popup_html += `<a href="${props['google_map_url']}" target="_blank">【GoogleMap】</a><br>`;
    // TODO: geojsonで空のデータ項目もキーが出力されている(例: "closing_day": """,)が、
    // データサイズの観点からは空データの場合、キー自体なしの方が適切かもしれない。以下のような書き方しても問題ないので、
    // js側の実装上はどっちでも問題ない。
    popup_html += (props.not_exist_key ? '!!! NOT FOUND !!!!' : '');

    if (debug_mode) {
      // @see /geojson/{都道府県名}/_debug/xxxxx.geojson
      const geometry = e.features[0].geometry;
      popup_html += '<hr><br>';
      popup_html += `lat: ${geometry.coordinates[0]} <br>`;
      popup_html += `lng: ${geometry.coordinates[1]} <br>`;
      popup_html += (props.zip_code ? `zip_code: ${props.zip_code} <br>` : '');
      popup_html += `normalized_address: ${props.normalized_address} <br>`;
      popup_html += `_ジオコーディングの結果スコア: ${props['_dams_score']} <br>`;
      popup_html += `_ジオコーディング結果に紐づく住所情報(name): ${props['_dams_name']} <br>`;
      popup_html += `_ジオコーディングで無視された住所情報(tail): ${props['_dams_tail']} <br>`;
      popup_html += `<a href="${props['_gsi_map_url']}" target="_blank">(国土地理院地図)</a>` + '<br>';
      // MEMO: debugのときはjsonベタ出しでいいんじゃって気もしてきたが、試してみたらURL系が悲惨だった…
      // popup_html += JSON.stringify(props, null, 2)
    }

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

  // map init on loading
  map.on('load', function () {
    // jp => en  (例: "東京都" => "tokyo")
    const prefix = prefs[pref_name_ja];
    document.getElementById('goto_title').innerHTML = `後藤イー太 @ ${pref_name_ja}`;

    // _error.jsonをテキストエリアに適当に出す
    // FIXME: 雑がすぎる
    fetch(`/geojson/${prefix}/_error.json`, {
      method: "GET",
    }).then(response => response.json())
    .then(json => {
      document.getElementById('error_json_duplicated').value = JSON.stringify(json.duplicated, null, 2);
      document.getElementById('error_json_error').value = JSON.stringify(json.error, null, 2);
      // MEMO: 重複エラー(duplicated)とその他のエラー(NormalizeError, GeoCodeError, ZipCodeなんちゃら)とかを分けてもよい
      // あとは別に全部出す必要ない気もする
      // TODO: 重複エラーもその他エラーもない場合、_error.jsonは生成されないので404だったときの対応を入れる
    });

    for (const [genre_id, genre] of Object.entries(genres)) {
      // FIEME: クラス名とかレイヤ名とかいい加減すぎる
      const layer_id = `layer-${genre_id}`;

      // GeoJSON読み込み
      const debug_dir = debug_mode ? '_debug/' : ''
      // MEMO: 定期的にcrawlerで自動生成してgithub上に置いてあるやつから見る場合
      // const gjson = `https://raw.githubusercontent.com/terukizm/goto-eater-data/main/output/${prefix}/${debug_dir}genre${genre_id}.geojson`
      // MEMO: 直置きしてある/geojson/tokyo とかを見る場合
      const gjson = `/geojson/${prefix}/${debug_dir}genre${genre_id}.geojson`;

      // TODO: 対応するジャンルコードのGeoJSONがない場合がある。(例: 静岡はジャンル6(各国料理)がない。カレーとかはその他扱いになってる)
      // そういった場合はどうしたもんか…
      // 案1: 事前にHEADリクエストとかで存在確認(20x)しておく -> だるない？？？
      // 案2: GeoJSON作るときに空ファイル作っておく
      // 前者はデータがないジャンル(layer)はdisabledにするとかの対応がしやすい。後者は実装が楽。
      // 前者を試してみて、ローディングに時間かかりそうなら後者でいくか…？ (でもUI側の細かいことをやりたくない…)

      map.addSource(`datasource-${genre_id}`, {
        type: 'geojson',
        data: gjson
      });

      // レイヤー設定
      // MEMO: 以下を1:1:1対応   例: genre=1 (居酒屋)
      // * 1データソース("datasource-1")
      // * 1レイヤー("layer-1")
      // * 1アイコンイメージ("./img/genre1.png")
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
          'text-size': 12,
          'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
          // MEMO: text-variable-anchorを入れとくとテキストラベルが重なったときにラベル位置をMarkerの上下左右に再配置してくれる
          // 特に本システムのDAMSを使ったlatlngの場合、ジオコーダの解像度が低くlatlngが重複してしまう可能性が非常に高いため、必須
        },
        "paint": {
          // (店名を表示している)ラベルテキスト関係の設定
          "text-color": `${genre.color}`,             // 左袖メニューの背景色(アイコンカラー)とを色を合わせた
          "text-halo-color": "rgba(255,255,255,1)",   // ラベルテキストの縁取り色
          "text-halo-width": 2,                       // ラベルテキストの縁取り幅
          // MEMO: アイコン描画での縁取り色指定
          // カスタムアイコンを利用している場合は効かないっぽい、png側で背景色つけてやるのが良さそう(やるなら)
          // "icon-color": "rgba(0,0,0,1)",
          // "icon-halo-color": "rgba(255,255,255,1)",
          // "icon-halo-width": 1,
        }
      });

      // 左袖に表示されるジャンル別メニューの設定
      // TODO: 全選択/全選択解除ボタンは実際に触ってるとほしくなる
      const link = document.createElement('a');
      link.href = '#';
      link.id = layer_id;
      // link.className = '';
      link.textContent = genre.name;
      link.onclick = function (e) {
        const clickedLayer = layer_id;
        e.preventDefault();
        e.stopPropagation();

        if (map.getLayoutProperty(clickedLayer, 'visibility') === 'visible') {
          map.setLayoutProperty(clickedLayer, 'visibility', 'none');
          link.style.cssText = `background: #ffffff`;
          // this.className = '';
          // MEMO: a:hovar が効かなくなってる(style上書きすりゃそりゃね…)、だるい…
          // css側に各textcolorを持っていけばまあできるけど…　めんどい…
        } else {
          link.style.cssText = `background: ${genre.color}`;
          // this.className = 'active';
          map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
        }
      };
      document.getElementById('menu').appendChild(link);

      // 各種イベントを設定
      map.on('click', layer_id, click_point_function);
      map.on('mouseenter', layer_id, mouse_enter_function);
      map.on('mouseleave', layer_id, mouse_leave_function);
    }

    // 初期選択状態の設定(雑)
    document.getElementById('menu').style.visibility = 'visible';
    document.getElementById('layer-1').click();     // 雑にlayer-1(居酒屋)を選択
    // document.getElementById('layer-10').click(); // 雑にlayer-10(その他)を選択
  });
}

////////////////////////////////////////////////////////////////////////////////////////////////////
// 1. 地名を指定(?place=地名)

// MEMO: CommunityGeoCoderのgetLatLng()のモック
// const getLatLng = (arg1, _callback) => {
//   return _callback({addr: "栃木県のどっか(ダミー)", lat: "36.303", lng: "139.588", code: "09204"});
// }

// getLatLngで取ったジオコーディング結果から、lat, lng, pref_name_jaを取って地図描画
// @see https://github.com/geolonia/community-geocoder#getlatlngaddress-callback-errorcallback
const callback_func = (res) => {
  console.log(res)
  const pref_name_ja = res.addr.match(/^(.{2,3}[都道府県]).*$/)[1];
  draw(res.lat, res.lng, pref_name_ja);
}
const error_callback_func = (err) => {
  console.log(err)
  // TODO: エラー処理
}

// MEMO: Community GeoCoderの挙動として、一般的な駅名とかに紐づくデータが入っていないので
// 例えば「錦糸町」のように入力しても結果が帰ってこない。住所を入れてやらないとダメ。
// @see https://community-geocoder.geolonia.com/#12/35.68124/139.76713

////////////////////////////////////////////////////////////////////////////////////////////////////
// 2. 現在地から取る場合(?placeが未指定の場合)

const this_place_function = (lat, lng) => {
  // TODO: XHRで時間がかかるからmap描画のdivのあたりに適当にloading...みたいなの入れてやるとやさしみがある

  // 農研APIを叩く(めんどいときはMock使っても良い)
  // const endpoint = "/mock/dummy_okinawa.json"
  const endpoint = `https://aginfo.cgk.affrc.go.jp/ws/rgeocode.php?json&lat=${lat}&lon=${lng}`
  fetch(endpoint, {
    method: "GET",
  }).then(response => response.json())
  .then(json => {
    draw(json.result.local[0].latitude, json.result.local[0].longitude, json.result.prefecture.pname);
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

// QueryParameter取得による動作モード指定
const main = () => {
  const params = new URLSearchParams(window.location.search);
  // ?_debug(?debug) があれば debug_mode === true (自分でも間違えるからエイリアス張ってる)
  const debug = (params.has('_debug') || params.has('debug'))
  const place = params.get('place')       // ?place=佐野市
  const mode0 = params.has('mode0')       // ?mode0 があればハードコーディングした値で描写(動作確認用)
  console.log('debug_mode=' + debug);
  console.log('place=' + place);

  // 0. lat, lng, pref_name_jaのハードコーディング(主に地図描画確認用)
  // ?place=　実装したからあんまり使わないかも
  if (mode0) {
    console.log('MODE ZERO');
    // 佐野市
    draw(36.305, 139.580, '栃木県', true);
    // MEMO: こういう書き方js(ES？)なかったっけ…
    // 亀戸
    // draw(lat=35.6973225, lng=139.8265658, pref_name_ja='東京都', debug_mode);
    return
  }

  // FIXME: debugモード指定が引き渡ってないよ (実装が悪いんだよ)
  if (place) {
    // 1. 地名指定で取る場合(?place={住所} が指定されている)
    // @see https://github.com/geolonia/community-geocoder#getlatlngaddress-callback-errorcallback
    getLatLng(place, callback_func, error_callback_func);
    // TODO: ジオコーディングに失敗した場合(例: "?place=聖蹟桜ヶ丘")のエラーハンドリング
    // MEMO: 「聖蹟桜ヶ丘」は住所としては存在してないのでジオコーディングで取れない(駅名だから)
  } else {
    // 2. 現在地から取る場合(?placeが未指定)
    navigator.geolocation.getCurrentPosition(current_geolocation_success, current_geolocation_error);
  }
}

main();
