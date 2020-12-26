'use strict';

// FIXME: let -> const  (東京都だけ例外的にローカルのGeoJSONから読んでる)
let _USE_LOCAL_GEOJSON = false

// DOING
// - [ ] 現在のコロナ状況下で「GoTo商品券ご利用をご遠慮ください」になってる自治体も増えてきてるので、公式サイトの情報をあわせて見れるようにしたい
//   - [ ] また47都道府県分のクローラ書くのか…という気持ちになっています…

// 実装内容
// - とりあえずGeolonia Mapでの動作確認
//   - カスタムマーカー表示
//   - ジャンル別表示
//   - データ量32k件くらいの東京できちんと動くこと
// - オプション
//   - デバッグモード
//   - (ジオコーディング時の)エラー情報表示(from _error.json)
//   - 指定した住所を表示
//   - 全選択/全選択解除


// 助けてほしいこと
// - [ ] ジャンル情報がない都道府県(青森県とか)があり、そういうとこを選ぶとgenre10.geojson以外のもの、genre[1-9].geojson がないので404が出る
//   - XHRのheadリクエストでベタに事前確認したら普通に遅くてアホだったが、良い実装が浮かばない
//   - できたらconsoleに404が出ちゃうのも避けられれば嬉しい (一応ジャンルがないのも正常ケースなので)
// - [ ] ポップアップからdebugモードへの移行リンク踏んだときの挙動が気になる
// 　・「マーカーの位置がおかしい場合、デバッグモードで表示して詳細を確認し、必要ならGitHubにIssueを投げる」という挙動を想定
//     ・デバッグモード用のGeoJSONは詳細情報とprettyしてあるせいでファイルサイズがでかいので、常用しない方針
//　　　・現状ではデバッグモードに移行したときにポップアップの表示状態と、左袖メニューの選択状態が初期化されちゃうので、どの店を選んでたかわかりにくい
//     　・今んとこlatlng指定とzoom指定で誤魔化してるが、特に密集地だとあんま意味がない
//       ・左袖の選択状態が吹っ飛ぶのも地味に痛い
//     ・左袖サブメニューの選択状態はQueryParameterとかCookieとか色々考えられるが、ポップアップについてはお手上げという感じ
// 　　　・ latlngとか'layer-[1-10]'とかは取れるが、そこからMarkerにclickイベントを渡す…みたいな感じになってくるとちょっと…
// - [ ] Community Geocoderのscript読み込み(CDN経由)のloadに3〜5secくらいかかっていて、どうしても遅い
//   - これ自体はnpmライブラリがあり、webpackやらで組み込む形にして入れられるので、そうすりゃ初期ロードは少しはマシになる(???)のかなと思っている
//     - @see https://github.com/geolonia/community-geocoder
//   - 上記に合わせて作り変えるときになんかこう全体的に、もう少しマシになるようなアドバイスがあれば…
//     - 特にQueryParameter関係がだるい
//     - (状態遷移を嫌ってQuery Parameterに寄せるサーバサイドライクな作りが、根本的に悪いのかもしれないが) なんかいい方法ないすか…
// - [ ] jsからDOM要素をこねこねして生成してるところがとにかくだるいので、もうすこしシュッとした書き方ないですか…

// そもそもわかってない基本的なこと (この辺は気が向いたらでいいです)
// ・jsで一般的な読みやすいメソッドの並べ方、書き方
// 　・動くっちゃ動くけどたぶん読みづらいのでどうしたもんか
//   　・ネストが深くなるのきらい
// ・draw()が長い、ただここで使ってるmap変数をどうしたらいいかわからん
// 　・普通にjs以外の言語で書くならmap変数をメンバ変数にしてClassとか使うんだけど、このご時世どうすべきなん？
// 　　・アロー関数ベースでゴリゴリ書いていくのでいいの？　なんもわからん…
// ・そもそもmap.on('click')とかの他ライブラリが使ってる、コールバック関数渡す系のメソッドやつで、コールバック関数に対して
//  　引数が渡せるのかがよくわかってない、jsを雰囲気で書いている
// ・変数名とかメソッド名の一般的な書式 is 何… (一応メソッド名はcamelCase、変数名はsnake_caseに寄せています)
// ・jsファイル分けたほうがいい？(定数くらいは分けようかなくらいではいます)

// 気力がなくてPENDING:
// - [pass] 「_error.json」をなんか、もう少しまともに表示…
//   - とりまtextareaに出せるようにしただけ…
// - [pass] ジャンルの全選択ボタンのUI的な作り込みとか
//   - 気力が… (もう動けばいいじゃんくらいになっている)
// - [pass] スマホでみたときどんな感じかチェック
//   - Android系端末がお手元にない

