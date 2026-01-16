"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Select } from "@/components/ui";

interface AdminPackageFiltersProps {
  currentSearch?: string;
  currentType?: string;
  currentStatus?: string;
  currentSort?: string;
}

export function AdminPackageFilters({
  currentSearch,
  currentType,
  currentStatus,
  currentSort,
}: AdminPackageFiltersProps) {
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
    router.push(`/admin/packages?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ search: search || undefined });
  };

  const clearFilters = () => {
    router.push("/admin/packages");
    setSearch("");
  };

  const hasFilters = currentSearch || currentType || currentStatus || currentSort;

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
      <div className="flex flex-wrap gap-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search packages..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
            Search
          </button>
        </form>

        <Select
          value={currentType || ""}
          onChange={(e) => updateParams({ type: e.target.value || undefined })}
          options={[
            { value: "", label: "All Types" },
            { value: "open", label: "Open Trip" },
            { value: "private", label: "Private Trip" },
          ]}
          className="w-36"
        />

        <Select
          value={currentStatus || ""}
          onChange={(e) => updateParams({ status: e.target.value || undefined })}
          options={[
            { value: "", label: "All Status" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
          className="w-36"
        />

        <Select
          value={currentSort || ""}
          onChange={(e) => updateParams({ sort: e.target.value || undefined })}
          options={[
            { value: "", label: "Newest First" },
            { value: "oldest", label: "Oldest First" },
            { value: "title-asc", label: "Name A-Z" },
            { value: "title-desc", label: "Name Z-A" },
          ]}
          className="w-36"
        />
      </div>

      {hasFilters && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Active filters:</span>
          {currentSearch && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded">
              Search: {currentSearch}
              <button onClick={() => { setSearch(""); updateParams({ search: undefined }); }}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {currentType && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded">
              {currentType === "open" ? "Open Trip" : "Private Trip"}
              <button onClick={() => updateParams({ type: undefined })}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {currentStatus && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded">
              {currentStatus === "active" ? "Active" : "Inactive"}
              <button onClick={() => updateParams({ status: undefined })}>
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
