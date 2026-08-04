import { SuccessPageClient, type SuccessSearchParams } from "./SuccessPageClient";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<SuccessSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  return <SuccessPageClient searchParams={resolvedSearchParams} />;
}