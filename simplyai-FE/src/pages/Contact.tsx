import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Mail, Phone, MapPin } from "lucide-react";
import { fetchPageData } from "@/services/pagesService";
import { useSettings } from "@/contexts/SettingsContext";
import Footer from "@/components/Footer";

const Contact = () => {
  const { settings } = useSettings();
  const [pageData, setPageData] = useState<{ id: string; title: string; content?: string } | null>(null);

  // ✅ Editable contact info — DB se aata hai, fallback hardcoded values
  const [contactInfo, setContactInfo] = useState({
    heading: "Contattaci",
    description: "Siamo qui per rispondere a tutte le tue domande e aiutarti a ottenere il massimo dalla nostra piattaforma.",
    email: "info@simolyai.com",
    phone: "+39 123 456 7890",
    address: "Via Roma 123, 00100 Roma, Italy",
    formHeading: "Inviaci un messaggio",
    successMsg: "Messaggio inviato con successo! Ti risponderemo al più presto.",
  });
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simula l'invio del form
    setTimeout(() => {
      toast.success(
        "Messaggio inviato con successo! Ti risponderemo al più presto."
      );
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
      setIsSubmitting(false);
    }, 1000);
  };

  // Carica i dati dalla pagina contact — HTML se text extract karo
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchPageData("contact");
      if (data && data.content) {
        setPageData(data);

        // ✅ HTML se plain text extract karo taake contactInfo update ho
        // Ye browser ka DOMParser use karta hai — safe aur reliable
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(data.content, "text/html");

          // simply-blocks-data se blocks parse karo
          const commentRegex = /<!--\s*simply-blocks-data:([A-Za-z0-9+/=]+)\s*-->/;
          const match = data.content.match(commentRegex);

          if (match && match[1]) {
            const blocks = JSON.parse(decodeURIComponent(escape(atob(match[1]))));

            // Block 1 (full) = heading + description
            if (blocks[0]?.content?.[0]) {
              const block1Doc = parser.parseFromString(blocks[0].content[0], "text/html");
              const h1 = block1Doc.querySelector("h1, h2, h3");
              const p = block1Doc.querySelector("p");
              setContactInfo(prev => ({
                ...prev,
                ...(h1?.textContent ? { heading: h1.textContent.trim() } : {}),
                ...(p?.textContent ? { description: p.textContent.trim() } : {}),
              }));
            }

            // Block 2 col 1 = email, phone, address
            if (blocks[1]?.content?.[0]) {
              const col1Doc = parser.parseFromString(blocks[1].content[0], "text/html");
              const paras = col1Doc.querySelectorAll("p");
              const extracted: string[] = [];
              paras.forEach(p => {
                const t = p.textContent?.trim();
                if (t) extracted.push(t);
              });
              // extracted order: email value, phone value, address value
              // (after label headings are h3)
              const values = extracted.filter(t =>
                t.includes("@") || t.match(/\+?[\d\s]{6,}/) || t.length > 5
              );
              if (values[0]) setContactInfo(prev => ({ ...prev, email: values[0] }));
              if (values[1]) setContactInfo(prev => ({ ...prev, phone: values[1] }));
              if (values[2]) setContactInfo(prev => ({ ...prev, address: values[2] }));
            }

            // Block 2 col 2 = formHeading
            if (blocks[1]?.content?.[1]) {
              const col2Doc = parser.parseFromString(blocks[1].content[1], "text/html");
              const h2 = col2Doc.querySelector("h1, h2, h3, strong, b");
              if (h2?.textContent) {
                setContactInfo(prev => ({ ...prev, formHeading: h2.textContent!.trim() }));
              }
            }
          }
        } catch (e) {
          // Parse failed — fallback values use karo
          console.log("Contact parse fallback:", e);
        }
      }
    };
    loadData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-grow py-16 px-4 bg-gradient-to-b from-white to-[var(--color-primary-100)] mt-12 md:mt-0">
        <div className="max-w-7xl mx-auto">
          
          {/* SEZIONE 1: Heading + Description — Page Editor se editable */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4">{contactInfo.heading}</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {contactInfo.description}
            </p>
          </div>

          {/* SEZIONE 2: Layout Fisso (Cards & Form React Funzionante) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            
            {/* Info di contatto */}
            <div className="md:col-span-1 space-y-8">
              <div className="bg-[var(--color-secondary)] p-6 rounded-xl shadow-sm hover:drop-shadow-md transition-all duration-300">
                <div className="flex items-start">
                  <div className="bg-[var(--color-primary-100)] p-3 rounded-lg mr-4">
                    <Mail className="h-6 w-6 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg mb-1">Email</h3>
                    <p className="text-gray-600">{contactInfo.email}</p>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--color-secondary)] p-6 rounded-xl shadow-sm hover:drop-shadow-md transition-all duration-300">
                <div className="flex items-start">
                  <div className="bg-[var(--color-primary-100)] p-3 rounded-lg mr-4">
                    <Phone className="h-6 w-6 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg mb-1">Telefono</h3>
                    <p className="text-gray-600">{contactInfo.phone}</p>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--color-secondary)] p-6 rounded-xl shadow-sm hover:drop-shadow-md transition-all duration-300">
                <div className="flex items-start">
                  <div className="bg-[var(--color-primary-100)] p-3 rounded-lg mr-4">
                    <MapPin className="h-6 w-6 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg mb-1">Indirizzo</h3>
                    <p className="text-gray-600">{contactInfo.address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form di contatto React */}
            <div className="md:col-span-2 bg-[var(--color-secondary)] p-8 rounded-xl shadow-sm">
              <h2 className="text-2xl font-semibold mb-6">{contactInfo.formHeading}</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Nome
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Il tuo nome"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="La tua email"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Oggetto
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Oggetto del messaggio"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Messaggio
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Il tuo messaggio"
                    rows={5}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full py-6 rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-700)] text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Invio in corso..." : "Invia messaggio"}
                </Button>
              </form>
            </div>
          </div>
          
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Contact;