////////////////////////////////////////////////////////////////////////////////////////////////////
// 定数

// アイコンカラーと、左袖メニューの背景色と、店名のラベルテキストで色を合わせている
// MEMO: 地図の背景色を考えるとテキストラベルで出すにはちょっと色薄い？かもしれないのがいくつかある(アイコン画像を再作成しないといけないのでサボってる)
// https://github.com/gka/chroma.js とか https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/insertRule とか使って
// 動的にa:hoverしたときの色とかCSSに追加しようとしたけどうまくいかず、だるくなってstyle.cssにベタ書きした
const GENRES = {
  1: {
    name: '居酒屋・バー・バル',
    color: 'rgba(250,180,98,1)', // #FAB462
  },
  2: {
    name: '和食・寿司',
    color: 'rgba(114,203,127,1)', // #72CB7F
  },
  3: {
    name: '洋食',
    color: 'rgba(107,160,255,1)', // #6BA0FF
  },
  4: {
    name: '中華',
    color: 'rgba(240,56,0,1)', // #F03800
  },
  5: {
    name: '麺類(ラーメン、そば、うどん)',
    color: 'rgba(199,185,73,1)', // #C7B949
  },
  6: {
    name: 'カレー・各国料理・創作料理',
    color: 'rgba(232,108,255,1)', // #E86CFF
  },
  7: {
    name: 'ステーキ・鉄板焼き・焼肉',
    color: 'rgba(171,148,101,1)', // #AB9465
  },
  8: {
    name: 'ファーストフード・ファミレス・食堂',
    color: 'rgba(133,190,204,1)', // #85BECC
  },
  9: {
    name: 'カフェ・スイーツ',
    color: 'rgba(255,161,196,1)', // #FFA1C4
  },
  10: {
    name: 'その他',
    color: 'rgba(128,128,128,1)', // #808080
  }
}

