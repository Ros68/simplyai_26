import type { ChartConfig } from '@/services/prompt-templates';

export interface ChartTypeOption {
  value: string;
  label: string;
  group: string;
}

// TUTTI I TIPI DI GRAFICI APEXCHARTS - Aggiornato con tutti i tipi supportati
export const chartTypeOptions: ChartTypeOption[] = [
  // Base charts
  { value: 'bar', label: 'Barre Orizzontali', group: 'Base' },
  { value: 'column', label: 'Colonne (Barre Verticali)', group: 'Base' },
  { value: 'line', label: 'Linee', group: 'Base' },
  { value: 'area', label: 'Area', group: 'Base' },
  { value: 'pie', label: 'Torta', group: 'Base' },
  { value: 'donut', label: 'Ciambella', group: 'Base' },
  { value: 'radialBar', label: 'Barre Radiali', group: 'Base' },
  { value: 'polarArea', label: 'Area Polare', group: 'Base' },

  // Specializzati
  { value: 'scatter', label: 'Dispersione (Scatter)', group: 'Specializzati' },
  { value: 'bubble', label: 'Bolle (Bubble)', group: 'Specializzati' },
  { value: 'heatmap', label: 'Mappa di Calore', group: 'Specializzati' },
  { value: 'candlestick', label: 'Candlestick (Finanziario)', group: 'Specializzati' },
  { value: 'boxPlot', label: 'Box Plot', group: 'Specializzati' },
  { value: 'treemap', label: 'Treemap', group: 'Specializzati' },
  { value: 'radar', label: 'Radar (Ragnatela)', group: 'Specializzati' },
  { value: 'rangeBar', label: 'Barre Range (Gantt)', group: 'Specializzati' },
  { value: 'rangeArea', label: 'Area Intervallo', group: 'Specializzati' },
  
  // Funnel e Pyramid
  { value: 'funnel', label: 'Funnel (Imbuto)', group: 'Specializzati' },
  { value: 'pyramid', label: 'Piramide', group: 'Specializzati' },

  // Combinati
  { value: 'mixed', label: 'Misto (Linee + Colonne)', group: 'Combinati' },
  { value: 'combo', label: 'Combo (Multi-asse)', group: 'Combinati' },
];

// Opzioni estese per le tabelle con più stili
export interface TableTypeOption {
  value: string;
  label: string;
  description?: string;
}

export const tableTypeOptions: TableTypeOption[] = [
  { value: 'simple', label: 'Semplice', description: 'Tabella base con righe e colonne' },
  { value: 'comparison', label: 'Confronto', description: 'Confronto tra diversi set di dati' },
  { value: 'progress', label: 'Progresso', description: 'Visualizza progressi verso obiettivi' },
  { value: 'stats', label: 'Statistiche', description: 'Visualizza statistiche con min/max/media' },
  { value: 'financial', label: 'Finanziaria', description: 'Formattazione per dati finanziari' },
  { value: 'timeline', label: 'Timeline', description: 'Visualizza eventi lungo una linea temporale' },
  { value: 'grid', label: 'Griglia Avanzata', description: 'Griglia con ordinamento e filtri' },
  { value: 'hierarchical', label: 'Gerarchica', description: 'Visualizza relazioni parent-child' },
  { value: 'matrix', label: 'Matrice', description: 'Vista a matrice di dati correlati' },
  { value: 'colorful', label: 'Colorata', description: 'Tabella con colori per celle e righe' },
  { value: 'bordered', label: 'Bordi Evidenziati', description: 'Tabella con bordi spessi e colorati' },
  { value: 'minimal', label: 'Minimalista', description: 'Design pulito con spaziature ampie' },
];

// Palette colori estese
export const colorPalettes = {
  standard: ['#4f46e5', '#2dd4bf', '#fbbf24', '#f87171', '#a78bfa'],
  pastel: ['#67e8f9', '#a7f3d0', '#fde68a', '#fecaca', '#ddd6fe'],
  corporate: ['#1e40af', '#0e7490', '#4d7c0f', '#9f1239', '#6d28d9'],
  monochrome: ['#020617', '#1e293b', '#334155', '#64748b', '#94a3b8'],
  bold: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
  warm: ['#f97316', '#fb923c', '#fbbf24', '#fcd34d', '#fde047'],
  cool: ['#0ea5e9', '#06b6d4', '#14b8a6', '#3b82f6', '#6366f1'],
  rainbow: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#a855f7']
};

