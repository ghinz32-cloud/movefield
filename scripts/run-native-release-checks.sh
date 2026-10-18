#!/usr/bin/env bash
# Run from mobile/android. Preserve Gradle's failure even if evidence also fails.
set -u
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
evidence_dir=../../native-preview/evidence
mkdir -p "$evidence_dir" || exit 1
set +e
./gradlew :app:assembleRelease :app:lintRelease :app:testReleaseUnitTest --console=plain --no-daemon -PreactNativeArchitectures=arm64-v8a -Porg.gradle.jvmargs="-Xmx5g -XX:MaxMetaspaceSize=1g" 2>&1 | tee "$evidence_dir/gradle-release.log"
pipeline_status=("${PIPESTATUS[@]}")
gradle_status=${pipeline_status[0]}
log_status=${pipeline_status[1]}
printf '%s\n' "$gradle_status" > "$evidence_dir/gradle-release-exit-code.txt"
exit_record_status=$?
report_copy_status=0
mkdir -p "$evidence_dir/unit-test-results" || report_copy_status=$?
# Artifact ZIPs may omit empty directories. Preserve this one without inventing
# an XML report so the publisher can recompute exactly the same no-files facts.
printf '%s\n' 'Actual TEST-*.xml reports are copied here when present. This file is not a test result.' > "$evidence_dir/unit-test-results/README.txt" || report_copy_status=$?
shopt -s nullglob
for report in app/build/test-results/testReleaseUnitTest/TEST-*.xml; do
  if [[ -L "$report" || ! -f "$report" ]]; then report_copy_status=1; continue; fi
  cp -- "$report" "$evidence_dir/unit-test-results/" || report_copy_status=$?
done
python3 "$script_dir/record-native-test-evidence.py" --log "$evidence_dir/gradle-release.log" --results "$evidence_dir/unit-test-results" --gradle-exit-code "$gradle_status" --output "$evidence_dir/native-test-evidence.json" --app "${EXPO_PUBLIC_APP_VARIANT:-}" --source-file "$evidence_dir/source.txt"
evidence_status=$?
if (( gradle_status != 0 )); then exit "$gradle_status"; fi
if (( log_status != 0 )); then exit "$log_status"; fi
if (( exit_record_status != 0 )); then exit "$exit_record_status"; fi
if (( report_copy_status != 0 )); then exit "$report_copy_status"; fi
exit "$evidence_status"
