import React, { useState, useEffect, useMemo } from "react";
import { format, subDays, subMonths } from "date-fns";
import { it } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Filter,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Users,
  FileCheck,
  CreditCard,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  fetchUserStatistics,
  fetchQuestionnaireStatistics,
  fetchSubscriptionStatistics,
  fetchQuestionAnswerStats,
  fetchAllQuestions,
  fetchDemographicData,
  fetchAvailableFilters,
  fetchAgeDistribution,
  fetchRetentionData,
  fetchCompletionByDemographic,
} from "@/services/admin-statistics";
import { toast } from "@/components/ui/use-toast";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#a78bfa",
  "#818cf8",
  "#9333ea",
  "#6366f1",
  "#4c1d95",
];

type DateRange = {
  from: Date | null;
  to: Date | null;
};

const predefinedDateRanges = [
  {
    label: "Ultimi 7 giorni",
    getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }),
  },
  {
    label: "Ultimi 30 giorni",
    getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }),
  },
  {
    label: "Ultimo mese",
    getValue: () => ({ from: subMonths(new Date(), 1), to: new Date() }),
  },
  {
    label: "Ultimi 3 mesi",
    getValue: () => ({ from: subMonths(new Date(), 3), to: new Date() }),
  },
  {
    label: "Ultimi 6 mesi",
    getValue: () => ({ from: subMonths(new Date(), 6), to: new Date() }),
  },
  {
    label: "Ultimo anno",
    getValue: () => ({ from: subMonths(new Date(), 12), to: new Date() }),
  },
];

