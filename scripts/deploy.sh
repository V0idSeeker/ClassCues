#!/usr/bin/env bash
# Deploys the current commit to Vercel as a named version and tags it.
# Usage: bump "version" in package.json, commit, then: bash scripts/deploy.sh
# Roll back: git checkout web-v<previous version> && npx vercel deploy --prod && git checkout -
set -euo pipefail

VERSION=$(node -p "require('./package.json').version")
TAG="web-v$VERSION"

if [ -n "$(git status --porcelain)" ]; then
  echo "Uncommitted changes. Commit first, so the tag points at exactly what is deployed." >&2
  exit 1
fi
if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "Version $VERSION was already deployed (tag $TAG exists). Bump the version in package.json." >&2
  exit 1
fi

npm test
npm run build
npx vercel deploy --prod

git tag -a "$TAG" -m "Deployed $TAG"
if git remote get-url origin >/dev/null 2>&1; then git push origin "$TAG"; fi
echo "Deployed $TAG"
