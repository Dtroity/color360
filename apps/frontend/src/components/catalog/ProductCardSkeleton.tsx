import { Skeleton } from '../ui/Skeleton';

interface ProductCardSkeletonProps {
  view?: 'grid' | 'list';
}

export function ProductCardSkeleton({ view = 'grid' }: ProductCardSkeletonProps) {
  if (view === 'list') {
    return (
      <div className="flex gap-4 rounded-lg border border-neutral-200 bg-white p-4">
        <Skeleton className="h-32 w-32 shrink-0 rounded-lg" />
        <div className="flex flex-1 flex-col gap-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="mt-auto flex items-center justify-between">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <Skeleton className="aspect-square w-full" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-20" />
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>
    </div>
  );
}

export default ProductCardSkeleton;