// Configurazione completa per tutti i tipi di grafici
export const getDefaultChartConfig = (type: string): ChartConfig => {
  const baseConfig: ChartConfig = {
    colors: colorPalettes.standard,
    height: 350,
    width: '100%',
    animations: {
      enabled: true,
      speed: 800
    },
    tooltip: {
      enabled: true
    },
    legend: {
      show: true,
      position: 'bottom'
    },
    grid: {
      show: true
    },
    dataLabels: {
      enabled: false
    },
    title: {
      text: '',
      align: 'center',
      style: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#1e293b'
      }
    },
    subtitle: {
      text: '',
      align: 'center',
      style: {
        fontSize: '12px',
        color: '#64748b'
      }
    }
  };
  
  // Configurazioni specifiche per tipo di grafico
  switch (type) {
    case 'bar':
    case 'column':
      return {
        ...baseConfig,
        plotOptions: {
          bar: {
            borderRadius: 4,
            horizontal: type === 'bar',
            columnWidth: '70%'
          }
        },
        xaxis: {
          title: {
            text: 'Categorie',
            style: { fontSize: '12px', fontWeight: 600 }
          }
        },
        yaxis: {
          title: {
            text: 'Valori',
            style: { fontSize: '12px', fontWeight: 600 }
          }
        }
      };
      
    case 'line':
    case 'area':
      return {
        ...baseConfig,
        stroke: {
          width: 3,
          curve: 'smooth'
        },
        xaxis: {
          title: {
            text: 'Periodo',
            style: { fontSize: '12px', fontWeight: 600 }
          }
        },
        yaxis: {
          title: {
            text: 'Valori',
            style: { fontSize: '12px', fontWeight: 600 }
          }
        }
      };
      
    case 'pie':
    case 'donut':
      return {
        ...baseConfig,
        plotOptions: {
          pie: {
            donut: {
              size: type === 'donut' ? '65%' : '0%'
            }
          }
        },
        legend: {
          show: true,
          position: 'right'
        }
      };
      
    case 'radar':
      return {
        ...baseConfig,
        stroke: {
          width: 2
        },
        xaxis: {
          categories: ['Categoria 1', 'Categoria 2', 'Categoria 3', 'Categoria 4', 'Categoria 5']
        }
      };
      
    case 'heatmap':
      return {
        ...baseConfig,
        plotOptions: {
          heatmap: {
            shadeIntensity: 0.5,
            radius: 4,
            useFillColorAsStroke: false,
            colorScale: {
              ranges: [
                { from: 0, to: 20, color: '#9BE9A8', name: 'Basso' },
                { from: 21, to: 40, color: '#40C463', name: 'Medio-Basso' },
                { from: 41, to: 60, color: '#30A14E', name: 'Medio' },
                { from: 61, to: 80, color: '#216E39', name: 'Medio-Alto' },
                { from: 81, to: 100, color: '#0D4429', name: 'Alto' }
              ]
            }
          }
        },
        xaxis: {
          title: { text: 'Categorie X' }
        },
        yaxis: {
          title: { text: 'Categorie Y' }
        }
      };
      
    case 'boxPlot':
      return {
        ...baseConfig,
        xaxis: {
          title: { text: 'Categorie' }
        },
        yaxis: {
          title: { text: 'Valori' }
        }
      };
      
    case 'polarArea':
      return {
        ...baseConfig,
        legend: {
          show: true,
          position: 'right'
        }
      };
      
    case 'candlestick':
      return {
        ...baseConfig,
        xaxis: {
          title: { text: 'Data/Ora' }
        },
        yaxis: {
          title: { text: 'Prezzo' }
        }
      };
      
    case 'treemap':
      return {
        ...baseConfig,
        legend: {
          show: false
        }
      };
      
    case 'funnel':
      return {
        ...baseConfig,
        plotOptions: {
          bar: {
            borderRadius: 0,
            horizontal: true,
            barHeight: '80%',
            isFunnel: true
          }
        },
        dataLabels: {
          enabled: true,
          formatter: function (val: any, opt: any) {
            return opt.w.globals.labels[opt.dataPointIndex] + ': ' + val;
          }
        },
        legend: {
          show: false
        },
        xaxis: {
          categories: ['Fase 1', 'Fase 2', 'Fase 3', 'Fase 4', 'Fase 5']
        }
      };
      
    case 'pyramid':
      return {
        ...baseConfig,
        plotOptions: {
          bar: {
            borderRadius: 0,
            horizontal: true,
            barHeight: '80%',
            isFunnel: true,
            isDumbbell: false
          }
        },
        dataLabels: {
          enabled: true
        },
        legend: {
          show: false
        },
        xaxis: {
          categories: ['Livello 1', 'Livello 2', 'Livello 3', 'Livello 4', 'Livello 5']
        }
      };
      
    case 'bubble':
      return {
        ...baseConfig,
        xaxis: {
          title: { text: 'Asse X' }
        },
        yaxis: {
          title: { text: 'Asse Y' }
        }
      };
      
    case 'scatter':
      return {
        ...baseConfig,
        xaxis: {
          title: { text: 'Asse X' }
        },
        yaxis: {
          title: { text: 'Asse Y' }
        }
      };
      
    case 'radialBar':
      return {
        ...baseConfig,
        plotOptions: {
          radialBar: {
            hollow: {
              size: '50%'
            },
            track: {
              background: '#e2e8f0'
            },
            dataLabels: {
              show: true,
              name: {
                fontSize: '14px'
              },
              value: {
                fontSize: '16px',
                fontWeight: 'bold'
              }
            }
          }
        }
      };
      
    default:
      return baseConfig;
  }
};

