import Header from '../components/Header';
import Hero from '../components/Hero';
import ToolsSection from '../components/ToolsSection';

function HomePage() {
  return (
    <>
      <Header />
      <Hero />
      <ToolsSection />

      <footer className="container footer">
        Made with soin pour les équipes d'orthophonie. Mobile first, adaptatif et pensé pour vos collaborations.
      </footer>
    </>
  );
}

export default HomePage;
