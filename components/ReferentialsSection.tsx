import { getLocale, getTranslations } from 'next-intl/server';
import { type Locale } from '@/i18n/routing';
import { getTestsWithMetadata } from '@/lib/tests/queries';
import type { TestDto } from '@/lib/validation/tests';
import styles from './referentials-section.module.css';

function groupTestsByDomain(tests: TestDto[], fallbackDomain: string) {
  const grouped = new Map<string, TestDto[]>();

  for (const test of tests) {
    const domainLabels = test.domains.length > 0 ? test.domains : [fallbackDomain];

    for (const domainLabel of domainLabels) {
      const existing = grouped.get(domainLabel) ?? [];
      grouped.set(domainLabel, [...existing, test]);
    }
  }

  return Array.from(grouped.entries()).sort(([domainA], [domainB]) => domainA.localeCompare(domainB));
}

async function ReferentialsSection() {
  const t = await getTranslations('Referentials');
  const shared = await getTranslations('Shared');
  const locale = (await getLocale()) as Locale;

  let tests: TestDto[] = [];
  let loadError: string | null = null;

  try {
    tests = await getTestsWithMetadata(locale);
  } catch (error) {
    console.error('Failed to fetch referentials from tests catalog', error);
    loadError = t('errors.load');
  }

  const fallbackDomain = t('fallbackDomain');
  const domainsWithTests = groupTestsByDomain(tests, fallbackDomain);

  return (
    <section id="referentiels" className="container section-shell">
      <div className="section-title">
        <span />
        <p className={styles.sectionLabel}>{t('sectionLabel')}</p>
      </div>

      {loadError && (
        <div className={`glass panel ${styles.errorPanel}`}>
          <div>
            <p className={styles.errorTitle}>{t('errorTitle')}</p>
            <p className={`text-subtle ${styles.errorSubtitle}`}>{loadError}</p>
          </div>
        </div>
      )}

      <div className="card-grid">
        {domainsWithTests.map(([domainLabel, domainTests]) => (
          <article key={domainLabel} className={`glass panel panel-muted ${styles.referentialCard}`}>
            <div className={styles.referentialHeader}>
              <div>
                <p className={styles.cardTitle}>{domainLabel}</p>
              </div>
              <span className="badge validated">{shared('statuses.referential')}</span>
            </div>

            <div className={`tag-row ${styles.subsectionRow}`}>
              {domainTests.map((test) => (
                <span key={test.id} className={`tag ${styles.subsectionTag}`}>
                  {test.name}
                </span>
              ))}
            </div>

            {domainTests.some((test) => test.tags.length > 0) && (
              <div className={`tag-row ${styles.tagRowTight}`}>
                {domainTests.flatMap((test) =>
                  test.tags.map((tag) => (
                    <span key={`${test.id}-${tag}`} className={`tag ${styles.lightTag}`}>
                      #{tag}
                    </span>
                  )),
                )}
              </div>
            )}
          </article>
        ))}
      </div>

      {domainsWithTests.length === 0 && (
        <p className={`text-subtle ${styles.emptyState}`}>
          {t('emptyState')}
        </p>
      )}
    </section>
  );
}

export default ReferentialsSection;
