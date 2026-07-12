#!/usr/bin/env bash
# New iTerm tab: 2×2 split — shared / frontend / backend dev servers + editor.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_ENV="${ROOT}/apps/frontend/.env.local"

FRONTEND_PORT=4000
if [[ -f "$FRONTEND_ENV" ]]; then
  port_line="$(grep -E '^PORT=' "$FRONTEND_ENV" | tail -1 || true)"
  if [[ -n "$port_line" ]]; then
    FRONTEND_PORT="${port_line#PORT=}"
    FRONTEND_PORT="${FRONTEND_PORT//\"/}"
    FRONTEND_PORT="${FRONTEND_PORT//\'/}"
  fi
fi

SHARED_CMD="cd $(printf '%q' "$ROOT/packages/shared") && pnpm dev"
FRONTEND_CMD="cd $(printf '%q' "$ROOT/apps/frontend") && PORT=$(printf '%q' "$FRONTEND_PORT") pnpm dev"
BACKEND_CMD="cd $(printf '%q' "$ROOT/apps/backend") && pnpm dev"

if command -v cursor >/dev/null 2>&1; then
  EDITOR_LAUNCH="cursor ."
elif command -v code >/dev/null 2>&1; then
  EDITOR_LAUNCH="code ."
else
  EDITOR_LAUNCH="echo 'Neither cursor nor code found in PATH' >&2"
fi

EDITOR_CMD="cd $(printf '%q' "$ROOT") && ${EDITOR_LAUNCH}"

osascript - "$SHARED_CMD" "$FRONTEND_CMD" "$BACKEND_CMD" "$EDITOR_CMD" <<'APPLESCRIPT'
on run argv
	set sharedCmd to item 1 of argv
	set frontendCmd to item 2 of argv
	set backendCmd to item 3 of argv
	set editorCmd to item 4 of argv

	tell application "iTerm"
		activate
		tell current window
			create tab with default profile
			tell current tab
				tell current session
					split vertically with default profile
				end tell
				tell first session
					split horizontally with default profile
				end tell
				tell third session
					split horizontally with default profile
				end tell
				tell first session
					write text frontendCmd
				end tell
				tell second session
					write text backendCmd
				end tell
				tell third session
					write text sharedCmd
				end tell
				tell fourth session
					write text editorCmd
				end tell
			end tell
		end tell
	end tell
end run
APPLESCRIPT
