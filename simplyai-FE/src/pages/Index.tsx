
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import PricingTable from '@/components/PricingTable';
import { Card, CardContent } from '@/components/ui/card';
import { useSettings } from '@/contexts/SettingsContext';

const Index = () => {
  const { settings } = useSettings();
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-b from-simoly-accent-purple/30 to-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight bg-gradient-to-r from-simoly-purple to-simoly-purple-dark bg-clip-text text-transparent mb-6 animate-fade-in">
              Report personalizzati con l'intelligenza artificiale
            </h1>
            <p className="text-lg md:text-xl text-simoly-gray-dark max-w-3xl mx-auto mb-8 animate-fade-in" style={{animationDelay: '0.1s'}}>
              Rispondi al nostro questionario intelligente e ricevi istantaneamente un report dettagliato e personalizzato creato dall'AI con grafici, analisi e suggerimenti.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in" style={{animationDelay: '0.2s'}}>
              <Button asChild size="lg" className="rounded-full bg-simoly-purple hover:bg-simoly-purple-dark">
                <Link to="/register">
                  Inizia ora <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link to="/guide">
                  Scopri di più
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent h-20 bottom-0 z-10"></div>
            <div className="max-w-5xl mx-auto rounded-2xl shadow-2xl overflow-hidden border border-simoly-accent-purple animate-fade-in" style={{animationDelay: '0.3s'}}>
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop" 
                alt="SimolyAI Dashboard Preview" 
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Come funziona SimolyAI</h2>
            <p className="text-lg text-simoly-gray-dark max-w-3xl mx-auto">
              Un processo semplice in tre passi per ottenere il tuo report personalizzato
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Compila il questionario",
                description: "Rispondi alle domande del nostro questionario intelligente, progettato per raccogliere le informazioni necessarie per un'analisi approfondita.",
                icon: "📝"
              },
              {
                title: "L'AI crea il report",
                description: "La nostra intelligenza artificiale analizza le tue risposte e genera un report completo con testi, grafici e suggerimenti personalizzati.",
                icon: "🤖"
              },
              {
                title: "Ricevi i risultati",
                description: "Ottieni immediatamente il tuo report personalizzato, scaricabile in PDF e sempre accessibile dalla tua dashboard utente.",
                icon: "📊"
              }
            ].map((feature, idx) => (
              <Card key={idx} className="border-2 border-simoly-gray-light rounded-3xl card-hover">
                <CardContent className="p-8 text-center">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-simoly-gray-dark">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <Button asChild size="lg" className="rounded-full bg-simoly-purple hover:bg-simoly-purple-dark">
              <Link to="/guide">
                Scopri tutti i dettagli
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section className="py-20 px-6 lg:px-8 bg-simoly-gray-light">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Prezzi trasparenti</h2>
            <p className="text-lg text-simoly-gray-dark max-w-3xl mx-auto">
              Scegli il piano più adatto alle tue esigenze
            </p>
          </div>
          
          <PricingTable />
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-20 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Cosa dicono i nostri utenti</h2>
            <p className="text-lg text-simoly-gray-dark max-w-3xl mx-auto">
              Migliaia di persone hanno già beneficiato dei nostri report personalizzati
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                quote: "Il report generato da SimolyAI mi ha fornito insight che non avrei mai considerato. Incredibilmente utile!",
                author: "Marco B.",
                role: "Imprenditore"
              },
              {
                quote: "Facile da usare e risultati immediati. I grafici sono bellissimi e le analisi sono sorprendentemente accurate.",
                author: "Laura T.",
                role: "Manager"
              },
              {
                quote: "Ho usato SimolyAI per la mia azienda e abbiamo implementato le raccomandazioni con ottimi risultati. Lo consiglio vivamente.",
                author: "Giovanni R.",
                role: "CEO"
              }
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-simoly-accent-purple p-8 rounded-3xl card-hover">
                <p className="text-simoly-gray-dark mb-6 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm text-simoly-gray">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 px-6 lg:px-8 bg-gradient-to-r from-simoly-purple to-simoly-purple-dark text-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Pronto a scoprire il tuo report personalizzato?</h2>
          <p className="text-lg mb-8 opacity-90 max-w-3xl mx-auto">
            Inizia oggi stesso a utilizzare SimolyAI e ottieni un'analisi approfondita generata dall'intelligenza artificiale.
          </p>
          <Button asChild size="lg" variant="secondary" className="rounded-full">
            <Link to="/register">
              Inizia ora <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 px-6 lg:px-8 bg-simoly-gray-dark text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">SimolyAI</h3>
            <p className="text-sm opacity-80">
              Report personalizzati con l'intelligenza artificiale per aiutarti a prendere decisioni migliori.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Pagine</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-sm opacity-80 hover:opacity-100">Home</Link></li>
              <li><Link to="/about" className="text-sm opacity-80 hover:opacity-100">Chi Siamo</Link></li>
              <li><Link to="/guide" className="text-sm opacity-80 hover:opacity-100">Guida</Link></li>
              <li><Link to="/contact" className="text-sm opacity-80 hover:opacity-100">Contatti</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="text-sm opacity-80 hover:opacity-100">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-sm opacity-80 hover:opacity-100">Termini di Servizio</Link></li>
              <li><Link to="/cookies" className="text-sm opacity-80 hover:opacity-100">Cookie Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contatti</h4>
            <ul className="space-y-2">
              <li className="text-sm opacity-80">
                {settings?.site_url ? (
                  <a 
                    href={settings.site_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:opacity-100 transition-opacity"
                  >
                    {settings.site_url}
                  </a>
                ) : (
                  <a 
                    href={`mailto:${settings?.contact_email || 'info@simolyai.com'}`}
                    className="hover:opacity-100 transition-opacity"
                  >
                    {settings?.contact_email || 'info@simolyai.com'}
                  </a>
                )}
              </li>
              <li className="text-sm opacity-80">+39 123 456 7890</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/10 text-center text-sm opacity-60">
          &copy; {new Date().getFullYear()} SimolyAI. Tutti i diritti riservati.
        </div>
      </footer>
    </div>
  );
};

export default Index;
