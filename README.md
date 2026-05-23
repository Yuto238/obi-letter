# OBI LETTERS

読んだ本の感想を手紙として書き、匿名に近い名前で誰か一人に届けるWebサービスのプロトタイプです。

## サービス概要

このアプリは HTML / CSS / JavaScript だけで構成された静的サイトです。
GitHub Pages でそのまま公開でき、URLを知っている人なら誰でもアクセスできます。

## 主な機能

- トップページ
- 手紙を書くフォーム
- 差出人の名前登録
- 本のタイトル入力
- 著者名入力
- 手紙タイトル入力
- おまかせ便
- 封筒棚から手紙を選ぶ機能
- 届いた手紙を読む機能
- 届いた手紙の相手へ、一冊の本と感想を手紙として送る機能
- 手紙箱
- 読後メモ
- 相談／通報
- 利用ルール
- お知らせ
- 管理者用の運営室
- 管理者パスワード機能
- ローカル保存機能

## 使い方

1. このリポジトリを開きます。
2. index.html をブラウザで開きます。
3. 手紙を書く / 受け取る / 手紙箱 / 運営室の動作を確認します。

## GitHub Pagesでの公開方法

1. リポジトリを GitHub に push します。
2. GitHub の対象リポジトリで Settings -> Pages を開きます。
3. Build and deployment の Source を Deploy from a branch に設定します。
4. Branch を main、Folder を / (root) に設定して Save します。
5. 数分待って公開URLにアクセスします。

公開URL例:

https://ユーザー名.github.io/obi-letter/

## 管理者ログインについて

- 管理者入口は画面下部の「運営室へ」です。
- デモ用パスワードは app.js 内の ADMIN_PASSWORD で管理しています。
- 現在のデモ値は `obi-admin` です。

## 注意事項

このWebアプリはプロトタイプです。
現在のデータ保存は localStorage を使用しているため、ユーザーごとの端末内にのみ保存されます。
全ユーザーで同じ手紙データを共有する本番サービスとして運用するには、Firebase / Supabase / MySQL / PostgreSQL などのデータベース接続が必要です。

また、管理者パスワードはJavaScript内で管理しているため、本番環境のセキュリティとしては不十分です。
本番公開時には、Firebase Authentication、Supabase Auth、Next.js API Routes などを使い、サーバー側で認証・権限管理を行う必要があります。

## ファイル構成

```text
.
├── index.html
├── styles.css
├── app.js
├── MANUAL_TEST_CASES.md
└── README.md
```

## 手動テスト

実データを使った手動テストは MANUAL_TEST_CASES.md を参照してください。
