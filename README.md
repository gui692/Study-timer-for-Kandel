# Study Timer (3-Pass Method)

Next.jsで動く学習用タイマーです。3-Pass Methodの各フェーズを順に進めながら、残り時間や合計進捗を可視化できます。

## セットアップ

```bash
npm install
npm run dev
```

`http://localhost:3000` で確認できます。

## ビルド確認

```bash
npm run build
npm start
```

上記で本番ビルドと動作確認ができます（静的ページとして出力されます）。

## Vercelへのデプロイ

1. このリポジトリをGitHubなどのGitリポジトリにプッシュします。
2. Vercelのダッシュボードで「Add New Project」→「Import Git Repository」を選択し、このリポジトリを選ぶ。
3. Frameworkは自動でNext.jsと検出されます。設定は以下のままでOKです。
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Node.js: 18.18以上（`package.json`の`engines`で指定）
4. 「Deploy」を押せば公開完了です。カスタムドメインを使う場合はVercel上で割り当ててください。

### Vercel CLIを使う場合

```bash
npm install -g vercel
vercel login          # 初回のみ
vercel                # プレビュー
vercel --prod         # 本番デプロイ
```

環境変数は不要です。デプロイ後にブラウザで開き、音声再生を許可すれば各フェーズ終了時に通知音が鳴ります。
