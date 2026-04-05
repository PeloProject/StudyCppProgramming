#!/bin/zsh
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Finder から .command を実行した時は PATH が最小構成になりやすいため、
# 代表的なインストール先を先に追加する。
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

# zsh の設定を読み込み（存在する場合のみ）、Node 管理ツール経由の npm を拾えるようにする。
[ -f /etc/zprofile ] && source /etc/zprofile
[ -f "$HOME/.zprofile" ] && source "$HOME/.zprofile"
[ -f "$HOME/.zshrc" ] && source "$HOME/.zshrc"

# nvm
if [ -z "${NVM_DIR:-}" ]; then
  export NVM_DIR="$HOME/.nvm"
fi
if [ -s "$NVM_DIR/nvm.sh" ]; then
  source "$NVM_DIR/nvm.sh"
fi

# fnm
if command -v fnm >/dev/null 2>&1; then
  eval "$(fnm env --use-on-cd)"
fi

# volta
if [ -d "$HOME/.volta/bin" ]; then
  export PATH="$HOME/.volta/bin:$PATH"
fi

# asdf
if [ -f "$HOME/.asdf/asdf.sh" ]; then
  source "$HOME/.asdf/asdf.sh"
fi

echo "=========================================="
echo "  C++ Mastery Platform Launcher (macOS)"
echo "=========================================="

if ! command -v npm >/dev/null 2>&1; then
  echo "[ERROR] npm が見つかりません。Node.js をインストールしてください。"
  echo "        例: Homebrew を使う場合は 'brew install node'"
  echo "        または https://nodejs.org/ からインストールしてください。"
  read -r "?終了するには Enter キーを押してください..."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "[INFO] node_modules が見つかりません。依存関係をインストールします..."
  npm install
fi

echo "[INFO] 開発サーバーを起動します..."
npm run dev
