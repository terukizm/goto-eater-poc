goto-eater-poc
===

# Usage

* Python 3.x
  * `$ python serve3.py`
* Python 2.x
  * `$ python serve.py`

-> http://localhost:18000/

# サービス名案

- GOTO EATER
- 後藤イー太
- (その他クソダサネーム)


# MEMO

## 基本方針

- 死人出ないし多少結果おかしかったり位置ずれしててもOK(1kmくらいはいいやろ)
- どうせ3月末には終わるキャンペーンだし、なにごとも適当でよい
- とりあえず2末までにわしが残り48,000円分の金券を使い切れればよい


- 競合サービス
  - https://go-to-eat-map.com/
  -

# 💪 優先

* pydamsの精度向上、マルチステージビルド対応(csv2geojson)
  * 今やっているがしんどい…　現状の(2012年度)でもいいんじゃみたいな気がしてきた、、、でも2012年度…
* レイヤー分けでジャンルonoff(PoC)
* GitHub Pagesでpublish
* Debug用GeoJSONを分ける(with indent, debug情報系props)


## 優先度高めの課題

- [ ] 飲食店のジャンル(カテゴリ)ごとに別アイコンを表示させる
  - [ ] レイヤーを分けてon/offの切り替えができるようにする
  - [ ] 飲食店ジャンル別にGeoJSON用意しても、jsでジャンル分けしてもどっちでもOK
