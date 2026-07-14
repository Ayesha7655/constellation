#!/usr/bin/env bash
# New iTerm tab: 2×2 split — frontend / backend / shared / filter-ai.
# Opens Cursor/VS Code separately. Windows equivalent: shell-script.ps1

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
FRONTEND_CMD="cd $(printf '%q' "$ROOT/apps/frontend") && pnpm exec next dev --port $(printf '%q' "$FRONTEND_PORT")"
BACKEND_CMD="cd $(printf '%q' "$ROOT/apps/backend") && pnpm dev"
FILTER_AI_CMD="cd $(printf '%q' "$ROOT/apps/filter-ai") && pnpm dev"

if command -v cursor >/dev/null 2>&1; then
  (cd "$ROOT" && cursor .) >/dev/null 2>&1 &
elif command -v code >/dev/null 2>&1; then
  (cd "$ROOT" && code .) >/dev/null 2>&1 &
fi

osascript - "$FRONTEND_CMD" "$BACKEND_CMD" "$SHARED_CMD" "$FILTER_AI_CMD" <<'APPLESCRIPT'
on run argv
	set frontendCmd to item 1 of argv
	set backendCmd to item 2 of argv
	set sharedCmd to item 3 of argv
	set filterAiCmd to item 4 of argv

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
					write text filterAiCmd
				end tell
			end tell
		end tell
	end tell
end run
APPLESCRIPT
