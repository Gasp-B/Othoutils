import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import TestForm from './TestForm';
import styles from './manage-page.module.css';
import { locales, type Locale } from '@/i18n/routing';

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'ManageTests.metadata' });

  return {
    title: t('title'),
    description: t('description'),
    metadataBase: new URL('https://othoutils.example.com'),
  };
}

export default async function ManageTestsPage() {
  const t = await getTranslations('ManageTests.page');

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

      <TestForm />
    </main>
  );
}
