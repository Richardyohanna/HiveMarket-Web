import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import HowItWorks from './components/HowItWorks';
import FAQ from './components/FAQ';
import Footer from './components/Footer';


function App() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
       <Hero />
       <About />
       <HowItWorks />
       <FAQ />
       <Footer />
      </main>
    </div>
  );
}

export default App;