export interface DataSeriesType {
  name: string;
  data: number[];
}

// Dati demo estesi per TUTTI i tipi di grafici ApexCharts
export const generateDemoData = (chartType: string): any => {
  switch (chartType) {
    case 'bar':
      return {
        labels: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno'],
        datasets: [
          { name: 'Vendite 2024', data: [44, 55, 57, 56, 61, 58] },
          { name: 'Vendite 2023', data: [35, 41, 36, 26, 45, 48] }
        ]
      };

    case 'column':
      return {
        labels: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno'],
        datasets: [
          { name: 'Ricavi', data: [76, 85, 101, 98, 87, 105] },
          { name: 'Costi', data: [45, 52, 48, 55, 58, 62] }
        ]
      };

    case 'line':
    case 'area':
      return {
        labels: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago'],
        datasets: [
          { name: 'Traffico Organico', data: [31, 40, 28, 51, 42, 109, 100, 120] },
          { name: 'Traffico Pagato', data: [11, 32, 45, 32, 34, 52, 41, 55] }
        ]
      };
      
    case 'pie':
    case 'donut':
      return {
        labels: ['Desktop', 'Mobile', 'Tablet', 'Altro'],
        datasets: [
          { data: [44, 55, 13, 33] }
        ]
      };

    case 'radar':
      return {
        labels: ['Velocità', 'Robustezza', 'Usabilità', 'Sicurezza', 'Prestazioni', 'Affidabilità'],
        datasets: [
          { name: 'Prodotto A', data: [80, 50, 30, 40, 70, 20] },
          { name: 'Prodotto B', data: [20, 30, 70, 80, 40, 60] }
        ]
      };
      
    case 'heatmap':
      return {
        labels: ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì'],
        datasets: [
          { name: 'Mattina', data: [21, 43, 54, 35, 26] },
          { name: 'Pomeriggio', data: [42, 33, 15, 37, 28] },
          { name: 'Sera', data: [25, 36, 57, 28, 19] },
          { name: 'Notte', data: [13, 24, 35, 46, 37] }
        ]
      };

    case 'boxPlot':
      return {
        labels: ['Prodotto A', 'Prodotto B', 'Prodotto C', 'Prodotto D'],
        datasets: [
          {
            name: 'Statistiche',
            data: [
              { x: 'Prodotto A', y: [54, 66, 69, 75, 88] },
              { x: 'Prodotto B', y: [43, 65, 69, 76, 81] },
              { x: 'Prodotto C', y: [31, 39, 45, 51, 59] },
              { x: 'Prodotto D', y: [25, 45, 55, 65, 75] }
            ]
          }
        ]
      };
      
    case 'polarArea':
      return {
        labels: ['Marketing', 'Vendite', 'Supporto', 'Sviluppo', 'Risorse Umane'],
        datasets: [
          { data: [42, 39, 35, 29, 26] }
        ]
      };
      
    case 'treemap':
      return {
        datasets: [
          {
            data: [
              { x: 'Marketing', y: 40 },
              { x: 'Vendite', y: 30 },
              { x: 'IT', y: 20 },
              { x: 'HR', y: 10 },
              { x: 'Finanza', y: 15 },
              { x: 'Operazioni', y: 25 }
            ]
          }
        ]
      };
      
    case 'candlestick':
      return {
        datasets: [
          {
            name: 'Prezzo',
            data: [
              { x: new Date(2024, 1, 1).getTime(), y: [6629.81, 6650.5, 6623.04, 6633.33] },
              { x: new Date(2024, 1, 2).getTime(), y: [6632.01, 6643.59, 6620, 6630.11] },
              { x: new Date(2024, 1, 3).getTime(), y: [6630.71, 6648.95, 6623.34, 6635.65] },
              { x: new Date(2024, 1, 4).getTime(), y: [6635.65, 6651, 6629.67, 6638.24] },
              { x: new Date(2024, 1, 5).getTime(), y: [6638.24, 6640, 6620, 6624.47] },
              { x: new Date(2024, 1, 6).getTime(), y: [6624.53, 6636.03, 6621.68, 6624.31] },
              { x: new Date(2024, 1, 7).getTime(), y: [6624.61, 6632.2, 6617, 6626.02] }
            ]
          }
        ]
      };
      
    case 'funnel':
      return {
        labels: ['Visitatori', 'Lead', 'Opportunità', 'Proposte', 'Vendite'],
        datasets: [
          { 
            name: 'Funnel Vendite',
            data: [1380, 1100, 990, 740, 548]
          }
        ]
      };
      
    case 'pyramid':
      return {
        labels: ['Livello 1', 'Livello 2', 'Livello 3', 'Livello 4', 'Livello 5'],
        datasets: [
          { 
            name: 'Piramide',
            data: [100, 80, 60, 40, 20]
          }
        ]
      };
      
    case 'bubble':
      return {
        datasets: [
          {
            name: 'Serie 1',
            data: [
              { x: 10, y: 20, z: 30 },
              { x: 20, y: 30, z: 40 },
              { x: 30, y: 40, z: 50 },
              { x: 40, y: 50, z: 60 }
            ]
          },
          {
            name: 'Serie 2',
            data: [
              { x: 15, y: 25, z: 35 },
              { x: 25, y: 35, z: 45 },
              { x: 35, y: 45, z: 55 }
            ]
          }
        ]
      };
      
    case 'scatter':
      return {
        datasets: [
          {
            name: 'Gruppo A',
            data: [
              [16.4, 5.4], [21.7, 2], [25.4, 3], [19, 2], [10.9, 1], [13.6, 3.2], 
              [10.9, 7.4], [10.9, 0], [10.9, 8.2], [16.4, 0], [16.4, 1.8]
            ]
          },
          {
            name: 'Gruppo B',
            data: [
              [36.4, 13.4], [1.7, 11], [5.4, 8], [9, 17], [1.9, 4], [1.6, 12.2], 
              [12.9, 2.4], [1.9, 14.4], [1.9, 9], [1.9, 13.2], [15.4, 6.6]
            ]
          }
        ]
      };
      
    case 'radialBar':
      return {
        labels: ['Completato', 'In Corso', 'Pianificato', 'In Attesa'],
        datasets: [
          { data: [70, 50, 30, 20] }
        ]
      };
      
    case 'rangeBar':
      return {
        labels: ['Attività 1', 'Attività 2', 'Attività 3', 'Attività 4'],
        datasets: [
          {
            name: 'Pianificazione',
            data: [
              { x: 'Attività 1', y: [new Date('2024-01-01').getTime(), new Date('2024-01-05').getTime()] },
              { x: 'Attività 2', y: [new Date('2024-01-03').getTime(), new Date('2024-01-08').getTime()] },
              { x: 'Attività 3', y: [new Date('2024-01-06').getTime(), new Date('2024-01-12').getTime()] },
              { x: 'Attività 4', y: [new Date('2024-01-10').getTime(), new Date('2024-01-15').getTime()] }
            ]
          }
        ]
      };
      
    case 'rangeArea':
      return {
        labels: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu'],
        datasets: [
          {
            name: 'Range Min',
            data: [10, 15, 12, 18, 20, 25]
          },
          {
            name: 'Range Max',
            data: [25, 30, 28, 35, 38, 42]
          }
        ]
      };
      
    default:
      return {
        labels: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno'],
        datasets: [
          { name: 'Esempio', data: [30, 40, 35, 50, 49, 60] }
        ]
      };
  }
};

