import { css } from '@emotion/css';

import { type GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { TextLink, useStyles2 } from '@grafana/ui';

import whatsNew from '../data/whatsNew.json';
import { type WhatsNewEntry } from '../types';

const entries: WhatsNewEntry[] = whatsNew;

export function WhatsNewCard() {
  const styles = useStyles2(getStyles);

  return (
    <section className={styles.card} aria-label={t('onboardinghub.whats-new.label', "What's new")}>
      <h3 className={styles.title}>
        <Trans i18nKey="onboardinghub.whats-new.title">What&apos;s new</Trans>
      </h3>
      <div className={styles.entries}>
        {entries.map((entry, index) => (
          <article key={`${entry.version}-${entry.title}`} className={styles.entry}>
            <div className={styles.meta}>
              <Trans
                i18nKey="onboardinghub.whats-new.version-date"
                values={{ version: entry.version, date: entry.date }}
              >
                Grafana {'{{version}}'} · {'{{date}}'}
              </Trans>
            </div>
            <h4 className={styles.entryTitle}>{getEntryTitle(index, entry.title)}</h4>
            <p className={styles.summary}>{getEntrySummary(index, entry.summary)}</p>
            <TextLink href={entry.href} external inline={false}>
              <Trans i18nKey="onboardinghub.whats-new.read-more">Read more</Trans>
            </TextLink>
          </article>
        ))}
      </div>
    </section>
  );
}

function getEntryTitle(index: number, fallback: string) {
  switch (index) {
    case 0:
      return <Trans i18nKey="onboardinghub.whats-new.entry-0-title">Explore faster with guided first-run steps</Trans>;
    case 1:
      return <Trans i18nKey="onboardinghub.whats-new.entry-1-title">Sample workspace in one click</Trans>;
    case 2:
      return <Trans i18nKey="onboardinghub.whats-new.entry-2-title">Dashboards are easier to organize</Trans>;
    case 3:
      return <Trans i18nKey="onboardinghub.whats-new.entry-3-title">Alerting setup keeps improving</Trans>;
    default:
      return fallback;
  }
}

function getEntrySummary(index: number, fallback: string) {
  switch (index) {
    case 0:
      return (
        <Trans i18nKey="onboardinghub.whats-new.entry-0-summary">
          Track setup progress from the home dashboard and jump directly to the next best action.
        </Trans>
      );
    case 1:
      return (
        <Trans i18nKey="onboardinghub.whats-new.entry-1-summary">
          Create TestData-backed dashboards for web traffic, systems, and business metrics without external
          dependencies.
        </Trans>
      );
    case 2:
      return (
        <Trans i18nKey="onboardinghub.whats-new.entry-2-summary">
          Folder and dashboard workflows now surface common actions closer to where you work.
        </Trans>
      );
    case 3:
      return (
        <Trans i18nKey="onboardinghub.whats-new.entry-3-summary">
          New alert rule experiences make it simpler to connect signals to notifications.
        </Trans>
      );
    default:
      return fallback;
  }
}

const getStyles = (theme: GrafanaTheme2) => ({
  card: css({
    background: theme.colors.background.primary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(2),
    minHeight: '100%',
    overflow: 'visible',
  }),
  title: css({
    margin: 0,
  }),
  entries: css({
    display: 'grid',
    gap: theme.spacing(1.25),
    marginTop: theme.spacing(1.5),
  }),
  entry: css({
    borderTop: `1px solid ${theme.colors.border.weak}`,
    paddingTop: theme.spacing(1.25),

    '&:first-child': {
      borderTop: 0,
      paddingTop: 0,
    },
  }),
  meta: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  entryTitle: css({
    margin: theme.spacing(0.5, 0),
  }),
  summary: css({
    color: theme.colors.text.secondary,
    margin: theme.spacing(0, 0, 0.75),
  }),
});
