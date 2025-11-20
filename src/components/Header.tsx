import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="top-banner">
      <div className="container">
        <div className="glass top-banner__content">
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
                display: 'grid',
                placeItems: 'center',
                color: '#0b1223',
                fontWeight: 900,
                letterSpacing: '0.04em',
              }}
            >
              OT
            </div>
            <div>
              <p style={{ margin: 0, color: '#e2e8f0', fontWeight: 800 }}>Othoutils</p>
              <small style={{ color: 'rgba(255,255,255,0.65)' }}>
                Référentiel collaboratif d'outils d'orthophonie
              </small>
            </div>
          </div>
          <nav className="top-banner__nav">
            <a href="#top" className="secondary-btn top-banner__link">
              Accueil
            </a>
            <a href="#catalogue" className="secondary-btn top-banner__link">
              Catalogue
            </a>
            <a href="#collaboration" className="secondary-btn top-banner__link">
              Collaboration
            </a>
            <a href="#collaboration" className="primary-btn top-banner__cta">
              Soumettre une idée
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