// Dati demo estesi per TUTTI i tipi di tabelle
export const generateTableDemo = (tableType: string): any => {
  switch (tableType) {
    case 'comparison':
      return {
        headers: ['Metrica', 'Gruppo A', 'Gruppo B', 'Differenza', 'Var. %'],
        rows: [
          ['Fatturato', '€10,500', '€8,300', '+€2,200', '+26.5%'],
          ['Clienti', '145', '120', '+25', '+20.8%'],
          ['Valore Medio', '€72.4', '€69.2', '+€3.2', '+4.6%'],
          ['Soddisfazione', '4.5/5', '4.2/5', '+0.3', '+7.1%']
        ]
      };
      
    case 'progress':
      return {
        headers: ['Obiettivo', 'Attuale', 'Target', 'Progresso', 'Stato'],
        rows: [
          ['Nuovi Clienti', '87', '100', '87%', 'In corso'],
          ['Fatturato', '€48,500', '€50,000', '97%', 'In corso'],
          ['Riduzione Costi', '€12,300', '€10,000', '123%', 'Completato'],
          ['Progetti Completati', '18', '20', '90%', 'In corso']
        ]
      };
      
    case 'stats':
      return {
        headers: ['Metrica', 'Valore', 'Media', 'Min', 'Max'],
        rows: [
          ['Punteggio', '78', '65', '42', '95'],
          ['Tempo (min)', '45', '50', '30', '75'],
          ['Errori', '3', '5', '0', '12'],
          ['Efficienza', '87%', '75%', '60%', '95%']
        ]
      };
      
    case 'financial':
      return {
        headers: ['Voce', 'Q1', 'Q2', 'Q3', 'Q4', 'Totale'],
        rows: [
          ['Ricavi', '€25,400', '€28,700', '€31,900', '€35,200', '€121,200'],
          ['Costi', '€18,300', '€19,500', '€20,800', '€22,100', '€80,700'],
          ['Margine', '€7,100', '€9,200', '€11,100', '€13,100', '€40,500'],
          ['Margine %', '28%', '32%', '35%', '37%', '33%']
        ]
      };
      
    case 'timeline':
      return {
        headers: ['Fase', 'Data Inizio', 'Data Fine', 'Responsabile', 'Status'],
        rows: [
          ['Analisi', '01/01/2025', '15/01/2025', 'Mario Rossi', 'Completato'],
          ['Progettazione', '16/01/2025', '15/02/2025', 'Laura Bianchi', 'Completato'],
          ['Sviluppo', '16/02/2025', '15/04/2025', 'Paolo Verdi', 'In corso'],
          ['Test', '16/04/2025', '30/04/2025', 'Giulia Neri', 'Pianificato']
        ]
      };
      
    case 'grid':
      return {
        headers: ['ID', 'Nome', 'Dipartimento', 'Ruolo', 'Assunzione', 'Stipendio'],
        rows: [
          ['001', 'Mario Rossi', 'Marketing', 'Manager', '10/01/2020', '€65,000'],
          ['002', 'Laura Bianchi', 'Vendite', 'Responsabile', '15/03/2019', '€58,000'],
          ['003', 'Paolo Verdi', 'IT', 'Sviluppatore', '22/05/2021', '€52,000'],
          ['004', 'Giulia Neri', 'Risorse Umane', 'Direttore', '03/11/2018', '€72,000'],
          ['005', 'Andrea Blu', 'Finanza', 'Analista', '17/07/2020', '€48,000'],
        ],
        sortable: true,
        filterable: true
      };
      
    case 'hierarchical':
      return {
        headers: ['Dipartimento', 'Responsabile', 'Dipendenti', 'Budget', 'Status'],
        rows: [
          ['Marketing', 'Mario Rossi', '12', '€350,000', 'Attivo'],
          ['└─ Digitale', 'Laura Verdi', '5', '€150,000', 'Attivo'],
          ['└─ Tradizionale', 'Giorgio Blu', '7', '€200,000', 'In revisione'],
          ['Vendite', 'Andrea Bianchi', '15', '€420,000', 'Attivo'],
          ['└─ Nazionale', 'Lucia Gialli', '8', '€220,000', 'Attivo'],
          ['└─ Internazionale', 'Marco Neri', '7', '€200,000', 'In espansione'],
        ]
      };
      
    case 'matrix':
      return {
        headers: ['', 'Q1', 'Q2', 'Q3', 'Q4', 'Totale'],
        rows: [
          ['Nord', '€125K', '€152K', '€130K', '€175K', '€582K'],
          ['Centro', '€95K', '€110K', '€105K', '€128K', '€438K'],
          ['Sud', '€70K', '€85K', '€92K', '€105K', '€352K'],
          ['Isole', '€45K', '€52K', '€58K', '€62K', '€217K'],
          ['Totale', '€335K', '€399K', '€385K', '€470K', '€1,589K'],
        ]
      };
      
    case 'colorful':
      return {
        headers: ['Prodotto', 'Vendite', 'Margine', 'Crescita', 'Status'],
        rows: [
          ['Prodotto A', '1,234', '32%', '+15%', '🟢 Ottimo'],
          ['Prodotto B', '987', '28%', '+8%', '🟢 Buono'],
          ['Prodotto C', '756', '25%', '-3%', '🟡 Medio'],
          ['Prodotto D', '543', '20%', '-12%', '🔴 Critico'],
          ['Prodotto E', '890', '30%', '+5%', '🟢 Buono']
        ],
        style: 'colorful'
      };
      
    case 'bordered':
      return {
        headers: ['Caratteristica', 'Piano Base', 'Piano Pro', 'Piano Enterprise'],
        rows: [
          ['Utenti', '5', '25', 'Illimitati'],
          ['Storage', '10 GB', '100 GB', '1 TB'],
          ['Supporto', 'Email', 'Prioritario', '24/7 Dedicato'],
          ['API', '❌', '✅', '✅ Avanzata'],
          ['Prezzo', '€29/mese', '€99/mese', '€299/mese']
        ],
        style: 'bordered'
      };
      
    case 'minimal':
      return {
        headers: ['Task', 'Assegnato a', 'Scadenza', 'Priorità'],
        rows: [
          ['Design Homepage', 'Laura B.', '15 Gen', 'Alta'],
          ['Sviluppo API', 'Marco N.', '20 Gen', 'Media'],
          ['Testing', 'Giulia V.', '25 Gen', 'Bassa'],
          ['Documentazione', 'Paolo R.', '30 Gen', 'Media']
        ],
        style: 'minimal'
      };
      
    default: // simple
      return {
        headers: ['Nome', 'Email', 'Ruolo', 'Dipartimento'],
        rows: [
          ['Mario Rossi', 'mario.rossi@example.com', 'Sviluppatore', 'IT'],
          ['Laura Bianchi', 'laura.bianchi@example.com', 'Designer', 'Marketing'],
          ['Paolo Verdi', 'paolo.verdi@example.com', 'Manager', 'Vendite'],
          ['Giulia Neri', 'giulia.neri@example.com', 'Analista', 'Finanza']
        ]
      };
  }
};

