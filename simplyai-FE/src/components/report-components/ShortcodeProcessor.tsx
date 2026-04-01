
import React from 'react';
import ChartRenderer from './ChartRenderer';
import TableRenderer from './TableRenderer';

export interface ShortcodeMap {
  text: Record<string, any>;
  charts: Record<string, any>;
  tables: Record<string, any>;
}

interface ShortcodeProcessorProps {
  content: string;
  shortcodeMap: ShortcodeMap;
}

const ShortcodeProcessor: React.FC<ShortcodeProcessorProps> = ({ content, shortcodeMap }) => {
  // Process the content to replace shortcodes with actual content
  const processContent = (content: string) => {
    // Regular expression to match shortcodes: [shortcode]
    const shortcodeRegex = /\[([^\]]+)\]/g;
    
    // Split the content by shortcodes
    const parts = content.split(shortcodeRegex);
    
    // Process each part
    return parts.map((part, index) => {
      // Even indices are regular text, odd indices are shortcodes
      if (index % 2 === 0) {
        return <React.Fragment key={index}>{processTextWithLineBreaks(part)}</React.Fragment>;
      } else {
        // This is a shortcode, render the appropriate content
        return renderShortcode(part, index);
      }
    });
  };
  
  // Process text to maintain line breaks and support for basic Markdown syntax
  const processTextWithLineBreaks = (text: string) => {
    // Split by newlines first
    return text.split('\n').map((line, i) => {
      // Handle Markdown-style headers
      if (line.startsWith('# ')) {
        return <h1 key={i} className="text-3xl font-bold mt-6 mb-4">{line.substring(2)}</h1>;
      } else if (line.startsWith('## ')) {
        return <h2 key={i} className="text-2xl font-bold mt-5 mb-3">{line.substring(3)}</h2>;
      } else if (line.startsWith('### ')) {
        return <h3 key={i} className="text-xl font-semibold mt-4 mb-2">{line.substring(4)}</h3>;
      } else if (line.startsWith('#### ')) {
        return <h4 key={i} className="text-lg font-semibold mt-3 mb-2">{line.substring(5)}</h4>;
      } else if (line.startsWith('##### ')) {
        return <h5 key={i} className="text-base font-semibold mt-2 mb-1">{line.substring(6)}</h5>;
      } 
      // Handle lists
      else if (line.startsWith('- ')) {
        return <li key={i} className="ml-6 list-disc">{line.substring(2)}</li>;
      } else if (/^\d+\.\s/.test(line)) {
        // Match numbered lists like "1. " with any number
        const content = line.replace(/^\d+\.\s/, '');
        return <li key={i} className="ml-6 list-decimal">{content}</li>;
      } 
      // Handle horizontal rule
      else if (line === '---') {
        return <hr key={i} className="my-4" />;
      } 
      // Handle empty lines
      else if (line === '') {
        return <br key={i} />;
      } 
      // Process inline markdown elements like bold, italic, links and code
      else {
        // Process bold - replace **text** with <strong>text</strong>
        let processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Process italic - replace *text* with <em>text</em>
        processedLine = processedLine.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Process inline code - replace `text` with <code>text</code>
        processedLine = processedLine.replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
        
        // Process links - replace [text](url) with <a href="url">text</a>
        processedLine = processedLine.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>');
        
        // Process images - replace ![alt](url) with <img alt="alt" src="url" />
        processedLine = processedLine.replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2" class="my-2 max-w-full rounded" />');
        
        // Handle paragraphs with potentially HTML content
        return <p key={i} className="mb-2" dangerouslySetInnerHTML={{ __html: processedLine }} />;
      }
    });
  };
  
  // Determine the shortcode type and return the appropriate component
  const determineShortcodeType = (shortcode: string): 'text' | 'chart' | 'table' | 'unknown' => {
    if (shortcodeMap.text && shortcodeMap.text[shortcode]) {
      return 'text';
    }
    if (shortcodeMap.charts && shortcodeMap.charts[shortcode]) {
      return 'chart';
    }
    if (shortcodeMap.tables && shortcodeMap.tables[shortcode]) {
      return 'table';
    }
    return 'unknown';
  };
  
  // Render the appropriate content based on shortcode
  const renderShortcode = (shortcode: string, key: number) => {
    const shortcodeType = determineShortcodeType(shortcode);
    
    try {
      switch (shortcodeType) {
        case 'text':
          return (
            <div key={key} className="my-4">
              <div className="prose max-w-none">
                {shortcodeMap.text[shortcode].title && (
                  <h3 className="text-xl font-bold mb-3">{shortcodeMap.text[shortcode].title}</h3>
                )}
                {processTextWithLineBreaks(shortcodeMap.text[shortcode].content || '')}
                {shortcodeMap.text[shortcode].prompt && (
                  <div className="mt-2 p-2 bg-secondary/10 rounded border border-secondary/20">
                    <p className="text-sm font-semibold text-secondary-foreground">Prompt specifico:</p>
                    <p className="text-sm font-mono">{shortcodeMap.text[shortcode].prompt}</p>
                  </div>
                )}
              </div>
            </div>
          );
          
        case 'chart':
          return (
            <div key={key} className="my-6">
              {shortcodeMap.charts[shortcode].title && (
                <h3 className="text-xl font-bold mb-3">{shortcodeMap.charts[shortcode].title}</h3>
              )}
              <ChartRenderer data={shortcodeMap.charts[shortcode].data} />
              {shortcodeMap.charts[shortcode].prompt && (
                <div className="mt-2 p-2 bg-secondary/10 rounded border border-secondary/20">
                  <p className="text-sm font-semibold text-secondary-foreground">Prompt specifico per il grafico:</p>
                  <p className="text-sm font-mono">{shortcodeMap.charts[shortcode].prompt}</p>
                </div>
              )}
            </div>
          );
          
        case 'table':
          return (
            <div key={key} className="my-6">
              {shortcodeMap.tables[shortcode].title && (
                <h3 className="text-xl font-bold mb-3">{shortcodeMap.tables[shortcode].title}</h3>
              )}
              <TableRenderer data={shortcodeMap.tables[shortcode].data} />
              {shortcodeMap.tables[shortcode].prompt && (
                <div className="mt-2 p-2 bg-secondary/10 rounded border border-secondary/20">
                  <p className="text-sm font-semibold text-secondary-foreground">Prompt specifico per la tabella:</p>
                  <p className="text-sm font-mono">{shortcodeMap.tables[shortcode].prompt}</p>
                </div>
              )}
            </div>
          );
          
        case 'unknown':
        default:
          return (
            <div key={key} className="text-amber-600 bg-amber-50 p-3 my-2 rounded-md border border-amber-200">
              Contenuto non disponibile per lo shortcode: [{shortcode}]
            </div>
          );
      }
    } catch (error) {
      console.error(`Errore nel rendering dello shortcode [${shortcode}]:`, error);
      return (
        <div key={key} className="text-red-600 bg-red-50 p-3 my-2 rounded-md border border-red-200">
          Errore nel rendering dello shortcode: [{shortcode}]
        </div>
      );
    }
  };
  
  return (
    <div className="shortcode-content">
      {processContent(content)}
    </div>
  );
};

export default ShortcodeProcessor;
