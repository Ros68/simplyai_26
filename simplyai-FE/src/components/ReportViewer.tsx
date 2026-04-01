
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Printer } from 'lucide-react';

type ReportProps = {
  data: {
    title: string;
    date: string;
    sections: {
      title: string;
      content: string;
      type: 'text' | 'bar-chart' | 'pie-chart';
      chartData?: any[];
    }[];
  };
};

const COLORS = ['#9b87f5', '#7E69AB', '#D3E4FD', '#E5DEFF', '#8E9196'];

const ReportViewer = ({ data }: ReportProps) => {
  const handleDownload = () => {
    // In a real implementation, this would trigger a PDF download
    console.log('Downloading report...');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto bg-white">
      <div className="flex justify-between items-center mb-8 print:hidden">
        <h1 className="text-3xl font-bold">Il tuo Report</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            className="rounded-full"
            onClick={handlePrint}
          >
            <Printer className="mr-2 h-4 w-4" /> Stampa
          </Button>
          <Button 
            className="rounded-full bg-simoly-purple hover:bg-simoly-purple-dark"
            onClick={handleDownload}
          >
            <Download className="mr-2 h-4 w-4" /> Scarica PDF
          </Button>
        </div>
      </div>
      
      <div className="mb-10 text-center border-b pb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-simoly-purple to-simoly-purple-dark bg-clip-text text-transparent">
          {data.title}
        </h1>
        <p className="text-simoly-gray-dark">Generato il {data.date}</p>
      </div>
      
      <div className="space-y-12">
        {data.sections.map((section, idx) => (
          <div key={idx} className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 border-l-4 border-simoly-purple pl-4">
              {section.title}
            </h2>
            
            {section.type === 'text' && (
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: section.content }}></div>
            )}
            
            {section.type === 'bar-chart' && section.chartData && (
              <Card className="border-2 border-simoly-gray-light rounded-3xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={section.chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#9b87f5" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-sm text-simoly-gray-dark mt-4 text-center">
                    {section.content}
                  </p>
                </CardContent>
              </Card>
            )}
            
            {section.type === 'pie-chart' && section.chartData && (
              <Card className="border-2 border-simoly-gray-light rounded-3xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={section.chartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {section.chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-sm text-simoly-gray-dark mt-4 text-center">
                    {section.content}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ))}
        
        <div className="my-16 p-8 bg-simoly-gray-light rounded-3xl text-center">
          <h2 className="text-2xl font-bold mb-4">Grazie per aver utilizzato SimolyAI</h2>
          <p className="text-simoly-gray-dark mb-6 max-w-lg mx-auto">
            Speriamo che questo report ti sia utile. Ricorda che puoi sempre tornare a consultarlo nella tua dashboard e scaricarlo in formato PDF.
          </p>
          <Button className="rounded-full bg-simoly-purple hover:bg-simoly-purple-dark">
            Torna alla Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReportViewer;
