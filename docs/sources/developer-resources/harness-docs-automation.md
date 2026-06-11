---
description: Documents the Harness docs automation demo marker in pkg/util.
keywords:
  - grafana
  - documentation
  - developers
  - harness
labels:
  products:
    - enterprise
    - oss
title: Harness docs automation marker
weight: 300
---

# Harness docs automation marker

This page documents the demo marker that identifies the Cursor + Harness documentation automation workflow. Use it when you enable or test the demo marker in configuration.

Before you begin, ensure you have the following:

- **Repository checkout:** A local clone that includes `pkg/util/harness_docs_demo.go`.
- **Docs automation context:** Familiarity with the runner in `scripts/docs-automation/`.

## Marker constant

Grafana defines the demo marker in `pkg/util/harness_docs_demo.go` as `HarnessDocsDemoMarker`. The marker value is `cursor_harness_docs_automation`.

Operators who enable this marker in configuration should keep the matching developer note in `docs/sources/developer-resources/` up to date when the marker behavior changes.

## Check if the marker is active

The `IsHarnessDocsDemoEnabled` function in `pkg/util/harness_docs_demo.go` reports whether a marker string matches `HarnessDocsDemoMarker`. It returns `true` when the input equals `cursor_harness_docs_automation`, and `false` otherwise.

The following example shows how to call the helper from Go code:

```go
import "github.com/grafana/grafana/pkg/util"

enabled := util.IsHarnessDocsDemoEnabled(marker)
```

Replace `marker` with the configured marker string you want to validate.

## Related resources

- **Local dry run:** Refer to `scripts/docs-automation/README.md` for pipeline setup and dry-run commands.
- **Contributing:** Refer to [Contribute to Grafana]({{< relref "./contribute/" >}}) for general contribution guidance.