// 都道府県名を英名に変換するのと、GoToEat公式サイト関係の情報を表示するためのやつ
// ISO 3166-2 とか関係のライブラリ探して使い方読むよりベタ書きの方が早そうだったので、力技…
// もしこの手の和名->英名変換でなんかいいライブラリとかあったら教えて下さい…
// @see https://so-zou.jp/web-app/tech/data/code/japanese-prefecture.htm#no1
const PREFS = {
  "北海道": {
    en: "hokkaido",
    offical_page: "https://gotoeat-hokkaido.jp/",
    info_page: "https://gotoeat-hokkaido.jp/news_list.html",
  },
  "青森県": {
    // お問い合わせあり
    en: "aomori",
    offical_page: "https://premium-gift.jp/aomori",
    info_page: "https://premium-gift.jp/aomori/news",
  },
  "岩手県": {
    en: "iwate",
    offical_page: "https://www.iwate-gotoeat.jp/",
    info_page: "https://www.iwate-gotoeat.jp/topics/index.html",
  },
  "宮城県": {
    en: "miyagi",
    offical_page: "https://gte-miyagi.jp/",
  },
  "秋田県": {
    // お問い合わせあり
    en: "akita",
    offical_page: "https://gotoeat-akita.com/",
  },
  "山形県": {
    en: "yamagata",
    offical_page: "https://yamagata-gotoeat.com/",
    info_page: "https://yamagata-gotoeat.com/news/",
  },
  "福島県": {
    en: "fukushima",
    offical_page: "https://gotoeat-fukushima.jp/",
    info_page: "https://gotoeat-fukushima.jp/news/",
  },
  "茨城県": {
    en: "ibaraki",
    offical_page: "https://www.gotoeat-ibaraki.com/",
    info_page: "https://www.gotoeat-ibaraki.com/%E3%83%8B%E3%83%A5%E3%83%BC%E3%82%B9-%E3%81%8A%E7%9F%A5%E3%82%89%E3%81%9B%E4%B8%80%E8%A6%A7",
  },
  "栃木県": {
    // お問い合わせあり
    en: "tochigi",
    offical_page: "https://www.gotoeat-tochigi.jp/",
    info_page: "https://www.gotoeat-tochigi.jp/topics/index.php",
  },
  "群馬県": {
    en: "gunma",
    offical_page: "https://gunma-gotoeat-campaign.com/",
    info_page: "https://gunma-gotoeat-campaign.com/user_topics/",
  },
  "埼玉県": {
    en: "saitama",
    offical_page: "https://saitama-goto-eat.com/",
  },
  "千葉県": {
    en: "chiba",
    offical_page: "https://www.chiba-gte.jp/user/",
  },
  "東京都": {
    en: "tokyo",
    offical_page: "https://r.gnavi.co.jp/plan/campaign/gotoeat-tokyo/",
    info_page: "https://r.gnavi.co.jp/plan/campaign/gotoeat-tokyo/news/?tab=customer&sc_lid=gtetokyo_top_news_all",
  },
  "神奈川県": {
    en: "kanagawa",
    offical_page: "https://www.kanagawa-gte.jp/user/",
  },
  "新潟県": {
    en: "niigata",
    offical_page: "https://niigata-gte.com/",
    info_page: "https://niigata-gte.com/news/",
  },
  "富山県": {
    en: "toyama",
    offical_page: "https://www.toyamagotoeat.jp/",
    info_page: "",
  },
  "石川県": {
    en: "ishikawa",
    offical_page: "https://ishikawa-gotoeat-cpn.com/",
    info_page: "https://www.toyamagotoeat.jp/news/",
  },
  "福井県": {
    en: "fukui",
    offical_page: "https://gotoeat-fukui.com/",
  },
  "山梨県": {
    en: "yamanashi",
    offical_page: "https://www.gotoeat-yamanashi.jp/",
    info_page: "https://www.gotoeat-yamanashi.jp/news",
  },
  "長野県": {
    // お問い合わせあり
    en: "nagano",
    offical_page: "https://shinshu-gotoeat.com/",
    info_page: "https://shinshu-gotoeat.com/news_list.php",
  },
  "岐阜県": {
    en: "gifu",
    offical_page: "https://www.gotoeat-gifu.jp/",
    info_page: "https://www.gotoeat-gifu.jp/news/",
  },
  "静岡県": {
    // お問い合わせあり
    en: "shizuoka",
    offical_page: "https://gotoeat.s-reserve.com/",
    info_page: "https://premium-gift.jp/fujinokunigotoeat/news",
  },
  "愛知県": {
    // お問い合わせあり
    en: "aichi",
    offical_page: "https://www.gotoeat-aichi.jp/",
    info_page: "https://www.gotoeat-aichi.jp/news/category/user/",
  },
  "三重県": {
    en: "mie",
    offical_page: "https://gotoeat-mie.com/",
    info_page: "https://gotoeat-mie.com/news/",
  },
  "滋賀県": {
    en: "shiga",
    offical_page: "https://www.shiga-gte.jp/user/",
  },
  "京都府": {
    // お問い合わせあり
    en: "kyoto",
    offical_page: "https://kyoto-gotoeat.com/",
    info_page: "https://premium-gift.jp/kyoto-eat/news",
  },
  "大阪府": {
    en: "osaka",
    offical_page: "https://goto-eat.weare.osaka-info.jp/",
  },
  "兵庫県": {
    en: "hyogo",
    offical_page: "https://gotoeat-hyogo.com/",
  },
  "奈良県": {
    // お問い合わせあり
    en: "nara",
    offical_page: "https://tinyurl.com/yx8ocwwc",
    info_page: "",
  },
  "和歌山県": {
    en: "wakayama",
    offical_page: "https://gotoeat-wakayama.com/",
    info_page: "",
  },
  "鳥取県": {
    en: "tottori",
    offical_page: "https://tottori-gotoeat.jp/",
    info_page: "https://tottori-gotoeat.jp/category/news/",
  },
  "島根県": {
    en: "shimane",
    offical_page: "https://www.gotoeat-shimane.jp/",
    info_page: "https://www.gotoeat-shimane.jp/news/",
  },
  "岡山県": {
    en: "okayama",
    offical_page: "https://www.gotoeat-okayama.com/",
  },
  "広島県": {
    en: "hiroshima",
    offical_page: "https://gotoeat.hiroshima.jp/",
  },
  "山口県": {
    // お問い合わせあり
    en: "yamaguchi",
    offical_page: "https://gotoeat-yamaguchi.com/",
  },
  "徳島県": {
    en: "tokushima",
    offical_page: "https://gotoeat.tokushima.jp/",
  },
  "香川県": {
    en: "kagawa",
    offical_page: "https://www.kagawa-gotoeat.com/",
    info_page: "https://www.kagawa-gotoeat.com/category/news/",
  },
  "愛媛県": {
    // お問い合わせあり
    en: "ehime",
    offical_page: "https://www.goto-eat-ehime.com/",
    info_page: "https://www.goto-eat-ehime.com/news/",
  },
  "高知県": {
    en: "kochi",
    offical_page: "https://www.gotoeat-kochi.com/",
  },
  "福岡県": {
    en: "fukuoka",
    offical_page: "https://gotoeat-fukuoka.jp/",
    info_page: "https://gotoeat-fukuoka.jp/news/",
  },
  "佐賀県": {
    en: "saga",
    offical_page: "https://www.gotoeat-saga.jp/",
    info_page: "https://www.gotoeat-saga.jp/news/",
  },
  "長崎県": {
    en: "nagasaki",
    offical_page: "https://www.gotoeat-nagasaki.jp/",
    info_page: "https://www.gotoeat-nagasaki.jp/news/",
  },
  "熊本県": {
    en: "kumamoto",
    offical_page: "https://gotoeat-kumamoto.jp/",
    info_page: "https://gotoeat-kumamoto.jp/news",
  },
  "大分県": {
    // お問い合わせあり
    en: "oita",
    offical_page: "https://oita-gotoeat.com/",
  },
  "宮崎県": {
    // お問い合わせあり
    en: "miyazaki",
    offical_page: "https://premium-gift.jp/gotoeatmiyazaki/",
    info_page: "https://premium-gift.jp/gotoeatmiyazaki/news",
  },
  "鹿児島県": {
    en: "kagoshima",
    offical_page: "http://www.kagoshima-cci.or.jp/?p=20375",
    info_page: "http://www.kagoshima-cci.or.jp/",
  },
  "沖縄県": {
    en: "okinawa",
    offical_page: "https://gotoeat.okinawa.jp/",
    info_page: "https://gotoeat.okinawa.jp/news/",
  }
}

