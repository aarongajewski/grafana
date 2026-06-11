package util

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestIsHarnessDocsDemoEnabled(t *testing.T) {
	require.True(t, IsHarnessDocsDemoEnabled(HarnessDocsDemoMarker))
	require.False(t, IsHarnessDocsDemoEnabled("other"))
}
