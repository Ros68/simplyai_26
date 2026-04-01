import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { generateTableDemo } from '@/services/chart-config';
import { Table as TableIcon, Settings, Palette } from 'lucide-react';

interface TableConfig {
  type: string;
  striped?: boolean;
  bordered?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  sortable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  filterable?: boolean;
  width?: string;
  height?: string;
  fontSize?: string;
  headerStyle?: {
    backgroundColor?: string;
    color?: string;
    fontWeight?: string;
    fontSize?: string;
  };
  rowStyle?: {
    backgroundColor?: string;
    alternateColor?: string;
    color?: string;
    fontSize?: string;
  };
  cellStyle?: {
    padding?: string;
    borderColor?: string;
  };
  borderColor?: string;
  borderWidth?: string;
  borderStyle?: string;
  textAlign?: 'left' | 'center' | 'right';
}

interface TablePreviewProps {
  tableType: string;
  config: TableConfig;
  onConfigChange: (config: TableConfig) => void;
}

const TablePreview: React.FC<TablePreviewProps> = ({ tableType, config, onConfigChange }) => {
  const [tableData, setTableData] = useState<{ headers: string[], rows: any[][], style?: string } | null>(null);
  const [activeTab, setActiveTab] = useState('preview');

  useEffect(() => {
    // Generate demo data based on table type
    const data = generateTableDemo(tableType);
    setTableData(data);
  }, [tableType]);

  // Update a specific config property
  const updateConfig = (property: string, value: any) => {
    onConfigChange({ ...config, [property]: value });
  };

  // Helper for nested property updates
  const updateNestedConfig = (parent: string, property: string, value: any) => {
    const updatedParent = { ...(config[parent as keyof TableConfig] as object || {}) };
    updatedParent[property as keyof typeof updatedParent] = value;
    updateConfig(parent, updatedParent);
  };

  // Get table style based on type and config
  const getTableStyles = () => {
    const baseStyles: any = {
      width: config.width || '100%',
      maxHeight: config.height,
      overflowY: config.height ? 'auto' : 'visible',
      fontSize: config.fontSize || '14px'
    };

    // Special styles for different table types
    if (tableType === 'colorful' || tableData?.style === 'colorful') {
      return {
        ...baseStyles,
        borderCollapse: 'separate',
        borderSpacing: '0 4px'
      };
    }

    if (tableType === 'bordered' || tableData?.style === 'bordered') {
      return {
        ...baseStyles,
        border: `2px solid ${config.borderColor || '#e2e8f0'}`,
        borderRadius: '8px'
      };
    }

    if (tableType === 'minimal' || tableData?.style === 'minimal') {
      return {
        ...baseStyles,
        border: 'none'
      };
    }

    return baseStyles;
  };

  // Get row style based on index and type
  const getRowStyle = (rowIndex: number) => {
    const baseStyle: any = {
      color: config.rowStyle?.color || '#1e293b'
    };

    if (tableType === 'colorful') {
      const colors = ['#fef3c7', '#dbeafe', '#d1fae5', '#fce7f3', '#f3e8ff'];
      return {
        ...baseStyle,
        backgroundColor: colors[rowIndex % colors.length],
        borderRadius: '6px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      };
    }

    if (tableType === 'minimal') {
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
        borderBottom: '1px solid #f1f5f9'
      };
    }

    // Default striped logic
    if (config.striped && rowIndex % 2 !== 0) {
      return {
        ...baseStyle,
        backgroundColor: config.rowStyle?.alternateColor || '#f9fafb'
      };
    }

    return {
      ...baseStyle,
      backgroundColor: config.rowStyle?.backgroundColor || 'transparent'
    };
  };

  // Get cell style
  const getCellStyle = () => {
    const baseStyle: any = {
      textAlign: config.textAlign || 'left',
      padding: config.cellStyle?.padding || (config.compact ? '8px' : '16px')
    };

    if (config.bordered || tableType === 'bordered') {
      return {
        ...baseStyle,
        border: `${config.borderWidth || '1px'} ${config.borderStyle || 'solid'} ${config.borderColor || '#e2e8f0'}`
      };
    }

    return baseStyle;
  };

  if (!tableData) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="mt-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="preview">
            <TableIcon className="w-4 h-4 mr-2" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="config">
            <Settings className="w-4 h-4 mr-2" />
            Configurazione
          </TabsTrigger>
          <TabsTrigger value="style">
            <Palette className="w-4 h-4 mr-2" />
            Stile
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview" className="p-4 overflow-auto">
          <div className="flex flex-col">
            <div style={getTableStyles()}>
              <Table>
                <TableHeader 
                  style={{ 
                    backgroundColor: config.headerStyle?.backgroundColor || '#f8fafc',
                    borderBottom: `2px solid ${config.borderColor || '#e2e8f0'}`
                  }}
                >
                  <TableRow>
                    {tableData.headers.map((header, index) => (
                      <TableHead
                        key={index}
                        style={{
                          color: config.headerStyle?.color || '#1e293b',
                          fontWeight: config.headerStyle?.fontWeight || '600',
                          fontSize: config.headerStyle?.fontSize || '14px',
                          textAlign: config.textAlign || 'left',
                          padding: config.compact ? '8px' : '16px'
                        }}
                      >
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.rows.map((row, rowIndex) => (
                    <TableRow
                      key={rowIndex}
                      style={getRowStyle(rowIndex)}
                      className={config.hoverable ? 'hover:bg-gray-50' : ''}
                    >
                      {row.map((cell, cellIndex) => (
                        <TableCell
                          key={cellIndex}
                          style={getCellStyle()}
                        >
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="text-sm text-muted-foreground mt-4">
              Questa è un'anteprima della tabella. I dati reali verranno generati in base alle risposte del questionario.
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="config" className="space-y-4 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dimensioni */}
            <div>
              <Label htmlFor="table-width">Larghezza</Label>
              <Input
                id="table-width"
                value={config.width || '100%'}
                onChange={(e) => updateConfig('width', e.target.value)}
                placeholder="100% o 500px"
              />
              <p className="text-xs text-muted-foreground mt-1">Usa percentuale o pixel</p>
            </div>
            
            <div>
              <Label htmlFor="table-height">Altezza Max</Label>
              <Input
                id="table-height"
                value={config.height || ''}
                onChange={(e) => updateConfig('height', e.target.value)}
                placeholder="auto o 400px"
              />
              <p className="text-xs text-muted-foreground mt-1">Lascia vuoto per auto</p>
            </div>
            
            {/* Font */}
            <div>
              <Label htmlFor="font-size">Dimensione Testo</Label>
              <Select
                value={config.fontSize || '14px'}
                onValueChange={(value) => updateConfig('fontSize', value)}
              >
                <SelectTrigger id="font-size">
                  <SelectValue placeholder="Dimensione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12px">Piccolo (12px)</SelectItem>
                  <SelectItem value="14px">Normale (14px)</SelectItem>
                  <SelectItem value="16px">Grande (16px)</SelectItem>
                  <SelectItem value="18px">Extra (18px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="text-align">Allineamento Testo</Label>
              <Select
                value={config.textAlign || 'left'}
                onValueChange={(value) => updateConfig('textAlign', value)}
              >
                <SelectTrigger id="text-align">
                  <SelectValue placeholder="Allineamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Sinistra</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Destra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Stile */}
            <div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="table-striped">Righe Alternate</Label>
                <Switch
                  id="table-striped"
                  checked={config.striped === true}
                  onCheckedChange={(checked) => updateConfig('striped', checked)}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="table-bordered">Bordi</Label>
                <Switch
                  id="table-bordered"
                  checked={config.bordered === true}
                  onCheckedChange={(checked) => updateConfig('bordered', checked)}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="table-hoverable">Effetto Hover</Label>
                <Switch
                  id="table-hoverable"
                  checked={config.hoverable === true}
                  onCheckedChange={(checked) => updateConfig('hoverable', checked)}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="table-compact">Compatta</Label>
                <Switch
                  id="table-compact"
                  checked={config.compact === true}
                  onCheckedChange={(checked) => updateConfig('compact', checked)}
                />
              </div>
            </div>
            
            {/* Funzionalità */}
            <div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="table-sortable">Ordinabile</Label>
                <Switch
                  id="table-sortable"
                  checked={config.sortable === true}
                  onCheckedChange={(checked) => updateConfig('sortable', checked)}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="table-filterable">Filtrabile</Label>
                <Switch
                  id="table-filterable"
                  checked={config.filterable === true}
                  onCheckedChange={(checked) => updateConfig('filterable', checked)}
                />
              </div>
            </div>
            
            {/* Paginazione */}
            <div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="table-pagination">Paginazione</Label>
                <Switch
                  id="table-pagination"
                  checked={config.pagination === true}
                  onCheckedChange={(checked) => updateConfig('pagination', checked)}
                />
              </div>
            </div>
            
            {config.pagination && (
              <div>
                <Label htmlFor="page-size">Righe per Pagina</Label>
                <Input
                  id="page-size"
                  type="number"
                  value={config.pageSize || 10}
                  onChange={(e) => updateConfig('pageSize', parseInt(e.target.value))}
                  min={1}
                  max={100}
                />
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="style" className="space-y-4 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Colori Intestazione */}
            <div>
              <Label htmlFor="header-bg-color">Sfondo Intestazione</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="header-bg-color"
                  type="color"
                  value={config.headerStyle?.backgroundColor || '#f8fafc'}
                  onChange={(e) => updateNestedConfig('headerStyle', 'backgroundColor', e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input
                  type="text"
                  value={config.headerStyle?.backgroundColor || '#f8fafc'}
                  onChange={(e) => updateNestedConfig('headerStyle', 'backgroundColor', e.target.value)}
                  className="flex-1"
                  placeholder="#f8fafc"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="header-text-color">Testo Intestazione</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="header-text-color"
                  type="color"
                  value={config.headerStyle?.color || '#1e293b'}
                  onChange={(e) => updateNestedConfig('headerStyle', 'color', e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input
                  type="text"
                  value={config.headerStyle?.color || '#1e293b'}
                  onChange={(e) => updateNestedConfig('headerStyle', 'color', e.target.value)}
                  className="flex-1"
                  placeholder="#1e293b"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="header-font-weight">Grassetto Intestazione</Label>
              <Select
                value={config.headerStyle?.fontWeight || '600'}
                onValueChange={(value) => updateNestedConfig('headerStyle', 'fontWeight', value)}
              >
                <SelectTrigger id="header-font-weight">
                  <SelectValue placeholder="Peso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="400">Normale (400)</SelectItem>
                  <SelectItem value="500">Medio (500)</SelectItem>
                  <SelectItem value="600">Grassetto (600)</SelectItem>
                  <SelectItem value="700">Extra Grassetto (700)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Colori Righe */}
            <div>
              <Label htmlFor="row-bg-color">Sfondo Righe (pari)</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="row-bg-color"
                  type="color"
                  value={config.rowStyle?.backgroundColor || '#ffffff'}
                  onChange={(e) => updateNestedConfig('rowStyle', 'backgroundColor', e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input
                  type="text"
                  value={config.rowStyle?.backgroundColor || '#ffffff'}
                  onChange={(e) => updateNestedConfig('rowStyle', 'backgroundColor', e.target.value)}
                  className="flex-1"
                  placeholder="#ffffff"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="row-alt-color">Sfondo Righe Alternate</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="row-alt-color"
                  type="color"
                  value={config.rowStyle?.alternateColor || '#f9fafb'}
                  onChange={(e) => updateNestedConfig('rowStyle', 'alternateColor', e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input
                  type="text"
                  value={config.rowStyle?.alternateColor || '#f9fafb'}
                  onChange={(e) => updateNestedConfig('rowStyle', 'alternateColor', e.target.value)}
                  className="flex-1"
                  placeholder="#f9fafb"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="row-text-color">Testo Righe</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="row-text-color"
                  type="color"
                  value={config.rowStyle?.color || '#1e293b'}
                  onChange={(e) => updateNestedConfig('rowStyle', 'color', e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input
                  type="text"
                  value={config.rowStyle?.color || '#1e293b'}
                  onChange={(e) => updateNestedConfig('rowStyle', 'color', e.target.value)}
                  className="flex-1"
                  placeholder="#1e293b"
                />
              </div>
            </div>
            
            {/* Bordi */}
            <div>
              <Label htmlFor="border-color">Colore Bordi</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="border-color"
                  type="color"
                  value={config.borderColor || '#e2e8f0'}
                  onChange={(e) => updateConfig('borderColor', e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input
                  type="text"
                  value={config.borderColor || '#e2e8f0'}
                  onChange={(e) => updateConfig('borderColor', e.target.value)}
                  className="flex-1"
                  placeholder="#e2e8f0"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="border-width">Spessore Bordi</Label>
              <Select
                value={config.borderWidth || '1px'}
                onValueChange={(value) => updateConfig('borderWidth', value)}
              >
                <SelectTrigger id="border-width">
                  <SelectValue placeholder="Spessore" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1px">Sottile (1px)</SelectItem>
                  <SelectItem value="2px">Medio (2px)</SelectItem>
                  <SelectItem value="3px">Spesso (3px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="border-style">Stile Bordi</Label>
              <Select
                value={config.borderStyle || 'solid'}
                onValueChange={(value) => updateConfig('borderStyle', value)}
              >
                <SelectTrigger id="border-style">
                  <SelectValue placeholder="Stile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solido</SelectItem>
                  <SelectItem value="dashed">Tratteggiato</SelectItem>
                  <SelectItem value="dotted">Punteggiato</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Padding celle */}
            <div>
              <Label htmlFor="cell-padding">Padding Celle</Label>
              <Select
                value={config.cellStyle?.padding || (config.compact ? '8px' : '16px')}
                onValueChange={(value) => updateNestedConfig('cellStyle', 'padding', value)}
              >
                <SelectTrigger id="cell-padding">
                  <SelectValue placeholder="Padding" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4px">Molto stretto (4px)</SelectItem>
                  <SelectItem value="8px">Stretto (8px)</SelectItem>
                  <SelectItem value="12px">Medio (12px)</SelectItem>
                  <SelectItem value="16px">Amplo (16px)</SelectItem>
                  <SelectItem value="20px">Extra ampio (20px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default TablePreview;