"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui";

interface ExportButtonProps {
  data: Record<string, any>[];
  filename: string;
}

export function ExportButton({ data, filename }: ExportButtonProps) {
  const exportToCSV = () => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma or newline
          const stringValue = String(value ?? "");
          if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToExcel = async () => {
    if (data.length === 0) return;

    // Use SheetJS (xlsx) library via CDN
    const XLSX = await import("xlsx");
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    
    // Auto-size columns
    const colWidths = Object.keys(data[0]).map(key => ({
      wch: Math.max(
        key.length,
        ...data.map(row => String(row[key] ?? "").length)
      ) + 2,
    }));
    worksheet["!cols"] = colWidths;

    XLSX.writeFile(workbook, `${filename}-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className="relative group">
      <Button variant="outline" className="gap-2">
        <Download className="w-4 h-4" />
        Export
      </Button>
      <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-30">
        <button
          onClick={exportToCSV}
          className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
        >
          Export CSV
        </button>
        <button
          onClick={exportToExcel}
          className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
        >
          Export Excel
        </button>
      </div>
    </div>
  );
}