const ReportsPage = () => {
  // Main state variables
  const [activeTab, setActiveTab] = useState("overview");
  const [userStats, setUserStats] = useState<any>(null);
  const [questionnaireStats, setQuestionnaireStats] = useState<any>(null);
  const [subscriptionStats, setSubscriptionStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<string>("");
  const [questionData, setQuestionData] = useState<any>(null);

  // Advanced demographics state
  const [demographicField, setDemographicField] = useState("role");
  const [demographicData, setDemographicData] = useState<any[]>([]);
  const [ageDistribution, setAgeDistribution] = useState<any[]>([]);
  const [retentionData, setRetentionData] = useState<any[]>([]);
  const [completionByDemographic, setCompletionByDemographic] = useState<any[]>(
    []
  );

  // Filters state
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [availableFilters, setAvailableFilters] = useState<
    Record<string, string[]>
  >({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Date range formatter
  const formatDateRange = (range: DateRange) => {
    if (!range.from && !range.to) return "Seleziona periodo";
    if (!range.from)
      return `Fino al ${format(range.to!, "dd/MM/yyyy", { locale: it })}`;
    if (!range.to)
      return `Dal ${format(range.from, "dd/MM/yyyy", { locale: it })}`;

    return `${format(range.from, "dd/MM/yyyy", { locale: it })} - ${format(
      range.to,
      "dd/MM/yyyy",
      { locale: it }
    )}`;
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load filter options first
        const filterOptions = await fetchAvailableFilters();
        setAvailableFilters(filterOptions);

        // Now load main stats with date filter
        await loadAllStatistics();

        // Load questions for question analysis
        const allQuestions = await fetchAllQuestions();
        setQuestions(allQuestions);

        if (allQuestions.length > 0) {
          setSelectedQuestion(allQuestions[0].questionId);
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast({
          title: "Errore",
          description: "Si è verificato un errore nel caricamento dei dati",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Load data when filters change
  useEffect(() => {
    loadAllStatistics();
  }, [dateRange, filters]);

  // Load question data when selected question changes
  useEffect(() => {
    if (selectedQuestion) {
      fetchQuestionAnswerStats(selectedQuestion, dateRange, filters).then(
        (data) => {
          setQuestionData(data);
        }
      );
    }
  }, [selectedQuestion, dateRange, filters]);

  // Load demographic data when demographic field changes
  useEffect(() => {
    if (demographicField) {
      fetchDemographicData(demographicField, dateRange, filters).then(
        (data) => {
          setDemographicData(data);
        }
      );

      // Also update completion by demographic when field changes
      fetchCompletionByDemographic(demographicField, dateRange).then((data) => {
        setCompletionByDemographic(data);
      });
    }
  }, [demographicField, dateRange, filters]);

  // Common function to load all statistics
  const loadAllStatistics = async () => {
    try {
      setLoading(true);

      const [users, questionnaires, subscriptions, ages, retention] =
        await Promise.all([
          fetchUserStatistics(dateRange, filters),
          fetchQuestionnaireStatistics(dateRange, filters),
          fetchSubscriptionStatistics(dateRange, filters),
          fetchAgeDistribution(dateRange, filters),
          fetchRetentionData(dateRange),
        ]);

      setUserStats(users);
      setQuestionnaireStats(questionnaires);
      setSubscriptionStats(subscriptions);
      setAgeDistribution(ages);
      setRetentionData(retention);

      // Also update demographic data
      const demographics = await fetchDemographicData(
        demographicField,
        dateRange,
        filters
      );
      setDemographicData(demographics);

      // And completion by demographic
      const completion = await fetchCompletionByDemographic(
        demographicField,
        dateRange
      );
      setCompletionByDemographic(completion);

      // And selected question data if any
      if (selectedQuestion) {
        const qData = await fetchQuestionAnswerStats(
          selectedQuestion,
          dateRange,
          filters
        );
        setQuestionData(qData);
      }
    } catch (error) {
      console.error("Error loading statistics:", error);
      toast({
        title: "Errore",
        description:
          "Si è verificato un errore nel caricamento dei dati statistici",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Apply a filter
  const handleFilterChange = (key: string, value: string) => {
    if (value === "all") {
      // Remove this filter
      const newFilters = { ...filters };
      delete newFilters[key];
      setFilters(newFilters);
    } else {
      // Add or update this filter
      setFilters((prev) => ({ ...prev, [key]: value }));
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({});
    setDateRange({
      from: subDays(new Date(), 30),
      to: new Date(),
    });
  };

  // Function to export data as CSV
  const exportData = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast({
        title: "Nessun dato da esportare",
        description: "Non ci sono dati disponibili per l'esportazione",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convert data to CSV
      const headers = Object.keys(data[0]);
      const csvRows = [
        // Header row
        headers.join(","),
        // Data rows
        ...data.map((row) =>
          headers
            .map((header) => {
              const cell = row[header];
              // Handle CSV special cases (commas, quotes)
              return typeof cell === "string"
                ? `"${cell.replace(/"/g, '""')}"`
                : cell;
            })
            .join(",")
        ),
      ];

      const csvString = csvRows.join("\n");

      // Create download link
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute(
        "download",
        `${filename}-${format(new Date(), "yyyy-MM-dd")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Esportazione completata",
        description: `I dati sono stati esportati in ${filename}.csv`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Errore nell'esportazione",
        description:
          "Si è verificato un errore durante l'esportazione dei dati",
        variant: "destructive",
      });
    }
  };

  // Compute active filters for display
  const activeFilterCount = useMemo(() => {
    return Object.keys(filters).length;
  }, [filters]);

  // Loading view
  if (loading && !userStats) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Report</h1>
          <p className="text-muted-foreground">
            Analisi dettagliata delle performance
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* Date range picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-left font-normal w-full sm:w-auto"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDateRange(dateRange)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-3 space-y-3">
                <div className="grid gap-2">
                  {predefinedDateRanges.map((range) => (
                    <Button
                      key={range.label}
                      variant="outline"
                      className="justify-start text-left font-normal"
                      onClick={() => setDateRange(range.getValue())}
                    >
                      {range.label}
                    </Button>
                  ))}
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal flex-1",
                        !dateRange.from && "text-muted-foreground"
                      )}
                      onClick={() => setDateRange({ ...dateRange, from: null })}
                    >
                      Pulisci inizio
                    </Button>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal flex-1",
                        !dateRange.to && "text-muted-foreground"
                      )}
                      onClick={() => setDateRange({ ...dateRange, to: null })}
                    >
                      Pulisci fine
                    </Button>
                  </div>
                </div>
              </div>
              <Calendar
                mode="range"
                selected={{
                  from: dateRange.from || undefined,
                  to: dateRange.to || undefined,
                }}
                onSelect={(range) => {
                  setDateRange({
                    from: range?.from || null,
                    to: range?.to || null,
                  });
                }}
                numberOfMonths={2}
                locale={it}
              />
            </PopoverContent>
          </Popover>

          {/* Filters */}
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                Filtri
                {activeFilterCount > 0 && (
                  <Badge
                    className="ml-2 bg-primary text-primary-foreground"
                    variant="secondary"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4 p-2">
                <h3 className="font-medium">Filtri demografici</h3>

                {/* Role filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ruolo</label>
                  <Select
                    value={filters.role || "all"}
                    onValueChange={(value) => handleFilterChange("role", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona ruolo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti</SelectItem>
                      {availableFilters.role?.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Località</label>
                  <Select
                    value={filters.address || "all"}
                    onValueChange={(value) =>
                      handleFilterChange("address", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona località" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutte</SelectItem>
                      {availableFilters.address?.map((address) => (
                        <SelectItem key={address} value={address}>
                          {address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Subscription plan filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Piano di abbonamento
                  </label>
                  <Select
                    value={filters.subscription_plan || "all"}
                    onValueChange={(value) =>
                      handleFilterChange("subscription_plan", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona piano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti</SelectItem>
                      {availableFilters.subscription_plan?.map((plan) => (
                        <SelectItem key={plan} value={plan}>
                          {plan}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Reimposta
                  </Button>
                  <Button size="sm" onClick={() => setIsFilterOpen(false)}>
                    Applica
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="grid grid-cols-1 md:grid-cols-4 mb-8">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Panoramica
          </TabsTrigger>
          <TabsTrigger
            value="questionnaires"
            className="flex items-center gap-2"
          >
            <FileCheck className="h-4 w-4" /> Questionari
          </TabsTrigger>
          <TabsTrigger
            value="subscriptions"
            className="flex items-center gap-2"
          >
            <CreditCard className="h-4 w-4" /> Abbonamenti
          </TabsTrigger>
          <TabsTrigger value="demographics" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Demografia
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Utenti</CardTitle>
                <CardDescription>
                  Statistiche registrazioni utenti
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {userStats?.totalUsers || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="text-primary">
                    {userStats?.newUsersThisMonth || 0}
                  </span>{" "}
                  nuovi questo mese
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    exportData(
                      userStats?.registrationTrend || [],
                      "utenti-trend"
                    )
                  }
                >
                  <Download className="h-4 w-4 mr-2" /> Esporta dati
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Abbonamenti Attivi</CardTitle>
                <CardDescription>Piani attualmente attivi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {subscriptionStats?.activeSubscriptions || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="text-primary">
                    {(
                      (subscriptionStats?.activeSubscriptions /
                        (subscriptionStats?.totalSubscriptions || 1)) *
                      100
                    ).toFixed(1)}
                    %
                  </span>{" "}
                  tasso di attivazione
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    exportData(
                      subscriptionStats?.subscriptionsByPlan || [],
                      "abbonamenti"
                    )
                  }
                >
                  <Download className="h-4 w-4 mr-2" /> Esporta dati
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Questionari Completati</CardTitle>
                <CardDescription>Risposte completate totali</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {questionnaireStats?.completedQuestionnaires || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="text-primary">
                    {(questionnaireStats?.completionRate || 0).toFixed(1)}%
                  </span>{" "}
                  tasso di completamento
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    exportData(
                      questionnaireStats?.responsesPerQuestionnaire || [],
                      "questionari"
                    )
                  }
                >
                  <Download className="h-4 w-4 mr-2" /> Esporta dati
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" /> Distribuzione Ruoli
                  Utenti
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userStats?.usersByRole?.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={userStats.usersByRole}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="role"
                        >
                          {userStats.usersByRole.map(
                            (entry: any, index: number) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            )
                          )}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [
                            `${value} utenti`,
                            "Conteggio",
                          ]}
                        />
                        <Legend formatter={(value) => `${value}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-80 text-muted-foreground">
                    Nessun dato disponibile
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChartIcon className="h-5 w-5" /> Utenti per Piano
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {userStats?.usersByPlan?.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={userStats.usersByPlan}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="planName" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [
                            `${value} utenti`,
                            "Conteggio",
                          ]}
                        />
                        <Legend />
                        <Bar dataKey="count" name="Utenti" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-80 text-muted-foreground">
                    Nessun dato disponibile
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChartIcon className="h-5 w-5" /> Andamento Registrazioni
                  Utenti
                </CardTitle>
                <CardDescription>
                  Nuovi utenti registrati nel tempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userStats?.registrationTrend?.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={userStats.registrationTrend}
                        margin={{
                          top: 10,
                          right: 30,
                          left: 0,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [
                            `${value} utenti`,
                            "Registrazioni",
                          ]}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="count"
                          name="Utenti registrati"
                          stroke="#8884d8"
                          fill="#8884d8"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-80 text-muted-foreground">
                    Nessun dato disponibile
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Questionnaires Tab */}
        <TabsContent value="questionnaires">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Analisi Risposte ai Questionari</CardTitle>
                <CardDescription>
                  Seleziona una domanda per visualizzare la distribuzione delle
                  risposte
                </CardDescription>
                <div className="mt-4">
                  <Select
                    value={selectedQuestion}
                    onValueChange={setSelectedQuestion}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleziona una domanda..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {questions.map((question) => (
                          <SelectItem
                            key={question.questionId}
                            value={question.questionId}
                          >
                            {question.title.substring(0, 60)}
                            {question.title.length > 60 ? "..." : ""}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-2/3" />
                    <Skeleton className="h-80" />
                  </div>
                ) : questionData ? (
                  <div>
                    <h3 className="font-semibold mb-4">{questionData.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Risposte totali: {questionData.totalResponses}
                    </p>

                    {questionData.totalResponses > 0 ? (
                      <>
                        <div className="h-80 mt-6">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={questionData.answerDistribution}
                              margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="answer" />
                              <YAxis yAxisId="left" />
                              <YAxis yAxisId="right" orientation="right" />
                              <Tooltip />
                              <Legend />
                              <Bar
                                yAxisId="left"
                                dataKey="count"
                                name="Risposte"
                                fill="#8884d8"
                              />
                              <Bar
                                yAxisId="right"
                                dataKey="percentage"
                                name="Percentuale (%)"
                                fill="#82ca9d"
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="mt-6">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Risposta</TableHead>
                                <TableHead>Conteggio</TableHead>
                                <TableHead>Percentuale</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {questionData.answerDistribution.map(
                                (item: any, idx: number) => (
                                  <TableRow key={idx}>
                                    <TableCell>{item.answer}</TableCell>
                                    <TableCell>{item.count}</TableCell>
                                    <TableCell>
                                      {item.percentage.toFixed(1)}%
                                    </TableCell>
                                  </TableRow>
                                )
                              )}
                            </TableBody>
                          </Table>
                        </div>

                        <div className="mt-4 flex justify-end">
                          <Button
                            variant="outline"
                            onClick={() =>
                              exportData(
                                questionData.answerDistribution,
                                "risposte-domanda"
                              )
                            }
                          >
                            <Download className="h-4 w-4 mr-2" /> Esporta dati
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-40">
                        <p className="text-muted-foreground">
                          Nessuna risposta disponibile per questa domanda
                        </p>
                      </div>
                    )}
                  </div>
                ) : selectedQuestion ? (
                  <div className="flex items-center justify-center h-80">
                    <p>Caricamento dati domanda...</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-80">
                    <p>Seleziona una domanda per visualizzare le risposte</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risposte per Questionario</CardTitle>
                <CardDescription>
                  Distribuzione delle risposte per ogni questionario
                </CardDescription>
              </CardHeader>
              <CardContent>
                {questionnaireStats?.responsesPerQuestionnaire?.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={questionnaireStats.responsesPerQuestionnaire}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="title" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [
                            `${value} risposte`,
                            "Conteggio",
                          ]}
                        />
                        <Legend />
                        <Bar dataKey="count" name="Risposte" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-80 text-muted-foreground">
                    Nessun dato disponibile
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Andamento Completamento Questionari</CardTitle>
                <CardDescription>
                  Trend risposte completate nel tempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {questionnaireStats?.responseTrend?.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={questionnaireStats.responseTrend}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="total"
                          name="Risposte totali"
                          stroke="#8884d8"
                        />
                        <Line
                          type="monotone"
                          dataKey="completed"
                          name="Risposte completate"
                          stroke="#82ca9d"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-80 text-muted-foreground">
                    Nessun dato disponibile
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Tasso di Completamento per Gruppo</CardTitle>
                    <CardDescription>
                      Analisi del completamento questionari per gruppo
                      demografico
                    </CardDescription>
                  </div>
                  <Select
                    value={demographicField}
                    onValueChange={setDemographicField}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Seleziona campo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="role">Ruolo</SelectItem>
                      <SelectItem value="address">Località</SelectItem>
                      <SelectItem value="subscription_plan">Piano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {completionByDemographic?.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={completionByDemographic}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="group" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Bar
                          yAxisId="left"
                          dataKey="total"
                          name="Risposte totali"
                          fill="#8884d8"
                        />
                        <Bar
                          yAxisId="left"
                          dataKey="completed"
                          name="Risposte completate"
                          fill="#82ca9d"
                        />
                        <Bar
                          yAxisId="right"
                          dataKey="completion_rate"
                          name="Tasso completamento (%)"
                          fill="#ffc658"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-80 text-muted-foreground">
                    Nessun dato disponibile
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Fatturato Mensile</CardTitle>
                <CardDescription>
                  Fatturato totale dagli abbonamenti
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  €{subscriptionStats?.monthlyRevenue?.toFixed(2) || "0.00"}
                </div>
                <p className="text-sm text-muted-foreground">
                  Da {subscriptionStats?.activeSubscriptions || 0} abbonamenti
                  attivi
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    exportData(
                      subscriptionStats?.subscriptionsByPlan || [],
                      "fatturato-piani"
                    )
                  }
                >
                  <Download className="h-4 w-4 mr-2" /> Esporta dati
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Stato Abbonamenti</CardTitle>
                <CardDescription>Attivi vs Totali</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-40">
                  <div className="h-40 w-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "Attivi",
                              value:
                                subscriptionStats?.activeSubscriptions || 0,
                            },
                            {
                              name: "Inattivi",
                              value:
                                (subscriptionStats?.totalSubscriptions || 0) -
                                (subscriptionStats?.activeSubscriptions || 0),
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#4ade80" />
                          <Cell fill="#f87171" />
                        </Pie>
                        <Tooltip
                          formatter={(value) => [
                            `${value} abbonamenti`,
                            "Conteggio",
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-400 mr-2"></div>
                      <span>
                        Attivi: {subscriptionStats?.activeSubscriptions || 0}
                      </span>
                    </div>
                    <div className="flex items-center mt-2">
                      <div className="w-3 h-3 bg-red-400 mr-2"></div>
                      <span>
                        Inattivi:{" "}
                        {(subscriptionStats?.totalSubscriptions || 0) -
                          (subscriptionStats?.activeSubscriptions || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Fatturato per Piano</CardTitle>
              <CardDescription>
                Analisi del fatturato per piano di abbonamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptionStats?.subscriptionsByPlan?.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={subscriptionStats.subscriptionsByPlan}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="planName" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="count"
                        name="Abbonamenti"
                        fill="#8884d8"
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="revenue"
                        name="Fatturato (€)"
                        fill="#82ca9d"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-80 text-muted-foreground">
                  Nessun dato disponibile
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Piani di Abbonamento</CardTitle>
              <CardDescription>Dettaglio fatturato per piano</CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptionStats?.subscriptionsByPlan?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Piano</TableHead>
                      <TableHead>Utenti Attivi</TableHead>
                      <TableHead>Prezzo (€)</TableHead>
                      <TableHead>Fatturato (€)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptionStats.subscriptionsByPlan.map((plan: any) => (
                      <TableRow key={plan.planName}>
                        <TableCell className="font-medium">
                          {plan.planName}
                        </TableCell>
                        <TableCell>{plan.count}</TableCell>
                        <TableCell>
                          €{(plan.revenue / plan.count).toFixed(2)}
                        </TableCell>
                        <TableCell>€{plan.revenue.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell className="font-bold">Totale</TableCell>
                      <TableCell className="font-bold">
                        {subscriptionStats.activeSubscriptions}
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell className="font-bold">
                        €{subscriptionStats.monthlyRevenue.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <div className="flex items-center justify-center h-20 text-muted-foreground">
                  Nessun dato disponibile
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Andamento Abbonamenti</CardTitle>
              <CardDescription>
                Tendenza degli abbonamenti nel tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptionStats?.subscriptionTrend?.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={subscriptionStats.subscriptionTrend}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [
                          `${value} abbonamenti`,
                          "Conteggio",
                        ]}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="total"
                        name="Abbonamenti totali"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="active"
                        name="Abbonamenti attivi"
                        stroke="#82ca9d"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-80 text-muted-foreground">
                  Nessun dato disponibile
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Demographics Tab */}
        <TabsContent value="demographics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Analisi Demografica</CardTitle>
                  <Select
                    value={demographicField}
                    onValueChange={setDemographicField}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Seleziona campo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="role">Ruolo</SelectItem>
                      <SelectItem value="address">Località</SelectItem>
                      <SelectItem value="subscription_plan">Piano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {demographicData?.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={demographicData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="value"
                        >
                          {demographicData.map((entry: any, index: number) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [
                            `${value} utenti`,
                            "Conteggio",
                          ]}
                        />
                        <Legend formatter={(value) => `${value}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-80 text-muted-foreground">
                    Nessun dato disponibile
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    exportData(
                      demographicData || [],
                      `demografica-${demographicField}`
                    )
                  }
                >
                  <Download className="h-4 w-4 mr-2" /> Esporta dati
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuzione per Età</CardTitle>
                <CardDescription>
                  Distribuzione degli utenti per fascia di età
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ageDistribution?.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={ageDistribution}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="age_group" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [
                            `${value} utenti`,
                            "Conteggio",
                          ]}
                        />
                        <Legend />
                        <Bar dataKey="count" name="Utenti" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-80 text-muted-foreground">
                    Nessun dato disponibile
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tasso di Ritenzione</CardTitle>
                <CardDescription>
                  Percentuale di utenti attivi nel tempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {retentionData?.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={retentionData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip
                          formatter={(value) => [
                            `${value}%`,
                            "Tasso di ritenzione",
                          ]}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="retention_rate"
                          name="Tasso di ritenzione"
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-80 text-muted-foreground">
                    Nessun dato disponibile
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Analisi Demografica per Gruppo</CardTitle>
                <CardDescription>
                  Dettagli specifici per ogni valore demografico
                </CardDescription>
              </CardHeader>
              <CardContent>
                {demographicData?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          {demographicField === "role"
                            ? "Ruolo"
                            : demographicField === "address"
                            ? "Località"
                            : demographicField === "subscription_plan"
                            ? "Piano"
                            : "Valore"}
                        </TableHead>
                        <TableHead>Conteggio utenti</TableHead>
                        <TableHead>Percentuale</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {demographicData.map((item: any, idx: number) => {
                        const percentage = (
                          (item.count /
                            demographicData.reduce(
                              (sum: number, curr: any) => sum + curr.count,
                              0
                            )) *
                          100
                        ).toFixed(1);
                        return (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">
                              {item.value}
                            </TableCell>
                            <TableCell>{item.count}</TableCell>
                            <TableCell>{percentage}%</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex items-center justify-center h-20 text-muted-foreground">
                    Nessun dato disponibile
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
