import { SearchPageClient } from "@/components/SearchPageClient";

type SearchParams = {
  from?: string | string[];
  to?: string | string[];
  date?: string | string[];
  class?: string | string[];
};

function pickFirst(value: string | string[] | undefined, fallback: string) {
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}

export default function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const from = pickFirst(searchParams.from, "Colombo Fort");
  const to = pickFirst(searchParams.to, "Kandy");
  const date = pickFirst(searchParams.date, new Date().toISOString().slice(0, 10));
  const travelClass = pickFirst(searchParams.class, "SECOND_CLASS");

  return <SearchPageClient initialFrom={from} initialTo={to} initialDate={date} initialClass={travelClass} />;
}