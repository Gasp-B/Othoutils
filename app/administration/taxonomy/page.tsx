export const dynamic = 'force-dynamic';
export const revalidate = 0;

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import TaxonomyManager from './TaxonomyManager';
import styles from './taxonomy-page.module.css';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('TaxonomyAdmin.metadata');

  return {
    title: t('title'),
    description: t('description'),
    metadataBase: new URL('https://othoutils.example.com'),
  };
}

async function TaxonomyPage() {
  const t = await getTranslations('TaxonomyAdmin.page');

  return (
    <main className={`container section-shell ${styles.page}`}>
      <div className="section-title">
        <span />
        <p className={styles.sectionLabel}>{t('sectionLabel')}</p>
      </div>

      <div className={`glass panel ${styles.introPanel}`}>
        <h1 className={styles.pageTitle}>{t('title')}</h1>
        <p className={`text-subtle ${styles.pageLead}`}>
          {t('lead')}
        </p>
      </div>

      <TaxonomyManager />
    </main>
  );
}

export default TaxonomyPage;
