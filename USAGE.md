# C++ Mastery - 学習プラットフォーム 使い方ガイド

このプロジェクトは、C++のプログラミング技術（基礎、リファクタリング、デザインパターン、Effective C++）をインタラクティブに学習するためのプラットフォームです。

## プロジェクト概要

ブラウザ上でC++コードを記述し、実行・検証を行うことができます。バックエンドには[Wandbox API](https://wandbox.org/)を使用しており、ネットワークに接続された環境であれば、ローカルにC++コンパイラをインストールすることなく動作します。

## 始め方

### 1. 依存関係のインストール

プロジェクトのルートディレクトリで以下のコマンドを実行してください：

```bash
npm install
```

### 2. 開発サーバーの起動

```bash
npm run dev
```

または、ルートディレクトリにある `run.bat` をダブルクリックして起動することもできます（Windows環境）。このバッチファイルは、`node_modules` が存在しない場合に自動的に `npm install` も実行します。

macOS の場合は、ルートディレクトリにある `run.command` をダブルクリックして起動できます。`run.command` も `node_modules` が存在しない場合に自動的に `npm install` を実行します。

起動後、ブラウザで `http://localhost:5173` （またはターミナルに表示されたURL）にアクセスしてください。

## 主な機能

- **カテゴリー選択**: 「リファクタリング」「デザインパターン」「Effective C++」「C++の基礎」から学習内容を選択できます。
- **問題選択**: 各カテゴリーに含まれる具体的な問題を選択できます。
- **コードエディタ**: Monaco Editorを使用しており、構文ハイライト機能があります。
- **Run Code**: ボタンを押すとコードがコンパイル・実行され、テスト結果が表示されます。
- **ヒントと解答**: 問題に行き詰まった際、ヒントや模範解答を参照できます。
- **自動保存**: 記述したコードは `localStorage` に保存され、ブラウザを閉じても再開できます。

## 技術的詳細

### コンパイルと実行

ユーザーが記述したコードは、`src/services/compiler.ts` を通じて Wandbox API に送信されます。送信時には以下の処理が行われます：

1. ユーザーの `main` 関数を一時的に `user_main` にリネームします（`#define main user_main` マクロを使用）。
2. `src/data/problems.ts` に定義された課題ごとの `testCode` を末尾に結合します。
3. `testCode` 内に記述された `main` 関数が実行され、ユーザーのコードの正当性を検証します。

### テスト結果の判定

プログラムの標準出力に `TEST_PASSED` が含まれていれば「合格」、`TEST_FAILED` であれば「不合格」として処理されます。

## 問題の追加方法

新しい問題を追加するには、`src/data/problems.ts` の `problems` 配列に新しい要素を追加します。各要素は以下のインターフェースに従う必要があります：

```typescript
export interface Problem {
  id: string;             // ユニークなID
  title: string;          // 問題のタイトル
  description: string;    // 問題の説明文
  task: string;           // 具体的な課題内容
  initialCode: string;    // 初期のコード状態
  testCode: string;       // 検証用のC++コード
  category: string;       // カテゴリー名
  hint?: string;          // （任意）ヒント
  solution?: string;      // （任意）解答
  clientValidation?: (code: string) => string | null; // （任意）送信前の簡易チェック
}
```

## ビルドとデプロイ

プロダクション用にビルドするには以下のコマンドを実行します：

```bash
npm run build
```

`dist` ディレクトリに生成されたファイルを使用して、静的サイトホスティングサービス（Vercel, Netlify, GitHub Pagesなど）にデプロイ可能です。
