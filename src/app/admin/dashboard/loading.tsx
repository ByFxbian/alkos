import Skeleton from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="container mx-auto py-12 px-4">
      <Skeleton className="h-10 w-48 mb-8" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>

      <div className="mb-12">
         <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>

      <Skeleton className="h-8 w-64 mb-4" />

      <div className="hidden md:block rounded-lg overflow-hidden border border-neutral-800">
        <div className="bg-neutral-900 p-4 border-b border-neutral-800 flex gap-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-6 w-1/3" />
        </div>
        <div className="p-4 space-y-4 bg-neutral-950">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
      </div>

      <div className="md:hidden space-y-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  );
}