- [ ] 初期表示時に位置情報を取得し、現在地を中心として地図を描画(現在は佐野のlatlng(36.305, 139.580)を決め打ち)
  - [ ] [農研の逆ジオコーディングAPI](https://aginfo.cgk.affrc.go.jp/rgeocode/index.html.ja)を叩いて、現在地が栃木(都道府県コード=09)なら栃木(prefix=09)のGeoJSONを読み込むみたいな流れ
    - geojson名とかそのへんはUI側が作りやすいようにできるのでなんでもよい
    - GoToEatは都道府県単位で実施されているので、都道府県をまたいでの店舗検索はあんま考えなくてよい
    - とりあえず今いる場所の近くでGoToできる店を探したい、というユースケースを想定
- [ ] GitHub Pagesでpublish
  - Netlifyとかでもいいが、GitHub Pagesだとpublicでリポジトリ公開なら転送量無制限かつ無料なので
  - ドメインとかも取らんでよし

## 気が向いたら

- 上記の現在位置を元に表示するのとは別に、http://localhost:18000/maps/栃木県/ のように都道府県固定で表示するパターン
  - 事前に「GoToTravel先でGoToEatできる飲食店を探す」ようなユースケースを想定
- 指定された場所にマップの中心を移動させる(入力フォームに自治体名、住所を入れるなど)
  - 現状マップ中心を移動させる手段が手動操作しかないので、概ね場所がわかってないと操作できない
    - 住所入力(例: 栃木県宇都宮市)したらそこに移動するようになってると便利(かもしれない)
      - [こういうやつ](https://docs.mapbox.com/jp/mapbox-gl-js/example/mapbox-gl-geocoder-accept-coordinates/)
    - 住所からlatlngを取るのでジオコーディングが必要だが精度は不要、[これ](https://github.com/geolonia/community-geocoder)叩かせてもらうのがよさそう
- metaタグとかOGPとかそのへん

## 優先度低め

- pydams(ジオコーディング)で利用している住所情報の解像度の問題で、**番地以下が無視される形で**ジオコーディングが行われる
  - 隣り合うビルなどの場合は同じlatlngになり、マーカーが重なってしまう(例: イオンモール佐野新都市とかプレミアムアウトレットが地獄)
  - 重なった場合に適宜オフセットさせるようなことができるといいんだけど…
    - GoogleMapsでも同じビルだったら座標が重なることはありそうだが、そういうときどうしてるんだろうか…
　- UI側でよしなにできなかったらこれもうしゃーないやろって気もしてきた
- geoloniaのAPIKeyがベタ書き
  - referer見てドメイン名別にアクセス制限してるみたいなのでええやろ(開発時はlocalhost:18000)
  - GitHub Pagesでpublishするときに気が向いたら環境変数に出してやると優しい
- 見ないふりしてる
  - Chromeで現在地ボタン押すとめちゃくちゃでかい半径の円が出る
  - 手元のMac版SafariとFirefoxで右側に表示されてる現在置ボタンが動かない(Chromeは動く)
    - PC版はChrome、iPhoneのSafariとアンドロイドのデフォルトブラウザで動けばよい
    - この辺MapBox GL LSもしくはGeolonia APIとの切り分けもしないとわからん

## 🔥 画面側と関係ない課題

- [ ] pydamsが標準で読んでる住所データ辞書がかなり古く、住所の解像度以前にデータの中身が微妙of微妙
  - 辞書データに載ってないせいで当たってない住所とかある
  - 辞書更新かければいいんだけど、DAMS用CSVのフォーマット作るのがだるい…(もろ木構造な上文字コードがEUC)
    - 仕様とかもほぼないので、既存の辞書みながら見様見真似で作るハメになるやつで気が滅入ってる
    - どう考えても開発者がいなくなってメンテできなくなった系、C++のソースは見づらくはないけど追うのが厳しい感じでつらい
      - 文字コード依存でビット演算でなんかやってるみたいなとこも多くて… (多分文字寄せ)
- [ ] 飲食店のジャンルは都道府県でまったく統一されてない。ひどい自治体だと25ジャンル以上ありそう
  - GeoJSON出すときにある程度寄せることも可能だが(埼玉県くらいの粒度で10カテくらい？)どうしたもんかなー
    - たくさんあると色分けとかアイコンの用意が大変
      - [このへん](https://iconify.design/icon-sets/?query=sushi)で検索してたら無限に時間を潰した
    - 振り分けでジャンルを統一する場合、ロジックがめんどい
      - サイゼリヤはイタリア料理なのか各国料理なのか洋食なのかファミレスなのか問題
      - 10個くらいに集約すると「これどこに入れたらいいんだ…」ってのが絶対でてきてめんどい
        - 沖縄料理ってなんだよ、和食なのか各国料理なのかその他でいいのか
- [ ] pydamsを詰め込んだDockerfileをマルチステージビルド方式に
  - 特に住所データ突っ込んでのDAMS辞書再作成を視野に入れるならやっときたい
  - CPythonとか入れてる時点でAlpain化は不安あるができたらサイズちっちゃくしたい…
- [ ] とりあえずスクレイパー書いたの栃木だけなので、多少はほかんとこも作っとく
  - [x] 大阪、山梨、埼玉を追加
  - [ ] GitHub Actionあたりで定期的に流せるとよい、最悪まあ手動でもよい
  - [ ] 加盟店は随時追加されるみたいなので、まあデイリーくらいで流しとけばいいんじゃという感じ
- [ ] どうも公式サイトあたり見てると自治体の人が手入力で住所入れてる感じで住所あたりの表記ブレがきつめ
  - 番地表記とかもめちゃくちゃ適当な感じする、申請の値コピペでそのまま入れてない…？
  - 特に大阪,京都がひどい
- [ ] ジオコーディング失敗時の検出とエラー処理
  - 取れなかったら取れなかったでしゃーない(精度は重視してない)でいいが、ログくらいは出して追いかけられるようにはしたい
    - そのケースに対応するかは別の話として
- [ ] ジオコーディング、土地勘がないと位置ずれしててもわからん問題
  - これほんとしゃーない
    - 補正として郵便番号とか使えなくもないが、効果がどんだけあるかは微妙(やるなら[posuto](https://pypi.org/project/posuto/)ためす)


## 問題になりやすそうな地名

* 千葉県市川市市川一丁目
  * 正規表現でこけやすい(DAMSはよしなにやってくれる, IMIコンポーネントツールはダメっぽい)
* 静岡県三島市4845 (某会社)
  * 大字(町名)なし、他にも歴史的経緯で全国にいくつかあるらしい(下田とか龍ケ崎市とか)
    * DAMSだと木構造で直前データを取りに行くため、エラーにはならないが、静岡県/三島市/５番地に変換されるのでめちゃくちゃズレる
* [京都](https://www.any.co.jp/2442-2/)
  * Save the world from Kyoto....
  * 北海道もひどい

## ジオコーダの選択

* 有償系
  * Google Geocode
    * 金に糸目をつけずに、地図にGoogleMapを使うことを必須、結果がライセンスで縛られることを除外できるならこれ一択
  * Navitime
    * 無料枠が狭い
  * Mapbox
    * 日本だと精度が微妙
  * Yahooのやつ
    * サー終
* 無料系
  * 国土地理院地図の内部API
    * 内部的にDAMSを叩いてる、勝手に使うと怒られそうな気配がする
  * DAMS系(東京大学シンプルジオコーディングサービス系)
    * pydamsでPython経由で割と簡単に使える
    * 住所データが古い(2012年)、精度は番地までしか出せない(街区レベル位置参照情報)
      * 例: "東京都墨田区江東橋３丁目１４−５ 錦糸町駅ビル 5F" -> "東京都/墨田区/江東橋/三丁目/１４番"
    * 開発者がいなくなってメンテできなくなった感がめちゃくちゃすごい、辞書データの作り方すらドキュメントにない
      * 基本的にすべてが謎めいている(情報処理学会の論文見に行けばわかるのか…？)
      * 内部処理がEUCに依存した文字寄せとかを多用してるので文字コード知識がないとつらい
      * 木構造を用意してそれでわちゃわちゃやってるのはわかるが全体像が見えない
    * ノーマライズ関係(一丁目番地→半角数字ハイフン区切り)はシンプルなロジックに見えるが意外ときちんとやってる
      * 異体字による文字寄せなんかも文字コード依存っぽいがちゃんとやってる、ただ正直どんな文字列をどう処理しているのかがわかりにくい
  * IMIコンポーネントツール・住所変換コンポーネント(community-geocoder)
    * npmで提供されてるのでよしなに使えるが、精度が丁目までしか出せないため(大字・町丁目レベル位置参照情報)使い物にならない
      * 例: "東京都墨田区江東橋３丁目１４−５ 錦糸町駅ビル 5F" -> "東京都/墨田区/江東橋/三丁目"
        * 地方だと3-14-5が3-14になるだけで500mくらいずれて厳しいのに、3になったら完全に無理やろ
    * 実装がDAMSとは違うベクトルできつい、アドホックにゴリゴリ組んでる感じ。
      * アプローチとしてはDAMSの方が知的。テストも書いてあるしこっちのほうがわかりやすくはあるが…
        * 現時点では利用用途が限られすぎる


# ビューアー選択

最初はfolium(leafletベース)でやってたが、店名を3000件プロットしたあたり(栃木県)で表示したときにブラウザが死ぬので問題外だった
Gelonia(MapBox GL JS)はシンプルで見やすくて挙動も軽い、ただMapBox GL JSがむっかしい…


# アイコン

https://icooon-mono.com/　お借り候