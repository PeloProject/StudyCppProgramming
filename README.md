# C++ Mastery - 学習プラットフォーム

C++のプログラミングスキルを、ブラウザ上での実践を通じて向上させるための学習ツールです。

## 特徴

- **ブラウザ完結**: Wandbox APIを利用し、ローカル環境の構築なしでC++コードを実行・検証できます。
- **豊富な学習コンテンツ**: C++の基礎から、デザインパターン、リファクタリング、Effective C++のベストプラクティスまで幅広くカバーしています。
- **リアルタイム検証**: 記述したコードが課題の要件を満たしているか、テストコードによって即座に判定されます。

## 使い方

詳細な使い方は [USAGE.md](./USAGE.md) を参照してください。

### クイックスタート

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

または、OSごとの起動スクリプトを実行できます。

- Windows: `run.bat`
- macOS: `run.command`

## 技術構成

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS
- **Editor**: Monaco Editor (@monaco-editor/react)
- **Execution**: Wandbox API
- **Icons**: Lucide React