/* 各種デフォルト値 */
const DEFAULT_ZOOM = 15
const DEFAULT_PLACE = '栃木県佐野市'

////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * main()
 */
const main = () => {
  // Query Parameterから動作モードを取得
  const params = new URLSearchParams(window.location.search);

  const lat = parseFloat(params.get('lat')) // TODO: 本当はバリデーションとかすべき
  const lng = parseFloat(params.get('lng')) // TODO: 本当はバリデーションとかすべき
  const place = params.get('place') // 例: ?place=佐野市 (都道府県はなくてもOK)
  const zoom = params.get('zoom') || DEFAULT_ZOOM // 地図の拡大率
  const debug = params.has('debug') // デバッグモード
  console.log(`debug=${debug} place=${place} zoom=${zoom}`);

  // 住所の入力フォームとかのとこ
  addressInputComponent(params);

  // 1. latlng指定(?lat=36.307&lng=139.564)
  // (基本的にはそんな使わないが、debugモードへの移行リンクで使う)
  if (0 < lat && 0 < lng) {
    // 農研APIを叩いて、リバースジオコーディングで指定されたlatlngからpref_name_jaを取得
    // TODO: 3.のパターンでも同じ農研APIを叩いてるので、本当はひとつにまとめたい
    fetch(`https://aginfo.cgk.affrc.go.jp/ws/rgeocode.php?json&lat=${lat}&lon=${lng}`, {
        method: "GET",
      })
      .then(response => response.json())
      .then(json => {
        const lat = json.result.local[0].latitude
        const lng = json.result.local[0].longitude
        const pref_name_ja = json.result.prefecture.pname
        draw(lat, lng, pref_name_ja, debug, zoom);
      });
    return
  }

  // 2. 住所名を指定して都道府県名を取得(?place={住所})
  if (place) {
    const geocoder_success_callback = (res) => {
      console.log(res)
      // 住所名から都道府県名を取得するため、ジオコーディングを通す
      // MEMO: 同名の自治体(例: 府中市@東京都/広島県)がありえるが、その場合はジオコーダがエラーを返すので考慮しなくてよい
      const pref_name_ja = res.addr.match(/^(.{2,3}[都道府県]).*$/)[1];
      draw(res.lat, res.lng, pref_name_ja, debug, zoom);
    }
    const geocoder_error_callback = (err) => {
      // ジオコーディングに失敗した場合のエラーハンドリング(例: "?place=聖蹟桜ヶ丘")
      // MEMO: 「聖蹟桜ヶ丘」は住所として存在していない(駅名であって住所中には存在しない)ので、community-geocoderでは取れない
      // 他にも「東京スカイツリー」のようなスポット名にも対応していない。本当に住所からしか取れない。「錦糸町」なんかも住所には入ってないらしくダメ。
      console.log(err)
      alert(`入力された「${place}」に相当する住所が見つかりませんでした。他の形式で、再度入力してみてください。`)
    }

    // community-geocoderを叩いて、ジオコーディングで指定された住所から都道府県名を取得
    // @see https://github.com/geolonia/community-geocoder#getlatlngaddress-callback-errorcallback
    getLatLng(place, geocoder_success_callback, geocoder_error_callback);
    return
  }

  // 3. 現在地から都道府県名を取得(?placeと、?latlngがともに未指定)
  {
    const success_callback = (res) => {
      console.log(res);
      // 農研APIを叩いて、リバースジオコーディングで現在位置からpref_name_jaを取得
      // TODO: XHRで時間がかかるからmap描画スペースのあたりに適当にloading...みたいなの入れてやるとやさしみがある
      fetch(`https://aginfo.cgk.affrc.go.jp/ws/rgeocode.php?json&lat=${res.coords.latitude}&lon=${res.coords.longitude}`, {
          method: "GET",
        })
        .then(response => response.json())
        .then(json => {
          const lat = json.result.local[0].latitude
          const lng = json.result.local[0].longitude
          const pref_name_ja = json.result.prefecture.pname
          draw(lat, lng, pref_name_ja, debug, zoom);
        });
    }
    const error_callback = (err) => {
      alert('位置情報が取得できませんでした。ブラウザのなんかを有効にしてください。')
      console.log(err);
    }
    // @see https://developer.mozilla.org/ja/docs/Web/API/Geolocation/getCurrentPosition
    navigator.geolocation.getCurrentPosition(success_callback, error_callback);
  }
}

