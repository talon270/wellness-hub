#!/bin/sh
# ---------------------------------------------------------------------------
# WELLNESS HUB · ANDROID RELEASE                     (PLAN-android-updater.md B4)
#
#   sh tools/release-android.sh 1.0.2              DRY RUN. Builds the signed APK,
#                                                  verifies it, prints size + SHA-256,
#                                                  and lists anything that would stop
#                                                  a real release. Publishes nothing.
#   sh tools/release-android.sh 1.0.2 --publish    The same, refusing on any problem,
#                                                  then creates the PUBLIC GitHub Release
#                                                  android-v1.0.2 with the APK attached.
#
#   NOTES="what changed" sh tools/release-android.sh 1.0.2 --publish
#
# This script edits nothing. To release 1.0.2, set "version" in src-tauri/tauri.conf.json
# and Cargo.toml to it, commit, and push FIRST. The tag then names the exact source that
# was built, which is the whole point: a script that bumped the files itself would build a
# tree that is not what the tag points at.
#
# What the phone does with the result is js/androidupdate.js: it finds the highest
# android-vX.Y.Z release, compares its versionCode (major*1e6 + minor*1e3 + patch) to its
# own, and checks the APK against the `sha256:` line this script writes into the notes.
# The keystore (~/.android-keys) never leaves this machine: the APK is signed here, and
# CI never sees it. Tags start `android-v`, not `v`, so .github/workflows/build.yml (which
# fires on v*) does not start a desktop build.
# ---------------------------------------------------------------------------
set -eu

ver=${1:-}
mode=${2:-}
usage() { echo "usage: sh tools/release-android.sh MAJOR.MINOR.PATCH [--publish]" >&2; exit 2; }
echo "$ver" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+$' || usage
[ -z "$mode" ] || [ "$mode" = "--publish" ] || usage
publish=0; [ "$mode" = "--publish" ] && publish=1

root=$(CDPATH= cd "$(dirname "$0")/.." && pwd)
cd "$root"

die() { echo "STOPPED: $1" >&2; exit 1; }

code=$(echo "$ver" | awk -F. '{ if ($2 >= 1000 || $3 >= 1000) print -1; else printf "%d", $1 * 1000000 + $2 * 1000 + $3 }')
[ "$code" != "-1" ] || die "a component of $ver is 1000 or more, which would run into the next one in the versionCode"

