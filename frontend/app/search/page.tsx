import { SearchPageClient } from "@/components/SearchPageClient";

type SearchParams = {
  from?: string | string[];
  to?: string | string[];
  date?: string | string[];
};

function pickFirst(value: string | string[] | undefined, fallback: string) {
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const resolvedSearchParams = await searchParams;
  const from = pickFirst(resolvedSearchParams.from, "Colombo Fort");
  const to = pickFirst(resolvedSearchParams.to, "Kandy");
  const date = pickFirst(resolvedSearchParams.date, new Date().toISOString().slice(0, 10));

  return <SearchPageClient initialFrom={from} initialTo={to} initialDate={date} />;
}