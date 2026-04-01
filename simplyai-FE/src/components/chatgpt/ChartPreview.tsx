import React, { useState, useEffect } from 'react';
import { lazy, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ChartConfig } from '@/services/prompt-templates';
import { generateDemoData, colorPalettes } from '@/services/chart-config';
import { PieChart, Settings, Palette } from 'lucide-react';

// Lazily load ApexCharts to avoid SSR issues
const ReactApexChart = lazy(() => import('react-apexcharts'));

interface ChartPreviewProps {
  chartType: string;
  config: ChartConfig;
  onConfigChange: (config: ChartConfig) => void;
}

const ChartPreview: React.FC<ChartPreviewProps> = ({ chartType, config, onConfigChange }) => {
  const [demoData, setDemoData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('preview');
  const [apexOptions, setApexOptions] = useState<any>({});
  const [series, setSeries] = useState<any[]>([]);

  useEffect(() => {
    // Generate demo data based on chart type
    const data = generateDemoData(chartType);
    setDemoData(data);

    // Create series data from the demo data
    let seriesData: any[] = [];
    if (['pie', 'donut', 'polarArea', 'radialBar'].includes(chartType)) {
      seriesData = data.datasets[0].data;
    } else if (chartType === 'bubble') {
      seriesData = data.datasets.map((dataset: any) => ({
        name: dataset.name,
        data: dataset.data
      }));
    } else if (chartType === 'scatter') {
      seriesData = data.datasets.map((dataset: any) => ({
        name: dataset.name,
        data: dataset.data
      }));
    } else if (chartType === 'candlestick') {
      seriesData = data.datasets.map((dataset: any) => ({
        name: dataset.name,
        data: dataset.data
      }));
    } else if (chartType === 'boxPlot') {
      seriesData = data.datasets.map((dataset: any) => ({
        name: dataset.name,
        data: dataset.data
      }));
    } else if (chartType === 'treemap') {
      seriesData = data.datasets.map((dataset: any) => ({
        name: dataset.name,
        data: dataset.data
      }));
    } else if (chartType === 'rangeBar') {
      seriesData = data.datasets.map((dataset: any) => ({
        name: dataset.name,
        data: dataset.data
      }));
    } else {
      seriesData = data.datasets.map((dataset: any, index: number) => ({
        name: dataset.name,
        data: dataset.data
      }));
    }
    setSeries(seriesData);

    // Create ApexCharts options from config
    let options: any = {
      chart: {
        id: 'chart-preview',
        type: chartType === 'column' ? 'bar' : chartType,
        height: config.height || 350,
        width: config.width || '100%',
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true
          }
        },
        animations: config.animations,
        background: config.theme?.mode === 'dark' ? '#1e293b' : 'transparent'
      },
      colors: config.colors || colorPalettes.standard,
      title: {
        text: config.title?.text || '',
        align: config.title?.align || 'center',
        style: {
          fontSize: config.title?.style?.fontSize || '16px',
          fontWeight: config.title?.style?.fontWeight || 'bold',
          color: config.title?.style?.color || '#1e293b'
        }
      },
      subtitle: {
        text: config.subtitle?.text || '',
        align: config.subtitle?.align || 'center',
        style: {
          fontSize: config.subtitle?.style?.fontSize || '12px',
          color: config.subtitle?.style?.color || '#64748b'
        }
      },
      xaxis: {
        categories: data.labels,
        title: {
          text: config.xaxis?.title?.text || config.xaxis?.title || '',
          style: {
            fontSize: '12px',
            fontWeight: 600
          }
        },
        labels: {
          style: {
            fontSize: '12px'
          }
        }
      },
      yaxis: {
        title: {
          text: config.yaxis?.title?.text || config.yaxis?.title || '',
          style: {
            fontSize: '12px',
            fontWeight: 600
          }
        },
        labels: {
          style: {
            fontSize: '12px'
          }
        }
      },
      legend: {
        show: config.legend?.show !== false,
        position: config.legend?.position || 'bottom',
        horizontalAlign: config.legend?.horizontalAlign || 'center',
        fontSize: config.legend?.fontSize || '12px'
      },
      tooltip: {
        enabled: config.tooltip?.enabled !== false,
        style: {
          fontSize: '12px'
        }
      },
      dataLabels: {
        enabled: config.dataLabels?.enabled === true,
        style: {
          fontSize: '12px'
        }
      },
      stroke: config.stroke || {
        width: 2,
        curve: 'smooth'
      },
      grid: {
        show: config.grid?.show !== false,
        borderColor: config.grid?.borderColor || '#e2e8f0',
        strokeDashArray: 4
      },
      theme: {
        mode: config.theme?.mode || 'light'
      }
    };

    // Special handling for pie/donut/polarArea charts
    if (['pie', 'donut', 'polarArea', 'radialBar'].includes(chartType)) {
      options.labels = data.labels;
      options.plotOptions = {
        ...options.plotOptions,
        pie: {
          donut: {
            size: chartType === 'donut' ? '65%' : '0%',
            labels: {
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
    }

    // Special handling for funnel/pyramid (they use bar chart with isFunnel)
    if (chartType === 'funnel' || chartType === 'pyramid') {
      options.chart.type = 'bar';
      options.plotOptions = {
        bar: {
          borderRadius: 0,
          horizontal: true,
          barHeight: '80%',
          isFunnel: true,
          isDumbbell: false
        }
      };
      options.dataLabels = {
        enabled: true,
        formatter: function (val: any, opt: any) {
          return opt.w.globals.labels[opt.dataPointIndex] + ': ' + val;
        },
        style: {
          fontSize: '12px'
        }
      };
      options.legend = { show: false };
    }

    // Special handling for heatmap
    if (chartType === 'heatmap') {
      options.plotOptions = {
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
      };
    }

    // Special handling for candlestick
    if (chartType === 'candlestick') {
      options.xaxis.type = 'datetime';
    }

    // Special handling for rangeBar
    if (chartType === 'rangeBar') {
      options.chart.type = 'rangeBar';
      options.plotOptions = {
        bar: {
          horizontal: true
        }
      };
    }

    setApexOptions(options);
  }, [chartType, config]);

  // Update a specific config property
  const updateConfig = (path: string, value: any) => {
    const newConfig = { ...config };
    
    // Split path into nested properties (e.g., 'title.text' becomes ['title', 'text'])
    const parts = path.split('.');
    let current = newConfig as any;
    
    // Navigate to the last parent object
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    
    // Set the value
    current[parts[parts.length - 1]] = value;
    
    // Call the parent update function
    onConfigChange(newConfig);
  };

  const handleColorPaletteChange = (palette: string) => {
    updateConfig('colors', colorPalettes[palette as keyof typeof colorPalettes] || colorPalettes.standard);
  };

  if (!demoData) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="mt-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="preview">
            <PieChart className="w-4 h-4 mr-2" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="config">
            <Settings className="w-4 h-4 mr-2" />
            Configurazione
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="w-4 h-4 mr-2" />
            Aspetto
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview" className="p-4">
          <div className="flex flex-col items-center">
            {typeof window !== 'undefined' && (
              <div style={{ width: '100%', height: config.height || 350 }}>
                <Suspense fallback={<div>Loading chart...</div>}>
                  <ReactApexChart 
                    options={apexOptions} 
                    series={series} 
                    type={chartType === 'column' ? 'bar' : chartType === 'funnel' || chartType === 'pyramid' ? 'bar' : chartType as any} 
                    height={config.height || 350} 
                    width={config.width || '100%'} 
                  />
                </Suspense>
              </div>
            )}
            <div className="text-sm text-muted-foreground mt-4">
              Questa è un'anteprima del grafico. I dati reali verranno generati in base alle risposte del questionario.
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="config" className="space-y-4 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dimensioni */}
            <div>
              <Label htmlFor="chart-height">Altezza (px)</Label>
              <Input
                id="chart-height"
                type="number"
                value={config.height || 350}
                onChange={(e) => updateConfig('height', parseInt(e.target.value))}
                min={200}
                max={800}
              />
            </div>
            
            <div>
              <Label htmlFor="chart-width">Larghezza</Label>
              <Input
                id="chart-width"
                type="text"
                value={typeof config.width === 'number' ? config.width : (config.width || '100%')}
                onChange={(e) => updateConfig('width', e.target.value)}
                placeholder="100% o 500px"
              />
              <p className="text-xs text-muted-foreground mt-1">Usa percentuale (es. 100%) o pixel (es. 500px)</p>
            </div>
            
            {/* Titolo */}
            <div className="md:col-span-2">
              <Label htmlFor="chart-title">Titolo del Grafico</Label>
              <Input
                id="chart-title"
                value={config.title?.text || ''}
                onChange={(e) => updateConfig('title.text', e.target.value)}
                placeholder="Inserisci il titolo del grafico"
              />
            </div>
            
            <div>
              <Label htmlFor="title-align">Allineamento Titolo</Label>
              <Select
                value={config.title?.align || 'center'}
                onValueChange={(value) => updateConfig('title.align', value)}
              >
                <SelectTrigger id="title-align">
                  <SelectValue placeholder="Allineamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Sinistra</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Destra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="title-size">Dimensione Font Titolo</Label>
              <Select
                value={config.title?.style?.fontSize || '16px'}
                onValueChange={(value) => updateConfig('title.style.fontSize', value)}
              >
                <SelectTrigger id="title-size">
                  <SelectValue placeholder="Dimensione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12px">Piccolo (12px)</SelectItem>
                  <SelectItem value="14px">Medio (14px)</SelectItem>
                  <SelectItem value="16px">Grande (16px)</SelectItem>
                  <SelectItem value="18px">Extra (18px)</SelectItem>
                  <SelectItem value="20px">Titolo (20px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Sottotitolo */}
            <div className="md:col-span-2">
              <Label htmlFor="chart-subtitle">Sottotitolo</Label>
              <Input
                id="chart-subtitle"
                value={config.subtitle?.text || ''}
                onChange={(e) => updateConfig('subtitle.text', e.target.value)}
                placeholder="Inserisci il sottotitolo (opzionale)"
              />
            </div>
            
            {/* Assi */}
            <div>
              <Label htmlFor="x-axis-title">Titolo Asse X</Label>
              <Input
                id="x-axis-title"
                value={config.xaxis?.title?.text || config.xaxis?.title || ''}
                onChange={(e) => updateConfig('xaxis.title.text', e.target.value)}
                placeholder="Categorie"
              />
            </div>
            
            <div>
              <Label htmlFor="y-axis-title">Titolo Asse Y</Label>
              <Input
                id="y-axis-title"
                value={config.yaxis?.title?.text || config.yaxis?.title || ''}
                onChange={(e) => updateConfig('yaxis.title.text', e.target.value)}
                placeholder="Valori"
              />
            </div>
            
            {/* Legenda */}
            <div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="show-legend">Mostra Legenda</Label>
                <Switch
                  id="show-legend"
                  checked={config.legend?.show !== false}
                  onCheckedChange={(checked) => updateConfig('legend.show', checked)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="legend-position">Posizione Legenda</Label>
              <Select
                value={config.legend?.position || 'bottom'}
                onValueChange={(value) => updateConfig('legend.position', value)}
              >
                <SelectTrigger id="legend-position">
                  <SelectValue placeholder="Posizione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Sopra</SelectItem>
                  <SelectItem value="right">Destra</SelectItem>
                  <SelectItem value="bottom">Sotto</SelectItem>
                  <SelectItem value="left">Sinistra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Tooltip e animazioni */}
            <div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="show-tooltip">Mostra Tooltip</Label>
                <Switch
                  id="show-tooltip"
                  checked={config.tooltip?.enabled !== false}
                  onCheckedChange={(checked) => updateConfig('tooltip.enabled', checked)}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="show-animations">Animazioni</Label>
                <Switch
                  id="show-animations"
                  checked={config.animations?.enabled !== false}
                  onCheckedChange={(checked) => updateConfig('animations.enabled', checked)}
                />
              </div>
            </div>
            
            {/* Griglia */}
            <div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="show-grid">Mostra Griglia</Label>
                <Switch
                  id="show-grid"
                  checked={config.grid?.show !== false}
                  onCheckedChange={(checked) => updateConfig('grid.show', checked)}
                />
              </div>
            </div>
            
            {/* Data labels */}
            <div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="show-data-labels">Etichette Dati</Label>
                <Switch
                  id="show-data-labels"
                  checked={config.dataLabels?.enabled === true}
                  onCheckedChange={(checked) => updateConfig('dataLabels.enabled', checked)}
                />
              </div>
            </div>
            
            {/* Spessore linee (per grafici lineari) */}
            {['line', 'area', 'scatter'].includes(chartType) && (
              <>
                <div>
                  <Label htmlFor="stroke-width">Spessore Linea</Label>
                  <Input
                    id="stroke-width"
                    type="number"
                    value={config.stroke?.width || 2}
                    onChange={(e) => updateConfig('stroke.width', parseInt(e.target.value))}
                    min={0}
                    max={10}
                  />
                </div>
                <div>
                  <Label htmlFor="stroke-curve">Stile Linea</Label>
                  <Select
                    value={config.stroke?.curve || 'smooth'}
                    onValueChange={(value) => updateConfig('stroke.curve', value)}
                  >
                    <SelectTrigger id="stroke-curve">
                      <SelectValue placeholder="Stile" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="smooth">Arrotondata</SelectItem>
                      <SelectItem value="straight">Dritta</SelectItem>
                      <SelectItem value="stepline">A gradini</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-4 p-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Colori */}
            <div>
              <Label htmlFor="color-palette">Schema Colori</Label>
              <Select
                value="default"
                onValueChange={handleColorPaletteChange}
              >
                <SelectTrigger id="color-palette">
                  <SelectValue placeholder="Seleziona schema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default (Indigo/Teal)</SelectItem>
                  <SelectItem value="pastel">Pastello</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="monochrome">Monocromatico</SelectItem>
                  <SelectItem value="bold">Bold (Vivido)</SelectItem>
                  <SelectItem value="warm">Warm (Caldo)</SelectItem>
                  <SelectItem value="cool">Cool (Freddo)</SelectItem>
                  <SelectItem value="rainbow">Rainbow (Arcobaleno)</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex mt-2 space-x-2 flex-wrap gap-2">
                {(config.colors || colorPalettes.standard).map((color, index) => (
                  <div 
                    key={index} 
                    style={{ backgroundColor: color }} 
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                    title={color}
                  ></div>
                ))}
              </div>
            </div>
            
            {/* Tema */}
            <div>
              <Label htmlFor="theme-mode">Tema</Label>
              <Select
                value={config.theme?.mode || 'light'}
                onValueChange={(value) => updateConfig('theme.mode', value)}
              >
                <SelectTrigger id="theme-mode">
                  <SelectValue placeholder="Tema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Chiaro</SelectItem>
                  <SelectItem value="dark">Scuro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Colore personalizzato */}
            <div>
              <Label>Colori Personalizzati (opzionale)</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {(config.colors || colorPalettes.standard).map((color, index) => (
                  <div key={index} className="flex items-center space-x-1">
                    <Input
                      type="color"
                      value={color}
                      onChange={(e) => {
                        const newColors = [...(config.colors || colorPalettes.standard)];
                        newColors[index] = e.target.value;
                        updateConfig('colors', newColors);
                      }}
                      className="w-10 h-10 p-0 border-0"
                    />
                    <span className="text-xs text-muted-foreground">{index + 1}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Clicca sui colori per personalizzarli individualmente
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default ChartPreview;