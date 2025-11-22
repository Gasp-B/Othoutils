export const dynamic = 'force-dynamic';
export const revalidate = 0;

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import TaxonomyManager from './TaxonomyManager';
import styles from './taxonomy-page.module.css';

type PageProps = {
  params: {
    locale: string;
  };
};

export async function generateMetadata({ params: { locale } }: PageProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'taxonomy' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

async function TaxonomyPage({ params: { locale } }: PageProps) {
  const t = await getTranslations({ locale, namespace: 'taxonomy' });

  return (
    <main className={`container section-shell ${styles.page}`}>
      <div className="section-title">
        <span />
        <p className={styles.sectionLabel}>{t('sectionLabel')}</p>
      </div>

      <div className={`glass panel ${styles.introPanel}`}>
        <h1 className={styles.pageTitle}>{t('pageTitle')}</h1>
        <p className={`text-subtle ${styles.pageLead}`}>{t('pageLead')}</p>
      </div>

      <TaxonomyManager />
    </main>
  );
}

export default TaxonomyPage;
