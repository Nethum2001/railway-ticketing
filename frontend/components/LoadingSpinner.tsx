export function LoadingSpinner() {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-600">
      <span className="size-4 animate-spin rounded-full border-2 border-slate-300 border-t-orange-500" />
      Loading reservation view...
    </div>
  );
}