# ---- checks that can stop a PUBLISH. In a dry run they are listed and the build goes on,
# so one run shows everything that is wrong instead of one thing at a time.
problems=""
problem() { problems="${problems}
  - $1"; }

grep -q "\"version\": \"$ver\"" src-tauri/tauri.conf.json \
  || problem "src-tauri/tauri.conf.json is not at version $ver (bump it, commit, push)"
awk '/^\[package\]/ {p = 1} p && /^version *=/ {print; exit}' src-tauri/Cargo.toml | grep -q "\"$ver\"" \
  || problem "src-tauri/Cargo.toml is not at version $ver"
git diff --quiet HEAD -- . || problem "tracked files have uncommitted changes, so the tag would not name what is built"
git fetch -q origin 2>/dev/null || problem "couldn't reach origin to check that HEAD is pushed"
[ -n "$(git branch -r --contains HEAD 2>/dev/null)" ] || problem "HEAD is not on origin: push it, so the tag names a commit that exists there"

if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  tags=$(gh release list --limit 100 --json tagName -q '.[].tagName' 2>/dev/null | grep '^android-v' | sed 's/^android-v//' || true)
  if echo "$tags" | grep -qx "$ver"; then
    problem "android-v$ver already exists"
  else
    top=$(printf '%s\n%s\n' "$tags" "$ver" | grep -v '^$' | sort -V | tail -1)
    [ "$top" = "$ver" ] || problem "$ver is not above the newest published release ($top): the phone would never offer it"
  fi
else
  problem "gh is missing or not signed in (needed to publish, and to check the last version)"
fi

if [ "$publish" = 1 ] && [ -n "$problems" ]; then
  echo "REFUSING TO PUBLISH:$problems" >&2
  exit 1
fi

# ---- things that make a build impossible or unsafe at any time
[ -n "${ANDROID_HOME:-}" ] && [ -n "${NDK_HOME:-}" ] || die "ANDROID_HOME and NDK_HOME must be set (PLAN-android.md B1)"
[ -f "$HOME/.android-keys/keystore.properties" ] \
  || die "no ~/.android-keys/keystore.properties: Gradle would produce an UNSIGNED APK, which a phone refuses to update from"

apksigner=$(ls -d "$ANDROID_HOME"/build-tools/*/apksigner 2>/dev/null | sort -V | tail -1)
aapt2=$(ls -d "$ANDROID_HOME"/build-tools/*/aapt2 2>/dev/null | sort -V | tail -1)
[ -n "$apksigner" ] && [ -n "$aapt2" ] || die "apksigner / aapt2 not found under $ANDROID_HOME/build-tools"

# arm64 only, as the phones this runs on are (the 2a and 4a; the M13's ABI has not been read over adb:
# `adb shell getprop ro.product.cpu.abilist`). All four ABIs is a 40.7 MB APK against 12.4 MB, and every
# update is a full download of it; it also adds ~10 minutes to the build. TARGETS="aarch64 armv7" for a 32-bit phone.
targets=${TARGETS:-aarch64}
target_args=""
for t in $targets; do target_args="$target_args --target $t"; done

marker=$(mktemp)
echo "Building $ver (versionCode $code) for: $targets ..."
# shellcheck disable=SC2086  # word-splitting $target_args is the point
cargo tauri android build --apk $target_args

apk=$(find src-tauri/gen/android/app/build/outputs/apk -name '*.apk' -newer "$marker" 2>/dev/null | grep '/release/' | head -1)
rm -f "$marker"
[ -n "$apk" ] || die "the build produced no release APK"

# ---- the built file must be what we think it is
"$apksigner" verify --print-certs "$apk" > /tmp/wh-apksigner.$$ 2>&1 || { cat /tmp/wh-apksigner.$$ >&2; rm -f /tmp/wh-apksigner.$$; die "apksigner rejects $apk: not a validly signed APK"; }
cert=$(sed -n 's/.*certificate SHA-256 digest: //p' /tmp/wh-apksigner.$$ | head -1)
rm -f /tmp/wh-apksigner.$$
built=$("$aapt2" dump badging "$apk" | sed -n "s/.*versionCode='\([0-9]*\)'.*/\1/p" | head -1)
[ "$built" = "$code" ] || die "the APK says versionCode ${built:-?}, expected $code: the version bump did not reach the build"

hash=$(sha256sum "$apk" | cut -d' ' -f1)
size=$(wc -c < "$apk")
out=$(mktemp -d)/wellness-hub-$ver.apk
cp "$apk" "$out"

echo
echo "  version       $ver   (versionCode $built)"
echo "  file          $out"
echo "  size          $size bytes"
echo "  abis          $(unzip -l "$apk" | grep -o 'lib/[^/]*/' | sort -u | tr -d '/' | sed 's/^lib//' | tr '\n' ' ')"
echo "  sha256        $hash"
echo "  signing cert  ${cert:-unknown}   <- compare with the copy installed on the phone"
echo "  tag           android-v$ver"

if [ "$publish" = 0 ]; then
  echo
  if [ -n "$problems" ]; then echo "A real release would REFUSE, because:$problems"; else echo "Nothing would stop a real release."; fi
  echo "DRY RUN: nothing was published. Add --publish to create the public release."
  exit 0
fi

notes="${NOTES:-Android build $ver.}

sha256: $hash"
gh release create "android-v$ver" "$out" --title "Wellness Hub $ver (Android)" --notes "$notes" --target "$(git rev-parse HEAD)"

# ---- read back what GitHub actually holds: an upload that corrupts is worse than none
back=$(gh release download "android-v$ver" --pattern '*.apk' --output - | sha256sum | cut -d' ' -f1)
if [ "$back" = "$hash" ]; then
  echo "Published android-v$ver. The asset GitHub serves has the same SHA-256."
else
  echo "WARNING: the published asset's SHA-256 is $back, not $hash. Delete the release: gh release delete android-v$ver --cleanup-tag" >&2
  exit 1
fi
