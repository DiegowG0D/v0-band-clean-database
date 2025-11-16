"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileSpreadsheet, FileText, Plus, AlertTriangle } from 'lucide-react';
import * as XLSX from "xlsx";
import { formatMaltaDateTime } from "@/lib/utils/date-utils";

interface AttendanceLog {
  id: string;
  clock_in: string;
  clock_out: string | null;
  total_hours: number | null;
  status: string;
  notes: string | null;
  delay_minutes: number | null;
  is_delayed: boolean | null;
  users: {
    full_name: string;
  };
}

const MONTHS = [
  { value: "all", label: "All Months" },
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export default function TimesheetPage() {
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [cleaners, setCleaners] = useState<{ id: string; full_name: string }[]>([]);
  const [selectedCleaner, setSelectedCleaner] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
  const [years, setYears] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Generate years from 2025 to current year + 1
    const currentYear = new Date().getFullYear();
    const yearList = [];
    for (let year = 2025; year <= currentYear + 1; year++) {
      yearList.push(year);
    }
    setYears(yearList);
  }, []);

  useEffect(() => {
    fetchCleaners();
    fetchAttendance();
  }, [selectedCleaner, selectedMonth, selectedYear]);

  const fetchCleaners = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("users")
      .select("id, full_name")
      .eq("role", "cleaner")
      .order("full_name", { ascending: true });

    if (data) setCleaners(data);
  };

  const fetchAttendance = async () => {
    setIsLoading(true);
    const supabase = createClient();

    // Calculate date range for selected month/year
    const year = parseInt(selectedYear);
    let startDate: Date;
    let endDate: Date;

    if (selectedMonth === "all") {
      // Get all months for the selected year
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59);
    } else {
      // Get specific month
      const month = parseInt(selectedMonth);
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59);
    }

    let query = supabase
      .from("attendance_logs")
      .select(`
        id,
        clock_in,
        clock_out,
        total_hours,
        status,
        notes,
        delay_minutes,
        is_delayed,
        users:cleaner_id (full_name)
      `)
      .gte("clock_in", startDate.toISOString())
      .lte("clock_in", endDate.toISOString())
      .order("clock_in", { ascending: false });

    if (selectedCleaner !== "all") {
      query = query.eq("cleaner_id", selectedCleaner);
    }

    const { data } = await query;
    if (data) setAttendanceLogs(data);
    setIsLoading(false);
  };

  const addYear = () => {
    const newYear = Math.max(...years) + 1;
    setYears([...years, newYear]);
    setSelectedYear(String(newYear));
  };

  const getExportFilename = (extension: string) => {
    const parts: string[] = ["Timesheet"];
    
    // Add cleaner name if specific cleaner is selected
    if (selectedCleaner !== "all") {
      const cleaner = cleaners.find((c) => c.id === selectedCleaner);
      if (cleaner) {
        parts.push(cleaner.full_name.replace(/\s+/g, "_"));
      }
    }
    
    // Add month name or "All_Months"
    if (selectedMonth === "all") {
      parts.push("All_Months");
    } else {
      const monthName = MONTHS.find((m) => m.value === selectedMonth)?.label;
      if (monthName) {
        parts.push(monthName);
      }
    }
    
    // Add year
    parts.push(selectedYear);
    
    return `${parts.join("_")}.${extension}`;
  };

  const exportToXLSX = () => {
    const exportData = attendanceLogs.map((log) => ({
      Cleaner: log.users?.full_name || "N/A",
      Date: new Date(log.clock_in).toLocaleDateString("en-GB", {
        timeZone: "Europe/Malta",
      }),
      "Clock In": new Date(log.clock_in).toLocaleTimeString("en-GB", {
        timeZone: "Europe/Malta",
        hour: "2-digit",
        minute: "2-digit",
      }),
      "Clock Out": log.clock_out
        ? new Date(log.clock_out).toLocaleTimeString("en-GB", {
            timeZone: "Europe/Malta",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "N/A",
      "Total Hours": log.total_hours ? Number(log.total_hours).toFixed(2) : "N/A",
      Status: log.status,
      "Delay (min)": log.is_delayed ? log.delay_minutes || 0 : 0,
      Notes: log.notes || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Timesheet");

    XLSX.writeFile(wb, getExportFilename("xlsx"));
  };

  const exportToCSV = () => {
    const exportData = attendanceLogs.map((log) => ({
      Cleaner: log.users?.full_name || "N/A",
      Date: new Date(log.clock_in).toLocaleDateString("en-GB", {
        timeZone: "Europe/Malta",
      }),
      "Clock In": new Date(log.clock_in).toLocaleTimeString("en-GB", {
        timeZone: "Europe/Malta",
        hour: "2-digit",
        minute: "2-digit",
      }),
      "Clock Out": log.clock_out
        ? new Date(log.clock_out).toLocaleTimeString("en-GB", {
            timeZone: "Europe/Malta",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "N/A",
      "Total Hours": log.total_hours ? Number(log.total_hours).toFixed(2) : "N/A",
      Status: log.status,
      "Delay (min)": log.is_delayed ? log.delay_minutes || 0 : 0,
      Notes: log.notes || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(ws);

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = getExportFilename("csv");
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalHours = attendanceLogs.reduce(
    (sum, log) => sum + (Number(log.total_hours) || 0),
    0
  );

  const delayedLogs = attendanceLogs.filter(log => log.is_delayed);
  const avgDelayMinutes = delayedLogs.length > 0 
    ? delayedLogs.reduce((sum, log) => sum + (log.delay_minutes || 0), 0) / delayedLogs.length 
    : 0;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Timesheet Report</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            View and export attendance records
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Cleaner</label>
              <Select value={selectedCleaner} onValueChange={setSelectedCleaner}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cleaners</SelectItem>
                  {cleaners.map((cleaner) => (
                    <SelectItem key={cleaner.id} value={cleaner.id}>
                      {cleaner.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={addYear} variant="outline" className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Add Year
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceLogs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Hours/Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {attendanceLogs.length > 0
                ? (totalHours / attendanceLogs.length).toFixed(1)
                : 0}h
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Delayed Clock-Ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {delayedLogs.length}
            </div>
            {delayedLogs.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Avg: {avgDelayMinutes.toFixed(0)} min late
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Export Buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button onClick={exportToXLSX} className="gap-2" disabled={attendanceLogs.length === 0}>
          <FileSpreadsheet className="h-4 w-4" />
          Export as XLSX
        </Button>
        <Button
          onClick={exportToCSV}
          variant="outline"
          className="gap-2"
          disabled={attendanceLogs.length === 0}
        >
          <FileText className="h-4 w-4" />
          Export as CSV
        </Button>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : attendanceLogs.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Cleaner</th>
                      <th className="text-left p-2 font-medium">Date</th>
                      <th className="text-left p-2 font-medium">Clock In</th>
                      <th className="text-left p-2 font-medium">Clock Out</th>
                      <th className="text-left p-2 font-medium">Total Hours</th>
                      <th className="text-left p-2 font-medium">Status</th>
                      <th className="text-left p-2 font-medium">Delay</th>
                      <th className="text-left p-2 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceLogs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{log.users?.full_name || "N/A"}</td>
                        <td className="p-2 text-sm">
                          {new Date(log.clock_in).toLocaleDateString("en-GB", {
                            timeZone: "Europe/Malta",
                          })}
                        </td>
                        <td className="p-2 text-sm">
                          {new Date(log.clock_in).toLocaleTimeString("en-GB", {
                            timeZone: "Europe/Malta",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="p-2 text-sm">
                          {log.clock_out
                            ? new Date(log.clock_out).toLocaleTimeString("en-GB", {
                                timeZone: "Europe/Malta",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </td>
                        <td className="p-2 font-medium">
                          {log.total_hours ? `${Number(log.total_hours).toFixed(2)}h` : "-"}
                        </td>
                        <td className="p-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              log.status === "clocked_out"
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="p-2">
                          {log.is_delayed ? (
                            <span className="inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400 text-sm font-medium">
                              <AlertTriangle className="h-3 w-3" />
                              {log.delay_minutes} min
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </td>
                        <td className="p-2 text-sm text-muted-foreground">{log.notes || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {attendanceLogs.map((log) => (
                  <Card key={log.id}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{log.users?.full_name || "N/A"}</span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            log.status === "clocked_out"
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                          }`}
                        >
                          {log.status}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(log.clock_in).toLocaleDateString("en-GB", {
                          timeZone: "Europe/Malta",
                        })}
                      </div>
                      {log.is_delayed && (
                        <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 text-sm font-medium">
                          <AlertTriangle className="h-4 w-4" />
                          Clocked in {log.delay_minutes} min late
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">In: </span>
                          {new Date(log.clock_in).toLocaleTimeString("en-GB", {
                            timeZone: "Europe/Malta",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Out: </span>
                          {log.clock_out
                            ? new Date(log.clock_out).toLocaleTimeString("en-GB", {
                                timeZone: "Europe/Malta",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </div>
                      </div>
                      <div className="text-sm font-medium">
                        Total: {log.total_hours ? `${Number(log.total_hours).toFixed(2)}h` : "-"}
                      </div>
                      {log.notes && (
                        <div className="text-sm text-muted-foreground pt-2 border-t">
                          {log.notes}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No attendance records found for selected filters
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
