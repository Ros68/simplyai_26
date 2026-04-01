
import React from 'react';
import ChartRenderer, { ChartData } from './ChartRenderer';
import TableRenderer, { TableData } from './TableRenderer';

export interface Segment {
  type: 'text' | 'section' | 'chart' | 'table' | 'placeholder';
  content?: string;
  data?: ChartData | TableData;
  shortcode?: string;
  title?: string;
  prompt?: string; // Prompt specifico per questa sezione
}

interface DynamicReportRendererProps {
  segment: Segment;
}

const DynamicReportRenderer: React.FC<DynamicReportRendererProps> = ({ segment }) => {
  // Rendering based on segment type
  switch (segment.type) {
    case 'text':
      return (
        <div className="prose max-w-none">
          {segment.title && <h3 className="mb-3">{segment.title}</h3>}
          {segment.content && <div>{segment.content}</div>}
          {segment.prompt && (
            <div className="mt-2 p-2 bg-secondary/10 rounded border border-secondary/20">
              <p className="text-xs text-muted-foreground">Prompt specifico: {segment.prompt}</p>
            </div>
          )}
        </div>
      );
    
    case 'section':
      return (
        <div className="prose max-w-none">
          {segment.title && <h3 className="mb-3">{segment.title}</h3>}
          <div dangerouslySetInnerHTML={{ __html: segment.content || '' }} />
          {segment.prompt && (
            <div className="mt-2 p-2 bg-secondary/10 rounded border border-secondary/20">
              <p className="text-xs text-muted-foreground">Prompt specifico: {segment.prompt}</p>
            </div>
          )}
        </div>
      );
    
    case 'chart':
      if (segment.data) {
        return (
          <div>
            {segment.title && <h3 className="mb-3 text-lg font-semibold">{segment.title}</h3>}
            <ChartRenderer data={segment.data as ChartData} />
            {segment.prompt && (
              <div className="mt-2 p-2 bg-secondary/10 rounded border border-secondary/20">
                <p className="text-xs text-muted-foreground">Prompt specifico per il grafico: {segment.prompt}</p>
              </div>
            )}
          </div>
        );
      }
      return null;
    
    case 'table':
      if (segment.data) {
        return (
          <div>
            {segment.title && <h3 className="mb-3 text-lg font-semibold">{segment.title}</h3>}
            <TableRenderer data={segment.data as TableData} />
            {segment.prompt && (
              <div className="mt-2 p-2 bg-secondary/10 rounded border border-secondary/20">
                <p className="text-xs text-muted-foreground">Prompt specifico per la tabella: {segment.prompt}</p>
              </div>
            )}
          </div>
        );
      }
      return null;
    
    case 'placeholder':
      return (
        <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-muted-foreground">
          <p>Shortcode non trovato: <code>{segment.shortcode}</code></p>
        </div>
      );
    
    default:
      return null;
  }
};

export default DynamicReportRenderer;
