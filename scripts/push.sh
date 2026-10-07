#!/bin/bash
# ─── Push CELESTIA GALLERIA ✦ to GitHub ─────────────────────────────────────
# The repo is committed locally; the remote is set to the RENAMED target:
#   https://github.com/G1010yzd10/celestia-galleria.git
#
# ONE-TIME SETUP (you only do this once):
#   1. Rename the repo on GitHub:
#      github.com/G1010yzd10/doom-mart → Settings → General → Repository name
#      → change to: celestia-galleria
#      (GitHub auto-redirects the old URL, so nothing else breaks.)
#   2. Push with your PAT — either:
#        a) git push https://<YOUR_PAT>@github.com/G1010yzd10/celestia-galleria.git main
#      or, cleaner (never puts the token in shell history):
#        b) git config credential.helper store
#           git push origin main        # then type g1010yzd10 + PAT once
#
# AFTER THAT every later push is just:  git push origin main
set -u
cd "$(dirname "$0")/.."
echo "remote: $(git remote get-url origin)"
echo "commits ahead of origin/main: $(git rev-list --count origin/main..main 2>/dev/null || echo 'unknown (no fetch yet)')"
git push origin main
