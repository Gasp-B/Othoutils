import type { ReactNode } from 'react';

import styles from './AdminIntro.module.css';

type AdminIntroProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  cta?: ReactNode;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
};

function AdminIntro({
  title,
  subtitle,
  icon,
  cta,
  className,
  titleClassName,
  subtitleClassName,
}: AdminIntroProps) {
  const wrapperClassName = [styles.wrapper, className].filter(Boolean).join(' ');
  const resolvedTitleClassName = [styles.title, titleClassName].filter(Boolean).join(' ');
  const resolvedSubtitleClassName = [styles.subtitle, subtitleClassName]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={wrapperClassName}>
      <div className={styles.overlay}>
        <div className={styles.grid}>
          {icon ? <div className={styles.icon}>{icon}</div> : null}
          <div className={styles.copy}>
            <h1 className={resolvedTitleClassName}>{title}</h1>
            {subtitle ? <p className={resolvedSubtitleClassName}>{subtitle}</p> : null}
          </div>
          {cta ? <div className={styles.actions}>{cta}</div> : null}
        </div>
      </div>
    </section>
  );
}

export default AdminIntro;
