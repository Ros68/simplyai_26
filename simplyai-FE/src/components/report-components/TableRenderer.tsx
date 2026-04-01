
import React from 'react';

export interface TableData {
  type: 'simple' | 'comparison' | 'progress' | 'stats';
  title: string;
  headers?: string[];
  rows: any[][];
  footers?: string[];
}

interface TableRendererProps {
  data: TableData;
}

const TableRenderer: React.FC<TableRendererProps> = ({ data }) => {
  const { type, title, headers, rows, footers } = data;
  
  // Helper function to render cell content with proper formatting
  const renderCell = (content: any, isHeader: boolean = false, isFooter: boolean = false) => {
    // Handle numeric values to use proper formatting
    if (typeof content === 'number') {
      // Apply formatting for percentages if the content is likely a percentage
      if (content <= 1 && content >= 0 && rows.some(row => row.includes('%'))) {
        return `${(content * 100).toFixed(1)}%`;
      } 
      // Format numbers with thousand separators
      return new Intl.NumberFormat('it-IT').format(content);
    }
    
    return content;
  };

  // Function to determine cell classes based on content and type
  const getCellClasses = (content: any, rowIndex: number, colIndex: number, isHeader: boolean = false, isFooter: boolean = false) => {
    let classes = "px-4 py-2 ";
    
    if (isHeader) {
      classes += "font-semibold text-left bg-gray-100 ";
    } else if (isFooter) {
      classes += "font-semibold text-left bg-gray-50 ";
    } 
    
    // Style for comparison table
    if (type === 'comparison' && colIndex > 0) {
      if (typeof content === 'string' && content.startsWith('+')) {
        classes += "text-green-600 ";
      } else if (typeof content === 'string' && content.startsWith('-')) {
        classes += "text-red-600 ";
      }
    }
    
    // Style for progress table
    if (type === 'progress' && colIndex === rows[0].length - 1) {
      classes += "font-medium ";
      
      if (typeof content === 'string') {
        if (content === 'Completato') classes += "text-green-600 ";
        else if (content === 'In corso') classes += "text-yellow-600 ";
        else classes += "text-gray-600 ";
      }
    }
    
    // Add border styling
    if (colIndex === 0) classes += "border-l ";
    classes += "border-r border-b ";
    
    return classes;
  };

  // Render appropriate table based on type
  switch (type) {
    case 'stats':
      return (
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-lg font-medium mb-3">{title}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className="bg-gray-50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold">{renderCell(row[1])}</p>
                <p className="text-sm text-gray-600">{row[0]}</p>
              </div>
            ))}
          </div>
        </div>
      );
    
    default: // simple, comparison, progress all use standard table layout
      return (
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-lg font-medium mb-3">{title}</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border">
              {headers && headers.length > 0 && (
                <thead>
                  <tr>
                    {headers.map((header, colIndex) => (
                      <th 
                        key={colIndex} 
                        className={getCellClasses(header, -1, colIndex, true)}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              
              <tbody className="divide-y divide-gray-200">
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {row.map((cell, colIndex) => (
                      <td 
                        key={colIndex} 
                        className={getCellClasses(cell, rowIndex, colIndex)}
                      >
                        {renderCell(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              
              {footers && footers.length > 0 && (
                <tfoot>
                  <tr>
                    {footers.map((footer, colIndex) => (
                      <td 
                        key={colIndex} 
                        className={getCellClasses(footer, rows.length, colIndex, false, true)}
                      >
                        {renderCell(footer, false, true)}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      );
  }
};

export default TableRenderer;
