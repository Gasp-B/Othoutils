export const dynamic = 'force-dynamic';
export const revalidate = 0;

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import AdminIntro from '@/components/admin/AdminIntro';

import TaxonomyManager from './TaxonomyManager';
import styles from './taxonomy-page.module.css';

type PageProps = {
  params: {
    locale: string;
  };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await Promise.resolve(params);
  const t = await getTranslations({ locale, namespace: 'taxonomy' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

async function TaxonomyPage({ params }: PageProps) {
  const { locale } = await Promise.resolve(params);
  const t = await getTranslations({ locale, namespace: 'taxonomy' });

  const introIcon = (
    <svg aria-hidden="true" fill="none" height="28" viewBox="0 0 28 28" width="28">
      <path
        d="M21.5834 10.5V7.58334C21.5834 6.57955 20.7665 5.75 19.75 5.75H6.41671C5.4002 5.75 4.58337 6.57955 4.58337 7.58334V20.4167C4.58337 21.4205 5.4002 22.25 6.41671 22.25H16.3334"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
      <path
        d="M10.0625 5.25V7.58333"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
      <path
        d="M16.1042 5.25V7.58333"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
      <path
        d="M7.31665 11.375H18.85"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
      <path
        d="M20.2917 16.2292C20.2917 16.0634 20.4275 15.925 20.5938 15.925H21.4042V15.125C21.4042 14.9583 21.5425 14.8201 21.7084 14.8201C21.8742 14.8201 22.0125 14.9583 22.0125 15.125V15.925H22.8229C22.9888 15.925 23.125 16.0634 23.125 16.2292C23.125 16.3951 22.9888 16.5313 22.8229 16.5313H22.0125V17.3313C22.0125 17.498 21.8742 17.6363 21.7084 17.6363C21.5425 17.6363 21.4042 17.498 21.4042 17.3313V16.5313H20.5938C20.4275 16.5313 20.2917 16.3951 20.2917 16.2292Z"
        fill="currentColor"
      />
      <path
        d="M21.7083 22.75C19.5655 22.75 17.8125 20.997 17.8125 18.8542C17.8125 16.7115 19.5655 14.9584 21.7083 14.9584C23.8512 14.9584 25.6042 16.7115 25.6042 18.8542C25.6042 20.997 23.8512 22.75 21.7083 22.75Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  );

  return (
    <main className={`container section-shell ${styles.page}`}>
      <div className="section-title">
        <span />
        <p className={styles.sectionLabel}>{t('sectionLabel')}</p>
      </div>

      <AdminIntro
        icon={introIcon}
        subtitle={t('pageLead')}
        subtitleClassName={styles.pageLead}
        title={t('pageTitle')}
        titleClassName={styles.pageTitle}
      />

      <TaxonomyManager />
    </main>
  );
}

export default TaxonomyPage;
