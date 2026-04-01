import React, { useEffect } from "react";
import Navbar from "@/components/Navbar";
import { fetchPageData, savePageData } from "@/services/pagesService";
import Footer from "@/components/Footer";

// Define the Page type
type Page = { id: string; title: string; content: string };

// Static JSX content for the About page
const data = (
  <div className="min-h-screen flex flex-col" id="aboutJSX">
    <Navbar />

    <div className="flex-grow py-16 px-4 bg-[var(--color-secondary)]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Chi Siamo</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Aiutiamo le aziende a crescere e migliorare attraverso
            l'intelligenza artificiale.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-[var(--color-secondary)] p-8 rounded-xl shadow-sm mb-12">
            <h2 className="text-2xl font-semibold mb-4">La nostra missione</h2>
            <p className="text-gray-700 mb-6">
              SimolyAI nasce con l'obiettivo di rendere l'intelligenza
              artificiale accessibile a tutte le aziende, indipendentemente
              dalla loro dimensione. Crediamo che ogni impresa meriti di avere
              accesso a strumenti avanzati che possano aiutarla a crescere e a
              prosperare.
            </p>
            <p className="text-gray-700">
              La nostra piattaforma è stata progettata per essere semplice da
              usare ma potente nei risultati, offrendo analisi approfondite e
              consigli pratici che possono essere implementati immediatamente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-[var(--color-secondary)] p-6 rounded-xl shadow-sm">
              <h3 className="font-medium text-lg mb-2">La nostra visione</h3>
              <p className="text-gray-600">
                Immaginiamo un futuro in cui ogni decisione aziendale è
                supportata da dati e analisi intelligenti, permettendo alle
                imprese di tutte le dimensioni di competere ad armi pari nel
                mercato globale.
              </p>
            </div>
            <div className="bg-[var(--color-secondary)] p-6 rounded-xl shadow-sm">
              <h3 className="font-medium text-lg mb-2">I nostri valori</h3>
              <p className="text-gray-600">
                Innovazione, accessibilità e trasparenza sono i valori
                fondamentali che guidano ogni aspetto del nostro lavoro, dalla
                progettazione del prodotto al supporto clienti.
              </p>
            </div>
          </div>

          <div className="bg-[var(--color-secondary)] p-8 rounded-xl shadow-sm mb-12">
            <h2 className="text-2xl font-semibold mb-6">Il nostro team</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: "Marco Rossi",
                  role: "CEO & Fondatore",
                  bio: "Esperto in intelligenza artificiale con oltre 10 anni di esperienza nel settore.",
                },
                {
                  name: "Laura Bianchi",
                  role: "CTO",
                  bio: "Specialista in machine learning e sviluppo di algoritmi predittivi.",
                },
                {
                  name: "Giovanni Verdi",
                  role: "Responsabile Clienti",
                  bio: "Dedicato a garantire che ogni cliente ottenga il massimo valore dalla nostra piattaforma.",
                },
              ].map((person, i) => (
                <div key={i} className="text-center">
                  <div className="w-24 h-24 rounded-full bg-[var(--color-primary-100)] mx-auto mb-4 flex items-center justify-center">
                    <span className="text-[var(--color-primary)] text-2xl font-bold">
                      {person.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-medium text-lg">{person.name}</h3>
                  <p className="text-[var(--color-primary)] mb-2">
                    {person.role}
                  </p>
                  <p className="text-gray-600">{person.bio}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Unisciti a noi</h2>
            <p className="text-lg text-gray-600 mb-6">
              Scopri come la nostra piattaforma può aiutare la tua azienda a
              raggiungere nuovi livelli di successo.
            </p>
            <a
              href="/pricing"
              className="inline-block bg-[var(--color-primary)] hover:bg-[var(--color-primary-700)] text-white font-medium px-8 py-3 rounded-full transition-colors"
            >
              Inizia ora
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const About = () => {
  const [pageData, setPageData] = React.useState<Page>({
    id: "home",
    title: "Home",
    content: { __html: data }.toString(),
  });

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchPageData("about");
      setPageData(data);
    };
    loadData();
  }, []);

  // useEffect(() => {
  //   const savePageDataDB = async () => {
  //       const data = document.getElementById('aboutJSX');
  //       console.log(data);
  //       const response = await savePageData({id: "about", title: "Chi Siamo", content: data.innerHTML});
  //     }
  //       savePageDataDB();
  // }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div dangerouslySetInnerHTML={{ __html: pageData.content }}></div>
      <Footer/>
    </div>
  );
};

export default About;
