
import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, RadarChart, Radar, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'radar';
  title: string;
  data: {
    labels: string[];
    datasets: {
      label?: string;
      data: number[];
      backgroundColor?: string | string[];
    }[];
  };
}

interface ChartRendererProps {
  data: ChartData;
}

const ChartRenderer: React.FC<ChartRendererProps> = ({ data }) => {
  const { type, title, data: chartData } = data;
  
  // Converti i dati dal formato Chart.js al formato Recharts
  const rechartsData = chartData.labels.map((label, index) => {
    const dataPoint: Record<string, any> = { name: label };
    chartData.datasets.forEach((dataset, datasetIndex) => {
      const datasetLabel = dataset.label || `Dataset ${datasetIndex + 1}`;
      dataPoint[datasetLabel] = dataset.data[index];
    });
    return dataPoint;
  });
  
  const colors = ['#4f46e5', '#60a5fa', '#34d399', '#fbbf24', '#f87171', '#d946ef'];
  
  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={rechartsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {chartData.datasets.map((dataset, index) => {
                const fillColor = Array.isArray(dataset.backgroundColor) 
                  ? dataset.backgroundColor[0] 
                  : (dataset.backgroundColor || colors[index % colors.length]);
                
                return (
                  <Bar 
                    key={index} 
                    dataKey={dataset.label || `Dataset ${index + 1}`} 
                    fill={fillColor} 
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={rechartsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {chartData.datasets.map((dataset, index) => {
                const strokeColor = Array.isArray(dataset.backgroundColor) 
                  ? dataset.backgroundColor[0] 
                  : (dataset.backgroundColor || colors[index % colors.length]);
                
                return (
                  <Line 
                    key={index} 
                    type="monotone" 
                    dataKey={dataset.label || `Dataset ${index + 1}`} 
                    stroke={strokeColor} 
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        );
        
      case 'pie':
        // Conversione dati per PieChart
        const pieData = chartData.datasets[0].data.map((value, index) => {
          const fillColor = Array.isArray(chartData.datasets[0].backgroundColor) 
            ? chartData.datasets[0].backgroundColor[index % chartData.datasets[0].backgroundColor.length] 
            : (chartData.datasets[0].backgroundColor || colors[index % colors.length]);
          
          return {
            name: chartData.labels[index],
            value,
            fill: fillColor
          };
        });
        
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={0}
                outerRadius={80}
                fill="#8884d8"
                label
              />
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
        
      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={rechartsData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis />
              {chartData.datasets.map((dataset, index) => {
                const strokeColor = Array.isArray(dataset.backgroundColor) 
                  ? dataset.backgroundColor[0] 
                  : (dataset.backgroundColor || colors[index % colors.length]);
                
                return (
                  <Radar
                    key={index}
                    name={dataset.label || `Dataset ${index + 1}`}
                    dataKey={dataset.label || `Dataset ${index + 1}`}
                    stroke={strokeColor}
                    fill={strokeColor}
                    fillOpacity={0.6}
                  />
                );
              })}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        );
        
      default:
        return <div>Tipo di grafico non supportato</div>;
    }
  };
  
  return (
    <div className="bg-white p-4 rounded-lg border">
      <h3 className="text-lg font-medium mb-4">{title}</h3>
      {renderChart()}
    </div>
  );
};

export default ChartRenderer;
