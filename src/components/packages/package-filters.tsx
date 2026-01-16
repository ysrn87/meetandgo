"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button, Input, Select } from "@/components/ui";

interface PackageFiltersProps {
  currentType?: string;
  currentSort?: string;
  currentSearch?: string;
  currentLocation?: string;
  currentMinPrice?: string;
  currentMaxPrice?: string;
  locations: string[];
}

export function PackageFilters({
  currentType,
  currentSort,
  currentSearch,
  currentLocation,
  currentMinPrice,
  currentMaxPrice,
  locations,
}: PackageFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [search, setSearch] = useState(currentSearch || "");

  const updateParams = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/packages?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams("search", search || undefined);
  };

  const clearAllFilters = () => {
    router.push("/packages");
    setSearch("");
  };

  const hasActiveFilters = currentSearch || currentType || currentLocation || currentMinPrice || currentMaxPrice;

  return (
    <div className="mb-8 space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search packages by name, location..."
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {/* Trip Type Tabs */}
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => updateParams("type", undefined)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            !currentType ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All Packages
        </button>
        <button
          onClick={() => updateParams("type", "open")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            currentType === "open" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Open Trip
        </button>
        <button
          onClick={() => updateParams("type", "private")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            currentType === "private" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Private Trip
        </button>
        
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            showAdvanced ? "bg-slate-200 text-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 max-w-3xl mx-auto">
          <div className="grid md:grid-cols-4 gap-4">
            <Select
              label="Location"
              value={currentLocation || ""}
              onChange={(e) => updateParams("location", e.target.value || undefined)}
              options={[
                { value: "", label: "All Locations" },
                ...locations.map((loc) => ({ value: loc, label: loc })),
              ]}
            />
            <Select
              label="Sort By"
              value={currentSort || ""}
              onChange={(e) => updateParams("sort", e.target.value || undefined)}
              options={[
                { value: "", label: "Default" },
                { value: "newest", label: "Newest First" },
                { value: "oldest", label: "Oldest First" },
                { value: "title-asc", label: "Name A-Z" },
                { value: "title-desc", label: "Name Z-A" },
                { value: "price-asc", label: "Price Low-High" },
                { value: "price-desc", label: "Price High-Low" },
              ]}
            />
            <Input
              label="Min Price"
              type="number"
              placeholder="0"
              value={currentMinPrice || ""}
              onChange={(e) => updateParams("minPrice", e.target.value || undefined)}
            />
            <Input
              label="Max Price"
              type="number"
              placeholder="10000000"
              value={currentMaxPrice || ""}
              onChange={(e) => updateParams("maxPrice", e.target.value || undefined)}
            />
          </div>
        </div>
      )}

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 justify-center flex-wrap">
          <span className="text-sm text-slate-500">Active filters:</span>
          {currentSearch && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
              Search: {currentSearch}
              <button onClick={() => { setSearch(""); updateParams("search", undefined); }} className="hover:text-emerald-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {currentType && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
              Type: {currentType === "open" ? "Open Trip" : "Private Trip"}
              <button onClick={() => updateParams("type", undefined)} className="hover:text-emerald-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {currentLocation && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
              Location: {currentLocation}
              <button onClick={() => updateParams("location", undefined)} className="hover:text-emerald-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {(currentMinPrice || currentMaxPrice) && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
              Price: {currentMinPrice || "0"} - {currentMaxPrice || "∞"}
              <button onClick={() => { updateParams("minPrice", undefined); updateParams("maxPrice", undefined); }} className="hover:text-emerald-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button onClick={clearAllFilters} className="text-sm text-red-500 hover:underline">
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
