#!/bin/bash
# ─── Push CELESTIA GALLERIA ✦ to GitHub ─────────────────────────────────────
# Target repo (already created / renamed by the user, public):
#   https://github.com/G1010yzd10/celestia-galleria
#
# The repo is committed locally and the remote is configured. The ONLY
# missing piece is authentication — GitHub requires a PAT even for
# public repos, and tokens are never stored on disk (by design).
#
# HOW TO PUSH — pick one:
#
#   (A) Token via environment, never enters shell history after use:
#         read -rs CG_PAT && export CG_PAT && bash scripts/push.sh
#       (paste the PAT when prompted, press Enter)
#
#   (B) Plain one-shot (token visible in local shell history):
#         CG_PAT=ghp_xxxxxxxx bash scripts/push.sh
#
#   (C) Interactive, remembered by git after the first success:
#         git config credential.helper store
#         bash scripts/push.sh
#       (username: g1010yzd10 · password: <your PAT>)
#
# After the first successful push, every later push is just:
#   git push origin main
set -u
cd "$(dirname "$0")/.."

echo "remote : $(git remote get-url origin)"
AHEAD=$(git rev-list --count origin/main..main 2>/dev/null || echo '?')
echo "ahead  : ${AHEAD} commit(s) waiting on GitHub"

if [ -n "${CG_PAT:-}" ]; then
  # Askpass helper: git asks the script (not the terminal) for credentials,
  # so the token never lands in the remote URL, process list, or .git/config.
  ASKPASS=$(mktemp)
  cat > "$ASKPASS" <<'EOF'
#!/bin/sh
case "$1" in
  *sername*) echo "g1010yzd10" ;;
  *) printf '%s\n' "$CG_PAT" ;;
esac
EOF
  chmod +x "$ASKPASS"
  trap 'rm -f "$ASKPASS"' EXIT
  GIT_ASKPASS="$ASKPASS" GIT_TERMINAL_PROMPT=0 git push origin main
else
  echo "(no CG_PAT set — git will prompt for credentials if a helper exists)"
  git push origin main
fi
