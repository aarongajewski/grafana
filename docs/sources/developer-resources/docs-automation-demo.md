---
description: Describes the Cursor and Harness documentation automation demo marker.
labels:
  products:
    - enterprise
    - oss
title: Documentation automation demo
menuTitle: Documentation automation demo
weight: 500
---

# Documentation automation demo

This page describes the demo marker used by the Cursor and Harness documentation automation pipeline. Use it when you enable or extend the demo in Grafana development workflows.

Before you begin, ensure you have the following:

- Access to the Grafana repository and its `docs/sources/` tree
- Familiarity with the documentation style guide in `docs/AGENTS.md`

## Demo marker

The `HarnessDocsDemoMarker` constant in `pkg/util/harness_docs_demo.go` identifies when the documentation automation demo is active. Its value is `cursor_harness_docs_automation`.

Call `IsHarnessDocsDemoEnabled` to check whether a configuration marker matches the demo:

```go
util.IsHarnessDocsDemoEnabled(marker)
```

The function returns `true` when `marker` equals `HarnessDocsDemoMarker`.

## Pipeline behavior

When the demo runs on a pull request, a Cursor agent reads the PR diff and updates pages under `docs/sources/` so documentation matches the code changes. The agent follows the rules in `docs/AGENTS.md` and only edits documentation files.

If a change introduces or updates `HarnessDocsDemoMarker` or `harness_docs_demo.go`, add or update a short developer note on this page.

## Related resources

- Refer to [Developer resources]({{< relref "./_index" >}}) for other developer-oriented documentation.
- Refer to [Contribute to Grafana]({{< relref "./contribute/_index" >}}) for contribution workflows and pull request guidance.
