---
description: Reference for the Cursor and Harness documentation automation demo marker.
labels:
  products:
    - enterprise
    - oss
title: Harness docs demo marker
weight: 500
---

# Harness docs demo marker

This page describes the demo marker used by the Cursor and Harness documentation automation demo. Use it when you enable or test the marker in Grafana configuration or demo pipelines.

Before you begin, ensure you have the following:

- Access to the Grafana source repository.
- Familiarity with Go packages under `pkg/util/`.

## Marker constant

Grafana defines a single marker string in `pkg/util/harness_docs_demo.go`:

- **Name:** `HarnessDocsDemoMarker`
- **Value:** `cursor_harness_docs_automation`

The constant identifies the Cursor and Harness documentation automation demo. When you enable this marker in configuration, document the behavior in `docs/sources/developer-resources/`.

## Check whether the marker is active

The `IsHarnessDocsDemoEnabled` function in `pkg/util` reports whether a given marker string matches `HarnessDocsDemoMarker`:

```go
import "github.com/grafana/grafana/pkg/util"

enabled := util.IsHarnessDocsDemoEnabled(marker)
```

The function returns `true` only when `marker` equals `cursor_harness_docs_automation`.

## Related resources

- Refer to the [Developer resources]({{< relref "./_index.md" >}}) section for other developer-oriented documentation.
