"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthError, authFetch } from "@/lib/auth";
import type { Paginated } from "@/lib/types";

/** Must match DRF PAGE_SIZE in backend settings. */
export const PAGE_SIZE = 50;

/**
 * Fetches a paginated, searchable list. The page owns its own filter params
 * (passed as `filterQuery`, e.g. "status=open"); page number and debounced
 * search are managed here. Returns to page 1 whenever filters or search change.
 */
export function usePaginatedList<T>(basePath: string, filterQuery = "") {
  const router = useRouter();
  const [data, setData] = useState<Paginated<T> | null>(null);
  const [failed, setFailed] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const firstRun = useRef(true);

  // Debounce the search box
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handle);
  }, [search]);

  // Reset to page 1 when filters or search change (but not on first mount)
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setPage(1);
  }, [filterQuery, debouncedSearch]);

  const load = useCallback(async () => {
    setFailed(false);
    const params = new URLSearchParams(filterQuery);
    params.set("page", String(page));
    if (debouncedSearch) params.set("search", debouncedSearch);
    try {
      const response = await authFetch(`${basePath}?${params}`);
      setData(await response.json());
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/login");
        return;
      }
      setFailed(true);
    }
  }, [basePath, filterQuery, page, debouncedSearch, router]);

  useEffect(() => {
    load();
  }, [load]);

  const count = data?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return {
    items: data?.results ?? null,
    count,
    failed,
    page,
    setPage,
    pageCount,
    search,
    setSearch,
    reload: load,
  };
}