// Funzione per generare configurazioni di grafici avanzate con tutte le opzioni
export const generateAdvancedChartConfig = (type: string, options: any = {}): ChartConfig => {
  const baseConfig = getDefaultChartConfig(type);
  
  // Applica opzioni personalizzate in modo profondo
  return {
    ...baseConfig,
    ...options,
    // Mantieni le opzioni nidificate
    title: {
      ...baseConfig.title,
      ...options.title
    },
    subtitle: {
      ...baseConfig.subtitle,
      ...options.subtitle
    },
    legend: {
      ...baseConfig.legend,
      ...options.legend
    },
    tooltip: {
      ...baseConfig.tooltip,
      ...options.tooltip
    },
    animations: {
      ...baseConfig.animations,
      ...options.animations
    },
    xaxis: {
      ...baseConfig.xaxis,
      ...options.xaxis
    },
    yaxis: {
      ...baseConfig.yaxis,
      ...options.yaxis
    },
    plotOptions: {
      ...baseConfig.plotOptions,
      ...options.plotOptions
    },
    dataLabels: {
      ...baseConfig.dataLabels,
      ...options.dataLabels
    },
    stroke: {
      ...baseConfig.stroke,
      ...options.stroke
    },
    grid: {
      ...baseConfig.grid,
      ...options.grid
    }
  };
};