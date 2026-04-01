import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { fetchReportById, ReportData } from "@/services/report";
import Chart from "react-apexcharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { API_BASE_URL } from "@/config/api";
import { FileText } from "lucide-react";

const Report = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [renderedSections, setRenderedSections] = useState<any[]>([]);
  const [structuredContent, setStructuredContent] = useState<any[]>([]);

  // Function to create ApexCharts configuration based on graph type
  const createChartConfig = (data: any, graphType: string, title: string) => {
    const baseOptions = {
      chart: {
        id: `chart-${Date.now()}`,
        toolbar: {
          show: true,
        },
        background: "#fff",
      },
      title: {
        text: title,
        align: "center",
        style: {
          fontSize: "16px",
          fontWeight: "bold",
        },
      },
      colors: [
        "#8B5CF6",
        "#06B6D4",
        "#10B981",
        "#F59E0B",
        "#EF4444",
        "#6366F1",
      ],
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200,
            },
            legend: {
              position: "bottom",
            },
          },
        },
      ],
    };

    switch (graphType.toLowerCase()) {
      case "bar":
        return {
          series: [
            {
              name: title,
              data: data.values || [],
            },
          ],
          options: {
            ...baseOptions,
            chart: {
              ...baseOptions.chart,
              type: "bar",
            },
            xaxis: {
              categories: data.labels || [],
            },
            plotOptions: {
              bar: {
                horizontal: false,
                columnWidth: "55%",
                endingShape: "rounded",
              },
            },
          },
        };

      case "line":
        return {
          series: [
            {
              name: title,
              data: data.values || [],
            },
          ],
          options: {
            ...baseOptions,
            chart: {
              ...baseOptions.chart,
              type: "line",
            },
            xaxis: {
              categories: data.labels || [],
            },
            stroke: {
              curve: "smooth",
              width: 3,
            },
            markers: {
              size: 5,
            },
          },
        };

      case "area":
        return {
          series: [
            {
              name: title,
              data: data.values || [],
            },
          ],
          options: {
            ...baseOptions,
            chart: {
              ...baseOptions.chart,
              type: "area",
            },
            xaxis: {
              categories: data.labels || [],
            },
            fill: {
              type: "gradient",
              gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.7,
                opacityTo: 0.9,
                stops: [0, 90, 100],
              },
            },
          },
        };

      case "pie":
        return {
          series: data.values || [],
          options: {
            ...baseOptions,
            chart: {
              ...baseOptions.chart,
              type: "pie",
            },
            labels: data.labels || [],
            legend: {
              position: "bottom",
            },
          },
        };

      case "donut":
        return {
          series: data.values || [],
          options: {
            ...baseOptions,
            chart: {
              ...baseOptions.chart,
              type: "donut",
            },
            labels: data.labels || [],
            legend: {
              position: "bottom",
            },
            plotOptions: {
              pie: {
                donut: {
                  size: "70%",
                },
              },
            },
          },
        };

      case "scatter":
        return {
          series: [
            {
              name: title,
              data: data.values || [],
            },
          ],
          options: {
            ...baseOptions,
            chart: {
              ...baseOptions.chart,
              type: "scatter",
            },
            xaxis: {
              categories: data.labels || [],
            },
          },
        };

      case "radar":
        return {
          series: [
            {
              name: title,
              data: data.values || [],
            },
          ],
          options: {
            ...baseOptions,
            chart: {
              ...baseOptions.chart,
              type: "radar",
            },
            xaxis: {
              categories: data.labels || [],
            },
          },
        };

      case "radialbar":
        return {
          series: data.values || [],
          options: {
            ...baseOptions,
            chart: {
              ...baseOptions.chart,
              type: "radialBar",
            },
            labels: data.labels || [],
            plotOptions: {
              radialBar: {
                dataLabels: {
                  name: {
                    fontSize: "22px",
                  },
                  value: {
                    fontSize: "16px",
                  },
                  total: {
                    show: true,
                    label: "Total",
                    formatter: function (w: any) {
                      return (
                        w.globals.seriesTotals.reduce(
                          (a: number, b: number) => {
                            return a + b;
                          },
                          0
                        ) / w.globals.series.length
                      ).toFixed(0);
                    },
                  },
                },
              },
            },
          },
        };

      case "heatmap":
        return {
          series: [
            {
              name: title,
              data: data.values || [],
            },
          ],
          options: {
            ...baseOptions,
            chart: {
              ...baseOptions.chart,
              type: "heatmap",
            },
            xaxis: {
              categories: data.labels || [],
            },
          },
        };

      case "treemap":
        return {
          series: [
            {
              data: (data.labels || []).map((label: string, index: number) => ({
                x: label,
                y: data.values[index] || 0,
              })),
            },
          ],
          options: {
            ...baseOptions,
            chart: {
              ...baseOptions.chart,
              type: "treemap",
            },
          },
        };

      case "boxplot":
        return {
          series: [
            {
              name: title,
              data: data.values || [],
            },
          ],
          options: {
            ...baseOptions,
            chart: {
              ...baseOptions.chart,
              type: "boxPlot",
            },
            xaxis: {
              categories: data.labels || [],
            },
          },
        };

      case "candlestick":
        return {
          series: [
            {
              data: data.values || [],
            },
          ],
          options: {
            ...baseOptions,
            chart: {
              ...baseOptions.chart,
              type: "candlestick",
            },
            xaxis: {
              categories: data.labels || [],
            },
          },
        };

      case "bubble":
        return {
          series: [
            {
              name: title,
              data: data.values || [],
            },
          ],
          options: {
            ...baseOptions,
            chart: {
              ...baseOptions.chart,
              type: "bubble",
            },
            xaxis: {
              categories: data.labels || [],
            },
          },
        };

      default:
        // Default to bar chart
        return {
          series: [
            {
              name: title,
              data: data.values || [],
            },
          ],
          options: {
            ...baseOptions,
            chart: {
              ...baseOptions.chart,
              type: "bar",
            },
            xaxis: {
              categories: data.labels || [],
            },
          },
        };
    }
  };

  // PDF Generation Function
  const generatePDF = async () => {
    try {
      setLoading(true);

      // Get the report content element
      const reportElement = document.getElementById("report-content");
      if (!reportElement) {
        toast({
          title: "Errore",
          description: "Contenuto del report non trovato",
          variant: "destructive",
        });
        return;
      }

      // Create canvas from the report content
      const canvas = await html2canvas(reportElement, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        width: reportElement.scrollWidth,
        height: reportElement.scrollHeight,
      });

      // Calculate dimensions for PDF
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      // Create PDF
      const pdf = new jsPDF("p", "mm", "a4");
      let position = 0;

      // Add first page
      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        0,
        position,
        imgWidth,
        imgHeight
      );
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(
          canvas.toDataURL("image/png"),
          "PNG",
          0,
          position,
          imgWidth,
          imgHeight
        );
        heightLeft -= pageHeight;
      }

      // Save the PDF
      const fileName = `${report?.title || "Report"}_${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      pdf.save(fileName);

      toast({
        title: "PDF Generato",
        description: "Il report è stato salvato come PDF",
        variant: "default",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Errore",
        description: "Errore durante la generazione del PDF",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch and store the report template
  const ReportRender = async (questionnaireId: string, ai_response: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/prompt-templates/template/${questionnaireId}`
      );
      console.log(
        "Fetching report template for questionnaireiii:",
        questionnaireId
      );
      console.log("Response statusiii:", response);
      if (!response.ok) {
        throw new Error("Errore nel recupero del template del report");
      }

      const data = await response.json();
      const templateString = data.reportTemplate; // Assuming this is the string you provided
      console.log("Template String:", templateString);

      // Parse template to handle multi-section rows
      const parseReportTemplate = (templateString: string) => {
        const lines = templateString.split("\n").filter((line) => line.trim());
        const parsedStructure = [];

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          // Check if line contains pipe separator for multiple sections in one row
          if (trimmedLine.includes(" | ")) {
            const sectionsInRow = trimmedLine
              .split(" | ")
              .map((section) => section.trim())
              .filter((section) => section.match(/\[.*\]/));

            if (sectionsInRow.length > 1) {
              parsedStructure.push({
                type: "row",
                sections: sectionsInRow.map((shortcode) =>
                  shortcode.replace(/[\[\]]/g, "")
                ),
              });
            } else {
              // Single section
              const shortcode = trimmedLine.replace(/[\[\]]/g, "");
              if (shortcode) {
                parsedStructure.push({
                  type: "single",
                  shortcode,
                });
              }
            }
          } else {
            // Single section
            const shortcode = trimmedLine.replace(/[\[\]]/g, "");
            if (shortcode) {
              parsedStructure.push({
                type: "single",
                shortcode,
              });
            }
          }
        }

        return parsedStructure;
      };

      // Parse the template structure
      const templateStructure = parseReportTemplate(templateString);
      console.log("Parsed Template Structure:", templateStructure);

      // Convert the string to an array (keep for backward compatibility)
      const defined_template = templateString
        .split("\n") // Split by newline
        .filter((item) => item.trim() !== ""); // Remove empty strings

      console.log("Defined Template Array:", defined_template);

      const report_ai_response = data.ai_response;
      console.log("ai responseeee", ai_response); // Log the array for debugging

      // Parse the report_ai_response JSON with error handling
      let parsed_ai_response;
      try {
        parsed_ai_response = JSON.parse(ai_response);
      } catch (parseError) {
        console.error("Error parsing AI response JSON:", parseError);
        console.error("Invalid AI response:", ai_response);
        parsed_ai_response = { sections: [] }; // Default to empty sections
      }

      console.log("Parsed AI Response:", parsed_ai_response);

      // Check if we have the new structure (sections array directly) or old structure (separate arrays)
      let allSections = [];

      if (
        parsed_ai_response?.sections &&
        Array.isArray(parsed_ai_response.sections)
      ) {
        // New structure: sections array directly
        console.log("Using new structure: sections array directly");
        allSections = parsed_ai_response.sections.map((section: any) => ({
          id: section.id || `${section.section_type}_${section.shortcode}`,
          type: section.section_type || "text",
          shortcode: section.shortcode,
          title: section.title,
          content: section.content || null,
          data:
            section.section_type === "graph"
              ? section.data
              : section.section_type === "table"
              ? { headers: section.headers, rows: section.rows }
              : null,
          headers: section.headers || null,
          rows: section.rows || null,
          graph_type: section.type || section.graph_type || "bar",
        }));
      } else {
        // Old structure: separate arrays
        console.log("Using old structure: separate arrays");
        const textSections = (parsed_ai_response?.text_sections || []).map(
          (section: any) => ({
            id: section.id || `text_${section.shortcode}`,
            type: section.section_type || "text",
            shortcode: section.shortcode,
            title: section.title,
            content: section.content || null,
            data: null,
            headers: null,
            rows: null,
            graph_type: null,
          })
        );

        const graphSections = (parsed_ai_response?.graph_sections || []).map(
          (section: any) => ({
            id: section.id || `graph_${section.shortcode}`,
            type: section.section_type || "graph",
            shortcode: section.shortcode,
            title: section.title,
            content: section.content || null,
            data: section.content || null,
            headers: null,
            rows: null,
            graph_type: section.graph_type || "bar",
          })
        );

        const tableSections = (parsed_ai_response?.table_sections || []).map(
          (section: any) => ({
            id: section.id || `table_${section.shortcode}`,
            type: section.section_type || "table",
            shortcode: section.shortcode,
            title: section.title,
            content: null,
            data: section.content || null,
            headers: section.content?.headers || null,
            rows: section.content?.rows || null,
            graph_type: null,
          })
        );

        // Combine all sections from different arrays into one sectionsArray
        allSections = [...textSections, ...graphSections, ...tableSections];
      }

      // Use the combined sections array
      const sectionsArray = allSections;

      console.log("Sections Array:", sectionsArray); // Log the converted array

      // Helper function to render individual sections
      const renderSectionContent = (
        matchingSection: any,
        shortcode: string
      ) => {
        if (matchingSection) {
          console.log(
            `Found matching section for ${shortcode}:`,
            matchingSection
          );

          // Render based on section type
          switch (matchingSection.type) {
            case "text":
              return {
                shortcode,
                type: "text",
                title: matchingSection.title,
                content: matchingSection.content,
              };
            case "graph":
              return {
                shortcode,
                type: "graph",
                title: matchingSection.title,
                data: matchingSection.data,
                graph_type: matchingSection.graph_type,
                chartConfig: matchingSection.data
                  ? createChartConfig(
                      matchingSection.data,
                      matchingSection.graph_type,
                      matchingSection.title
                    )
                  : null,
              };
            case "table":
              return {
                shortcode,
                type: "table",
                title: matchingSection.title,
                headers: matchingSection.headers,
                rows: matchingSection.rows,
              };
            default:
              return {
                shortcode,
                type: "unknown",
                title: matchingSection.title,
                placeholder: `[Unknown type: ${shortcode}]`,
              };
          }
        } else {
          console.warn(`No matching section found for shortcode: ${shortcode}`);
          return {
            shortcode,
            type: "missing",
            title: "Missing Section",
            placeholder: `[Missing: ${shortcode}]`,
          };
        }
      };

      // Render the template structure (supports multi-section rows)
      const renderTemplateStructure = (
        structure: any[],
        sectionsArray: any[]
      ) => {
        return structure.map((item, index) => {
          if (item.type === "row") {
            // Multiple sections in one row
            return {
              type: "row",
              index,
              sections: item.sections.map((shortcode: string) => {
                const matchedSection = sectionsArray.find(
                  (section) => section.shortcode === shortcode
                );
                return renderSectionContent(matchedSection, shortcode);
              }),
            };
          } else {
            // Single section
            const matchedSection = sectionsArray.find(
              (section) => section.shortcode === item.shortcode
            );
            return {
              type: "single",
              index,
              section: renderSectionContent(matchedSection, item.shortcode),
            };
          }
        });
      };

      // Generate rendered content using new structure
      const structuredContent = renderTemplateStructure(
        templateStructure,
        sectionsArray
      );
      console.log("Structured Content:", structuredContent);

      // Match defined_template with sectionsArray and render content (keep for backward compatibility)
      const renderedContent = defined_template.map((templateShortcode) => {
        // Remove brackets from template shortcode for matching
        const cleanShortcode = templateShortcode.replace(/\[|\]/g, "");

        // Find matching section in sectionsArray
        const matchingSection = sectionsArray.find(
          (section) => section.shortcode === cleanShortcode
        );

        return renderSectionContent(matchingSection, cleanShortcode);
      });

      console.log("Rendered Content:", renderedContent);

      // Store both the structured content and rendered content in state
      setStructuredContent(structuredContent);
      setRenderedSections(renderedContent);
    } catch (error) {
      console.error("Error fetching report template:", error);
    }
  };

  useEffect(() => {
    const loadReportAndAIResponse = async () => {
      setLoading(true);
      try {
        if (!id) {
          throw new Error("ID del report non specificato");
        }

        // Fetch the report data
        console.log("Calling fetchReportById with id:", id);
        const reportData = await fetchReportById(id);
        console.log("Raw fetchReportById response:", reportData);
        console.log("Type of reportData:", typeof reportData);
        console.log("Is reportData an array?", Array.isArray(reportData));

        // Handle the case where reportData is an array
        const extractedReportData = Array.isArray(reportData)
          ? reportData[0]
          : reportData;
        console.log("Extracted Report Data:", extractedReportData);
        console.log(
          "Extracted data properties:",
          Object.keys(extractedReportData || {})
        );

        if (!extractedReportData) {
          throw new Error("Report non trovato");
        }

        setReport(extractedReportData);

        // Fetch the AI response
        const response = await fetch(
          `${API_BASE_URL}/reports/${id}/ai-response`
        );
        if (!response.ok) {
          throw new Error("Errore nel recupero della risposta AI");
        }

        const data = await response.json();
        setAiResponse(data.aiResponse);

        // Call ReportRender after the report is loaded
        if (extractedReportData.questionnaire_id) {
          console.log(
            "Calling ReportRender with questionnaire_id:",
            extractedReportData.questionnaire_id
          ); // Debug log
          await ReportRender(
            extractedReportData.questionnaire_id,
            data.aiResponse
          );
        } else {
          console.warn("Questionnaire ID is missing or undefined");
        }
      } catch (error) {
        console.error("Error loading report or AI response:", error);
        toast({
          title: "Errore",
          description:
            error.message ||
            "Si è verificato un errore nel caricamento del report",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadReportAndAIResponse();
  }, [id, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-simoly-purple mx-auto"></div>
          <p className="mt-4">Caricamento report in corso...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Report non trovato</h1>
        <p className="mb-8">
          Il report richiesto non esiste o non è accessibile.
        </p>
        <Button onClick={() => navigate("/dashboard")}>
          Torna alla Dashboard
        </Button>
      </div>
    );
  }

  const hasSections = report.sections && report.sections.length > 0;

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="outline"
        className="mb-6"
        onClick={() => navigate("/dashboard")}
      >
        ← Torna alla Dashboard
      </Button>

      <div id="report-content" className="bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">
          {report.title || "Report di Analisi Personalizzato"}
        </h1>

        {report.date && (
          <p className="text-center text-gray-500 mb-8">
            Generato il {new Date(report.date).toLocaleDateString("it-IT")}
          </p>
        )}
        {report.pdf_url && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  PDF Report disponibile
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(
                      `http://localhost:4000${report.pdf_url}`,
                      "_blank"
                    )
                  }
                >
                  Visualizza PDF
                </Button>

                <a
                  href={`http://localhost:4000${report.pdf_url}`}
                  download={`${report.title || "Report"}.pdf`}
                >
                  <Button variant="default" size="sm">
                    Scarica PDF
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="divider my-8"></div>

        {/* Render the sections based on structured template order (supports multi-section rows) */}
        {structuredContent.length > 0 && (
          <div className="space-y-6">
            {structuredContent.map((item, index) => {
              if (item.type === "row") {
                // Multiple sections in one row
                const gridCols =
                  item.sections.length === 2
                    ? "grid-cols-2"
                    : item.sections.length === 3
                    ? "grid-cols-3"
                    : item.sections.length === 4
                    ? "grid-cols-4"
                    : "grid-cols-1";

                return (
                  <div key={index} className={`grid gap-4 ${gridCols}`}>
                    {item.sections.map((section: any, sectionIndex: number) => (
                      <div key={sectionIndex} className="border-b pb-4">
                        <h3 className="text-xl font-semibold mb-3">
                          {section.title}
                        </h3>
                        {section.type === "text" && (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-l-4 border-blue-500 shadow-sm">
                            <div className="prose prose-lg max-w-none">
                              <p className="text-gray-800 leading-relaxed text-justify font-medium tracking-wide">
                                {section.content}
                              </p>
                            </div>
                          </div>
                        )}
                        {section.type === "graph" && section.chartConfig && (
                          <div className="bg-white p-4 rounded-lg border">
                            <Chart
                              options={section.chartConfig.options}
                              series={section.chartConfig.series}
                              type={section.graph_type?.toLowerCase() || "bar"}
                              height={350}
                            />
                            <div className="mt-2 text-sm text-gray-500">
                              <p>Graph Type: {section.graph_type}</p>
                              <p>
                                Data Points: {section.data?.values?.length || 0}
                              </p>
                            </div>
                          </div>
                        )}
                        {section.type === "graph" && !section.chartConfig && (
                          <div className="bg-yellow-100 p-4 rounded-lg">
                            <p className="text-yellow-700">
                              No data available for this graph
                            </p>
                          </div>
                        )}
                        {section.type === "table" && (
                          <div className="bg-white p-4 rounded-lg border overflow-x-auto">
                            {section.headers && section.rows ? (
                              <table className="min-w-full table-auto">
                                <thead>
                                  <tr className="bg-gray-50">
                                    {section.headers.map(
                                      (header: string, headerIndex: number) => (
                                        <th
                                          key={headerIndex}
                                          className="px-4 py-2 text-center font-semibold text-gray-700"
                                        >
                                          {header}
                                        </th>
                                      )
                                    )}
                                  </tr>
                                </thead>
                                <tbody>
                                  {section.rows.map(
                                    (row: any[], rowIndex: number) => (
                                      <tr key={rowIndex} className="border-t">
                                        {row.map(
                                          (cell: any, cellIndex: number) => (
                                            <td
                                              key={cellIndex}
                                              className="px-4 py-2 text-center text-gray-600"
                                            >
                                              {cell}
                                            </td>
                                          )
                                        )}
                                      </tr>
                                    )
                                  )}
                                </tbody>
                              </table>
                            ) : (
                              <p className="text-gray-500">
                                No table data available
                              </p>
                            )}
                          </div>
                        )}
                        {section.type === "missing" && (
                          <div className="bg-red-100 p-4 rounded-lg">
                            <p className="text-red-600 italic">
                              {section.placeholder}
                            </p>
                          </div>
                        )}
                        {section.type === "unknown" && (
                          <div className="bg-gray-100 p-4 rounded-lg">
                            <p className="text-gray-600 italic">
                              {section.placeholder}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              } else {
                // Single section (full width)
                const section = item.section;
                return (
                  <div key={index} className="border-b pb-4">
                    <h3 className="text-xl font-semibold mb-3">
                      {section.title}
                    </h3>
                    {section.type === "text" && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-l-4 border-blue-500 shadow-sm">
                        <div className="prose prose-lg max-w-none">
                          <p className="text-gray-800 leading-relaxed text-justify font-medium tracking-wide">
                            {section.content}
                          </p>
                        </div>
                      </div>
                    )}
                    {section.type === "graph" && section.chartConfig && (
                      <div className="bg-white p-4 rounded-lg border">
                        <Chart
                          options={section.chartConfig.options}
                          series={section.chartConfig.series}
                          type={section.graph_type?.toLowerCase() || "bar"}
                          height={350}
                        />
                        <div className="mt-2 text-sm text-gray-500">
                          <p>Graph Type: {section.graph_type}</p>
                          <p>
                            Data Points: {section.data?.values?.length || 0}
                          </p>
                        </div>
                      </div>
                    )}
                    {section.type === "graph" && !section.chartConfig && (
                      <div className="bg-yellow-100 p-4 rounded-lg">
                        <p className="text-yellow-700">
                          No data available for this graph
                        </p>
                      </div>
                    )}
                    {section.type === "table" && (
                      <div className="bg-white p-4 rounded-lg border overflow-x-auto">
                        {section.headers && section.rows ? (
                          <table className="min-w-full table-auto">
                            <thead>
                              <tr className="bg-gray-50">
                                {section.headers.map(
                                  (header: string, headerIndex: number) => (
                                    <th
                                      key={headerIndex}
                                      className="px-4 py-2 text-center font-semibold text-gray-700"
                                    >
                                      {header}
                                    </th>
                                  )
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {section.rows.map(
                                (row: any[], rowIndex: number) => (
                                  <tr key={rowIndex} className="border-t">
                                    {row.map((cell: any, cellIndex: number) => (
                                      <td
                                        key={cellIndex}
                                        className="px-4 py-2 text-center text-gray-600"
                                      >
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        ) : (
                          <p className="text-gray-500">
                            No table data available
                          </p>
                        )}
                      </div>
                    )}
                    {section.type === "missing" && (
                      <div className="bg-red-100 p-4 rounded-lg">
                        <p className="text-red-600 italic">
                          {section.placeholder}
                        </p>
                      </div>
                    )}
                    {section.type === "unknown" && (
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <p className="text-gray-600 italic">
                          {section.placeholder}
                        </p>
                      </div>
                    )}
                  </div>
                );
              }
            })}
          </div>
        )}

        {/* Fallback to old rendering if no structured content */}
        {structuredContent.length === 0 && renderedSections.length > 0 && (
          <div className="space-y-6">
            {renderedSections.map((section, index) => (
              <div key={index} className="border-b pb-4">
                <h3 className="text-xl font-semibold mb-3">{section.title}</h3>
                {section.type === "text" && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-l-4 border-blue-500 shadow-sm">
                    <div className="prose prose-lg max-w-none">
                      <p className="text-gray-800 leading-relaxed text-justify font-medium tracking-wide">
                        {section.content}
                      </p>
                    </div>
                  </div>
                )}
                {section.type === "graph" && section.chartConfig && (
                  <div className="bg-white p-4 rounded-lg border">
                    <Chart
                      options={section.chartConfig.options}
                      series={section.chartConfig.series}
                      type={section.graph_type?.toLowerCase() || "bar"}
                      height={350}
                    />
                    <div className="mt-2 text-sm text-gray-500">
                      <p>Graph Type: {section.graph_type}</p>
                      <p>Data Points: {section.data?.values?.length || 0}</p>
                    </div>
                  </div>
                )}
                {section.type === "graph" && !section.chartConfig && (
                  <div className="bg-yellow-100 p-4 rounded-lg">
                    <p className="text-yellow-700">
                      No data available for this graph
                    </p>
                  </div>
                )}
                {section.type === "table" && (
                  <div className="bg-white p-4 rounded-lg border overflow-x-auto">
                    {section.headers && section.rows ? (
                      <table className="min-w-full table-auto">
                        <thead>
                          <tr className="bg-gray-50">
                            {section.headers.map(
                              (header: string, headerIndex: number) => (
                                <th
                                  key={headerIndex}
                                  className="px-4 py-2 text-center font-semibold text-gray-700"
                                >
                                  {header}
                                </th>
                              )
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {section.rows.map((row: any[], rowIndex: number) => (
                            <tr key={rowIndex} className="border-t">
                              {row.map((cell: any, cellIndex: number) => (
                                <td
                                  key={cellIndex}
                                  className="px-4 py-2 text-center text-gray-600"
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-gray-500">No table data available</p>
                    )}
                  </div>
                )}
                {section.type === "missing" && (
                  <div className="bg-red-100 p-4 rounded-lg">
                    <p className="text-red-600 italic">{section.placeholder}</p>
                  </div>
                )}
                {section.type === "unknown" && (
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <p className="text-gray-600 italic">
                      {section.placeholder}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!structuredContent.length && !renderedSections.length && (
          <div className="text-center text-gray-500">
            <h2 className="text-xl font-bold mb-4">Custom Analysis Report</h2>
            <p>Questo report non contiene sezioni.</p>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-end space-x-2">
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          Torna alla Dashboard
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          Stampa Report
        </Button>
        <Button
          variant="default"
          onClick={generatePDF}
          disabled={loading || !renderedSections.length}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {loading ? "Generando PDF..." : "Scarica PDF"}
        </Button>
      </div>
    </div>
  );
};

export default Report;
