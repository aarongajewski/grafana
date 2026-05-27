# Onboarding Hub panel

The Onboarding Hub is a hidden built-in panel plugin used by the default home dashboard when the `onboardingHub` feature toggle is enabled.

It provides:

- A live progress checklist for first-run setup tasks.
- One-click provisioning of a TestData-backed sample workspace.
- A bundled What's New feed.
- Per-user dismiss state persisted in local storage.

Files in this plugin:

- `OnboardingHubPanel.tsx` — top-level panel renderer.
- `components/` — checklist, sample workspace, What's New, and dismiss UI.
- `services/` — runtime progress detection and sample workspace provisioning.
- `data/` — What's New manifest and bundled sample dashboards.
- `img/` — plugin icon.
