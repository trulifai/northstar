/**
 * Bills Search Page
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { billsApi } from '@/lib/api';

export const dynamic = 'force-dynamic';

interface SearchParams {
  searchParams: Promise<{
    congress?: string;
    query?: string;
    page?: string;
  }>;
}

async function getBills(congress?: number, query?: string, page: number = 1) {
  try {
    const limit = 20;
    const offset = (page - 1) * limit;
    const response = await billsApi.search({
      congress: congress || 118,
      query,
      limit,
      offset,
    });
    return response;
  } catch (error) {
    console.error('Error fetching bills:', error);
    return { success: false, data: [], pagination: { total: 0, offset: 0, limit: 20, hasMore: false } };
  }
}

function BillSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <Skeleton className="h-6 w-24 mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-4" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

async function BillsList({ congress, query, page }: { congress?: number; query?: string; page: number }) {
  const response = await getBills(congress, query, page);
  const bills = response.data;

  if (!bills || bills.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-600">No bills found. Try adjusting your search.</p>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 mb-6">
        {bills.map((bill, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3">
                <Link 
                  href={`/bills/${bill.congress}/${bill.type}/${bill.number}`}
                  className="text-lg font-bold text-blue-600 hover:text-blue-800"
                >
                  {bill.type.toUpperCase()}.{bill.number}
                </Link>
                <div className="flex gap-2">
                  <Badge variant="outline">{bill.congress}th Congress</Badge>
                  {bill.originChamber && (
                    <Badge>{bill.originChamber}</Badge>
                  )}
                </div>
              </div>
              
              <h3 className="text-base font-medium mb-2 line-clamp-2">
                {bill.title}
              </h3>
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Latest: {new Date(bill.latestAction.actionDate).toLocaleDateString()}</span>
                {bill.introducedDate && (
                  <span>Introduced: {new Date(bill.introducedDate).toLocaleDateString()}</span>
                )}
              </div>
              
              <p className="text-sm text-gray-500 mt-2 line-clamp-1">
                {bill.latestAction.text}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {response.pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {response.pagination.offset + 1} - {Math.min(response.pagination.offset + response.pagination.limit, response.pagination.total)} of {response.pagination.total.toLocaleString()}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/bills?congress=${congress || 118}&page=${page - 1}${query ? `&query=${query}` : ''}`}>
                <Button variant="outline">Previous</Button>
              </Link>
            )}
            {response.pagination.hasMore && (
              <Link href={`/bills?congress=${congress || 118}&page=${page + 1}${query ? `&query=${query}` : ''}`}>
                <Button variant="outline">Next</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default async function BillsPage(props: SearchParams) {
  const searchParams = await props.searchParams;
  const congress = searchParams.congress ? parseInt(searchParams.congress) : 118;
  const query = searchParams.query;
  const page = searchParams.page ? parseInt(searchParams.page) : 1;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Congressional Bills</h1>
        <p className="text-gray-600">
          Search and explore legislation from the U.S. Congress
        </p>
      </div>

      {/* Search & Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Search Bills</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="GET" className="flex gap-4">
            <Input
              name="query"
              placeholder="Search by keyword..."
              defaultValue={query}
              className="flex-1"
            />
            <select
              name="congress"
              defaultValue={congress}
              className="px-4 py-2 border rounded-md bg-white"
            >
              <option value="118">118th Congress (2023-2025)</option>
              <option value="117">117th Congress (2021-2023)</option>
              <option value="116">116th Congress (2019-2021)</option>
            </select>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      <Suspense fallback={
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <BillSkeleton key={i} />)}
        </div>
      }>
        <BillsList congress={congress} query={query} page={page} />
      </Suspense>
    </div>
  );
}
