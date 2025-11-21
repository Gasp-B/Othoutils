function Header() {
  return (
    <header className="top-banner">
      <div className="container top-banner__content">
        <div className="top-banner__identity">
          <div className="top-banner__mark" aria-hidden>
            OT
          </div>
          <div>
            <p className="top-banner__title">Othoutils</p>
            <p className="top-banner__subtitle">Référentiels cliniques validés par des orthophonistes</p>
          </div>
        </div>

        <nav className="top-banner__nav" aria-label="Navigation principale">
          <a href="#catalogue" className="top-banner__link">
            Catalogue
          </a>
          <a href="#collaboration" className="top-banner__link">
            Collaboration
          </a>
          <a href="/tools/new" className="top-banner__link">
            Ajouter un outil
          </a>
          <a href="/administration" className="top-banner__link">
            Administration
          </a>
        </nav>
      </div>
    </header>
  );
}

export default Header;
