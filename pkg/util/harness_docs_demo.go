package util

// HarnessDocsDemoMarker identifies the Cursor + Harness documentation automation demo.
// Operators enabling this marker in configuration should document the behavior
// under docs/sources/developer-resources/.
const HarnessDocsDemoMarker = "cursor_harness_docs_automation"

// IsHarnessDocsDemoEnabled reports whether the demo marker is active.
func IsHarnessDocsDemoEnabled(marker string) bool {
	return marker == HarnessDocsDemoMarker
}