///////////////////////////////////////////////////////////////////////////
// 地図関係の実装時に最低限覚えておくこと
// ・geoloniaはMapBox GL LSを薄くwrapしたものなので、mapboxglをgeoloniaに変えると大抵動く(らしい)
// 　・なんでMapBox GL LSの実装を参考にすると割となんとかなる(可能性が高い)
//   ・置換忘れててmapboxglのままでも動いたりする
// @see https://docs.geolonia.com/
// @see https://docs.mapbox.com/jp/mapbox-gl-js/example/

/**
 * 地図描画
 *
 * @param {number} lat geolonia.Mapの中心地(緯度)
 * @param {number} lng geolonia.Mapの中心地(経度)
 * @param {string} pref_name_ja 都道府県名(例: "栃木県")
 * @param {boolean} debug true でデバッグモード
 * @param {number} zoom 地図の拡大率(max: 20？)
 */
const draw = (lat, lng, pref_name_ja, debug = false, zoom = DEFAULT_ZOOM) => {
  const prefix = PREFS[pref_name_ja].en; // jp => en (例: "栃木県" => "tochigi")
  console.log(`lat: ${lat}, lng: ${lng}, pref_name_ja: ${pref_name_ja}, prefix: ${prefix}`)

  // 今どこの都道府県を表示してるか(pref_name_ja)をわかりやすく表示
  // とりま<h1>の部分にやっつけで公式GoToEatサイトへのリンクを追加
  document.getElementById('goto_title').innerHTML = `後藤イー太 @ <a href="${PREFS[pref_name_ja].offical_page}" target="_blank">${pref_name_ja}</a>`

  // GeoJSONを自動取得させていない(現状あえて非対応にしている)都道府県の場合や、特定の都道府県の場合の処理
  // TODO: もう少しいい感じの説明とか、いい感じの説明ページへ飛ばすとか、なんか
  {
    if (pref_name_ja === '東京都') {
      // FIXME: 暫定的に東京都内は/geojson/以下を見させる
      // 本当は徳島県同様に「諸事情で表示させていません」対応
      _USE_LOCAL_GEOJSON = true;
      // do not return
    }
    if (pref_name_ja === '徳島県') {
      alert(`${pref_name_ja}は諸事情で現在表示させていません。ごめんね…`)
      return
    }
    if (pref_name_ja === '静岡県') {
      alert('静岡県は「赤券」の方しか対応しておりません。ご了承ください。')
      return
    }
    if (pref_name_ja === '鹿児島県') {
      alert('鹿児島県は「鹿児島商工会議所」が発行している商品券の方しか対応しておりません。ご了承ください。')
      return
    }
  }

  // GeoJSON置き場
  // @see https://github.com/terukizm/goto-eater-data/tree/main/data/output/osaka
  const geojson_base = _USE_LOCAL_GEOJSON ? `./geojson/${prefix}` : `https://raw.githubusercontent.com/terukizm/goto-eater-data/main/data/output/${prefix}`;

  // Mapインスタンス初期化、onload処理
  const map = initMap(lat, lng, zoom, debug)
  map.on('load', () => {
    // _error.jsonの中身を表示
    // (TODO: textareaじゃなくてもう少しまともな感じで画面に出す)
    printErrorJSON(`${geojson_base}/_error.json`)

    // レイヤー設定
    // MEMO: genre=1 (居酒屋) の場合
    // * 1レイヤー("layer-1")
    //   * 1アイコンイメージ("./img/genre1.png")
    //   * 1データソース("datasource-1")
    //     * 1GeoJSON = "genre1.geojson"

    // MEMO: MapBox GL JSの仕様として、「レイヤーごとに1アイコン、1データソース(GeoJSON)」なので、
    // 1つのGeoJSONの中身から、それぞれ別のマーカーを表示、みたいなことはできない(はず)。
    // そのためgenreごとにGeoJSONを分けて生成している。(もしできるなら普通にall.geojsonだけでよい)
    const layer_list = []
    for (const [i, genre] of Object.entries(GENRES)) {
      const layer_id = `layer-${i}`;
      const datasource_id = `datasource-${i}`

      // GeoJSONの読み込みパス
      const debug_prefix_dir = debug ? '_debug/' : '';
      const geojson_path = `${geojson_base}/${debug_prefix_dir}genre${i}.geojson`;

      // MEMO: 対応するジャンルコードのGeoJSONがない場合があり、その場合404が出る。
      // (例: 静岡はジャンル6(各国料理)がない。カレーとかはその他扱いになってる。大阪はジャンル8(ファミレスとか)がない)
      // そういう場合はどうしたもんか…

      // 案1: 事前にHEADリクエストとかで存在確認(20x)しておく
      // 案2: GeoJSON作るときに空ファイル作っておく

      // FIXME: 案1を以下のように試してみたらGeoJSONが存在しない場合に左袖メニューを出さないようにできたが、
      // (実装が糞なので)まあ描画に時間かかる上、404エラー自体はconsoleに普通に出るので、あんまり良いとこがない

      // 案1: XHRとHEADで事前確認 (遅いのでon.load()の中でやるのはよくない)
      // const xhr = new XMLHttpRequest();
      // xhr.open('HEAD', geojson_path, true);
      // xhr.send();
      // if (xhr.status == 404) {
      //   continue
      // }

      map.addSource(datasource_id, {
        type: 'geojson',
        data: geojson_path
      });

      // アイコン画像のオリジナルサイズは32x32なので、スマホ用には1/2にする
      const icon_size = window.matchMedia('(min-width: 600px)').matches ? 1 : 0.5
      console.log(`🍣🍣 ${icon_size}`)

      // レイヤー作成
      map.addLayer({
        "id": layer_id,
        "source": datasource_id,
        "type": "symbol",
        "layout": {
          'visibility': 'none',
          // アイコン画像(Marker画像)の設定
          "icon-image": `marker-genre${i}`,
          "icon-allow-overlap": true, // この指定がないとlatlngが重なったときにアイコンが確実に上書きされてしまう
          "icon-size": icon_size,
          // アイコンの下にshop_nameをラベル表示させる設定
          // (フォント指定まわりについては、ドキュメントがあまりない)
          'text-field': "{shop_name}",
          "text-font": ["Noto Sans Regular"], // geoloniaで使えるフォントはローカルに入ってるやつらしい(ほんとか？？？)、とりまNoto Sans...
          'text-radial-offset': 1.8,
          'text-size': 12,
          'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
          // MEMO: text-variable-anchorを入れとくとテキストラベルが重なったときにラベル位置をMarkerの上下左右に再配置してくれる
          // 特に本サイトのDAMSを使って取得したlatlngの場合、ジオコーダの解像度が低くlatlngが重複してしまう可能性が非常に高いため、必須
        },
        "paint": {
          // shop_nameを表示している、ラベルテキスト関係の設定
          "text-color": `${genre.color}`, // ラベルテキストの文字色
          "text-halo-color": "rgba(255,255,255,1)", // 縁取りの色
          "text-halo-width": 2, // 縁取りの幅
          // MEMO: アイコン描画での縁取り色指定
          // カスタムアイコンを利用している場合は効かないっぽい。(やるなら)png側で背景色つけてやるのが良さそう
          // "icon-color": "rgba(0,0,0,1)",
          // "icon-halo-color": "rgba(255,255,255,1)",
          // "icon-halo-width": 1,
        }
      });

      // 作成したレイヤーに各種マウスイベントを紐付け(レイヤーごとにイベントを紐付けないといけないので注意)
      // @see https://docs.mapbox.com/jp/mapbox-gl-js/example/popup-on-click/
      map.on('click', layer_id, (e) => {
        // マーカーをクリックしたときに吹き出しを表示
        console.log(e)
        const coordinates = e.lngLat;
        while (Math.abs(coordinates.lng - coordinates[0]) > 180) {
          coordinates[0] += coordinates.lng > coordinates[0] ? 360 : -360;
        }
        new geolonia.Popup()
          .setLngLat(coordinates)
          .setHTML(createPopupHTML(e.features[0], debug))
          .addTo(map);
      });
      // マーカーにマウスオーバーでポインタを人差し指にする
      map.on('mouseenter', layer_id, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      // マーカーへのマウスフォーカスが外れたらポインタを通常に戻す
      map.on('mouseleave', layer_id, () => {
        map.getCanvas().style.cursor = '';
      });

      // 左袖に表示されるジャンル別メニューの設定
      // @see https://docs.mapbox.com/jp/mapbox-gl-js/example/toggle-layers/

      // FIXME: この辺、もっとシュッと組めない…？
      // メニューコンテンツに相当するaタグを作成
      const link = document.createElement('a');
      link.href = '#';
      link.id = layer_id;
      link.className = '';
      link.textContent = genre.name;
      link.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (map.getLayoutProperty(layer_id, 'visibility') === 'visible') {
          unselect(map, layer_id, link);
        } else {
          select(map, layer_id, link);
        }
      };
      document.getElementById('menu').appendChild(link);
      layer_list.push(layer_id);
    }

    // 全選択/全選択解除ボタン追加
    //  (あーーーーーーーーーーーーだるい、だるい)
    const select_all = document.createElement('a');
    select_all.href = '#';
    select_all.id = 'select_all';
    select_all.textContent = '全選択'
    select_all.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      selectAll(map, layer_list);
    }
    const unselect_all = document.createElement('a');
    unselect_all.href = '#';
    unselect_all.id = 'unselect_all';
    unselect_all.textContent = '選択解除'
    unselect_all.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      unselectAll(map, layer_list);
    }
    document.getElementById('sub_menu').appendChild(select_all);
    document.getElementById('sub_menu').appendChild(unselect_all);

    // 左袖メニューを表示
    selectAll(map, layer_list);
    document.getElementById('menu').style.visibility = 'visible';
    document.getElementById('sub_menu').style.visibility = 'visible';
  });
}

