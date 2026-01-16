"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Select, Input } from "@/components/ui";

interface AdminRequestFiltersProps {
  currentSearch?: string;
  currentStatus?: string;
  currentSort?: string;
  currentFrom?: string;
  currentTo?: string;
}

export function AdminRequestFilters({
  currentSearch,
  currentStatus,
  currentSort,
  currentFrom,
  currentTo,
}: AdminRequestFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentSearch || "");

  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(`/admin/custom-requests?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ search: search || undefined });
  };

  const clearFilters = () => {
    router.push("/admin/custom-requests");
    setSearch("");
  };

  const hasFilters = currentSearch || currentStatus || currentSort || currentFrom || currentTo;

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
      <div className="flex flex-wrap gap-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code, destination, name..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none text-sm"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
            Search
          </button>
        </form>

        <Select
          value={currentStatus || ""}
          onChange={(e) => updateParams({ status: e.target.value || undefined })}
          options={[
            { value: "", label: "All Status" },
            { value: "PENDING", label: "Pending" },
            { value: "IN_REVIEW", label: "In Review" },
            { value: "ACCEPTED", label: "Accepted" },
            { value: "PAID", label: "Paid" },
            { value: "PROCESSED", label: "Processed" },
            { value: "ONGOING", label: "Ongoing" },
            { value: "COMPLETED", label: "Completed" },
            { value: "REJECTED", label: "Rejected" },
          ]}
          className="w-36"
        />

        <Select
          value={currentSort || ""}
          onChange={(e) => updateParams({ sort: e.target.value || undefined })}
          options={[
            { value: "", label: "Newest First" },
            { value: "oldest", label: "Oldest First" },
            { value: "departure", label: "Departure Date" },
          ]}
          className="w-40"
        />
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <Input
          label="From Date"
          type="date"
          value={currentFrom || ""}
          onChange={(e) => updateParams({ from: e.target.value || undefined })}
          className="w-40"
        />
        <Input
          label="To Date"
          type="date"
          value={currentTo || ""}
          onChange={(e) => updateParams({ to: e.target.value || undefined })}
          className="w-40"
        />
      </div>

      {hasFilters && (
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="text-slate-500">Active filters:</span>
          {currentSearch && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded">
              Search: {currentSearch}
              <button onClick={() => { setSearch(""); updateParams({ search: undefined }); }}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {currentStatus && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded">
              Status: {currentStatus}
              <button onClick={() => updateParams({ status: undefined })}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {(currentFrom || currentTo) && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded">
              Date: {currentFrom || "..."} - {currentTo || "..."}
              <button onClick={() => updateParams({ from: undefined, to: undefined })}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button onClick={clearFilters} className="text-red-500 hover:underline">Clear all</button>
        </div>
      )}
    </div>
  );
}