/**
 * Mapインスタンス(geolonia.Map)を作成
 *
 * @param {number} lat geolonia.Mapの中心地(緯度)
 * @param {number} lng geolonia.Mapの中心地(経度)
 * @param {boolean} debug true でデバッグモード
 * @param {number} zoom 地図の拡大率(max: 20？)
 */
const initMap = (lat, lng, zoom, debug) => {
  let map = new geolonia.Map({
    container: '#map',
    center: [lng, lat], // lat, lngの順番が逆になるので注意
    zoom: zoom,
  }).addControl(new geolonia.ScaleControl({
    // 左下に地図の縮尺(スケール)を表示させる設定
    maxWidth: 200,
    unit: 'metric'
  })).addControl(new geolonia.GeolocateControl({
    // 現在地を表示させる設定 (Chromeだと範囲が広くて画面が真っ青になるが謎)
    // => 家のWiFiとかが原因かもしれない
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

  // マーカー用アイコン画像を読み込み(/img/genre[1-10].png)
  for (const [key, _] of Object.entries(GENRES)) {
    map.loadImage(`img/marker/genre${key}.png`, (error, res) => {
      map.addImage(`marker-genre${key}`, res);
    });
  }

  // debugモードの場合、判別しやすいようにMapのスタイルを変更(ダークモード風味)
  if (debug) {
    map.setStyle(`https://raw.githubusercontent.com/terukizm/notebook/master/style.json`)
  }

  return map;
}

/**
 * ポップアップの中身(HTML)を作成
 * MEMO: 試してないけど各種HTMLタグとかcssとかも使えそう
 *
 * @param {*} feature
 * @param {boolean} debug
 */
const createPopupHTML = (feature, debug = false) => {
  const props = feature.properties;
  const lat = feature.geometry.coordinates[1];
  const lng = feature.geometry.coordinates[0];

  // MEMO: 普通にdlとかの方がよくない…？
  let popup_html = `<strong>店舗名:</strong> ${props.shop_name}<br>`;
  popup_html += `<strong>公式サイトの住所:</strong> ${props.address} <br>`;
  popup_html += (props.detail_page ? `<a href="${props.detail_page}" target="_blank">[GoTo詳細ページ]</a><br>` : '');
  popup_html += (props.area_name ? `<strong>エリア</strong>: ${props.area_name} <br>` : '');
  popup_html += `<strong>ジャンル:</strong> ${props.genre_name} <br>`;
  popup_html += (props.closing_day ? `<strong>定休日:</strong> ${props.closing_day} <br>` : '');
  popup_html += (props.opening_hours ? `<strong>営業時間:</strong> ${props.opening_hours} <br>` : '');
  popup_html += (props.tel ? `<strong>電話番号:</strong> ${props.tel} <br>` : '');
  popup_html += (props.offical_page ? `<a href="${props.offical_page}" target="_blank">[公式HP]</a><br>` : '');
  popup_html += `<a href="${props['google_map_url']}" target="_blank">【GoogleMap】</a><br>`;

  // MEMO: geojsonで空のデータ項目もキーが出力されている(例: closing_day: "",)が、
  // データサイズの観点からは空データの場合、キー自体なしの方が適切かもしれない。
  // ただ、以下のような書き方しても問題ないので、js側の実装上はどっちでも問題ない。
  popup_html += (props.not_exist_key ? '!!! NOT FOUND !!!!' : '');

  if (debug) {
    // デバッグモードのときはデバッグ用の情報も出す
    // @see /geojson/{都道府県名}/_debug/xxxxx.geojson
    popup_html += '<hr><br>';
    popup_html += `正規化された住所: ${props.normalized_address} <br>`;
    popup_html += `lat: ${lat} <br>`;
    popup_html += `lng: ${lng} <br>`;
    popup_html += (props.zip_code ? `zip_code: ${props.zip_code} <br>` : '');
    popup_html += `_dams_score(ジオコーディングの結果スコア): ${props['_dams_score']} <br>`;
    popup_html += `_dams_name(ジオコーディングに使われている住所情報): ${props['_dams_name']} <br>`;
    popup_html += `_dams_tail(ジオコーディングに使われてない住所情報): ${props['_dams_tail']} <br>`;
    popup_html += `<a href="${props['_gsi_map_url']}" target="_blank">(国土地理院地図)</a>` + '<br>';

    // GitHubにIssue作るためのURLを作成
    const base_url = location.protocol + location.host
    const issue_title = `「${props.address}」の場所が正しくない`
    const issue_body = `\n\n
---------------------\n
店舗名:${props.shop_name}\n
参照: ${base_url}/?debug&zoom=18&lat=${lat}&lng=${lng}`;
    popup_html += `<a href="https://github.com/terukizm/goto-eater-data/issues/new?title=${encodeURIComponent(issue_title)}&body=${encodeURIComponent(issue_body)}" target="_blank">[エラー報告@GitHub]</a>`
    popup_html += '<hr><br>';
    popup_html += `<a href="./?zoom=18&lat=${lat}&lng=${lng}">[→通常モードに戻る]</a>` + '<br>';

  } else {
    // MEMO: zoom率上げてもpopUp()状態が保持されるわけじゃないから遷移するとわかんなくなりがち
    popup_html += `<a href="./?debug&zoom=18&lat=${lat}&lng=${lng}">[→デバッグモードに移行]</a>`
  }

  return popup_html
}

///////////////////////////////////////////////////////////////////////////
// 左袖メニュー用関数

const select = (map, layer_id) => {
  map.setLayoutProperty(layer_id, 'visibility', 'visible');
  document.getElementById(layer_id).className = 'active';
}
const unselect = (map, layer_id) => {
  map.setLayoutProperty(layer_id, 'visibility', 'none');
  document.getElementById(layer_id).className = '';
}
const selectAll = (map, layer_list) => {
  for (const layer_id of layer_list) {
    select(map, layer_id);
  }
}
const unselectAll = (map, layer_list) => {
  for (const layer_id of layer_list) {
    unselect(map, layer_id);
  }
}

///////////////////////////////////////////////////////////////////////////

/**
 * 住所入力用のコンポーネント(Form Input)
 *
 * @param {URLSearchParams} params Query Paramerter
 */
const addressInputComponent = (params) => {
  // FIXME: この辺、もっとシュッと組めない…？ やだー…
  const place_input = document.createElement('input');
  place_input.id = 'place-input';
  place_input.type = 'text';
  place_input.value = params.get('place') || DEFAULT_PLACE;

  const move_button = document.createElement('input');
  move_button.type = 'submit';
  move_button.value = '移動';

  const place_form = document.createElement('form');
  place_form.addEventListener('submit', (event) => {
    params.set('place', document.getElementById('place-input').value) // 上書き
    window.location.href = './?' + params.toString();
    event.preventDefault();
  });
  place_form.appendChild(place_input);
  place_form.appendChild(move_button);
  document.getElementById('toolbox').appendChild(place_form);
}

/**
 * _error.jsonの中身をtextareaに適当に出すやつ
 */
const printErrorJSON = (error_json_path) => {
  fetch(error_json_path, {
      method: "GET",
    })
    .then(response => response.json())
    .then(json => {
      for (const [k, v] of Object.entries(json)) {
        if (k !== 'error') {
          continue
        }; // duplicated, warningについてはとりあえず出さない方針 (量が多いので)
        for (const [_, record] of Object.entries(v)) {
          // TODO: なんかこう、楽で省スペースなdump方法、ないすか、、、
          // console.log(record)
          document.getElementById('errors_textarea').value += `${record.shop_name} (${record.address})\n`
        }
      }
    });
}

////////////////////////////////////////////////////////////////////////////////////////////////////

main();
