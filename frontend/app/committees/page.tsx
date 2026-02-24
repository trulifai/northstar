/**
 * Committees Page
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { committeesApi } from '@/lib/api';

export const dynamic = 'force-dynamic';

interface SearchParams {
  searchParams: Promise<{
    chamber?: string;
    page?: string;
  }>;
}

async function getCommittees(chamber?: string, page: number = 1) {
  try {
    const limit = 20;
    const offset = (page - 1) * limit;
    const response = await committeesApi.search({
      chamber,
      limit,
      offset,
    });
    return response;
  } catch (error) {
    console.error('Error fetching committees:', error);
    return { success: false, data: [], pagination: { total: 0, offset: 0, limit: 20, hasMore: false } };
  }
}

function CommitteeSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </CardContent>
    </Card>
  );
}

async function CommitteesList({ chamber, page }: { chamber?: string; page: number }) {
  const response = await getCommittees(chamber, page);
  const committees = response.data;

  if (!committees || committees.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-600">No committees found.</p>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {committees.map((committee, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-bold">{committee.name}</h3>
                <Badge variant="outline">
                  {committee.chamber === 'House' ? 'House' : committee.chamber === 'Senate' ? 'Senate' : 'Joint'}
                </Badge>
              </div>
              
              {committee.committeeType && (
                <Badge variant="secondary" className="mb-2">
                  {committee.committeeType}
                </Badge>
              )}

              <div className="flex items-center gap-2 mt-4">
                <Link href={committee.url} target="_blank" className="text-sm text-blue-600 hover:underline">
                  View on Congress.gov →
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {response.pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {response.pagination.offset + 1} - {Math.min(response.pagination.offset + response.pagination.limit, response.pagination.total)} of {response.pagination.total}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/committees?${chamber ? `chamber=${chamber}&` : ''}page=${page - 1}`}>
                <Button variant="outline">Previous</Button>
              </Link>
            )}
            {response.pagination.hasMore && (
              <Link href={`/committees?${chamber ? `chamber=${chamber}&` : ''}page=${page + 1}`}>
                <Button variant="outline">Next</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default async function CommitteesPage(props: SearchParams) {
  const searchParams = await props.searchParams;
  const chamber = searchParams.chamber;
  const page = searchParams.page ? parseInt(searchParams.page) : 1;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Congressional Committees</h1>
        <p className="text-gray-600">
          Browse all committees and subcommittees
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filter Committees</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="GET" className="flex gap-4">
            <select
              name="chamber"
              defaultValue={chamber || ''}
              className="px-4 py-2 border rounded-md bg-white"
            >
              <option value="">All Chambers</option>
              <option value="house">House</option>
              <option value="senate">Senate</option>
            </select>

            <Button type="submit">Apply Filters</Button>
            {chamber && (
              <Link href="/committees">
                <Button type="button" variant="outline">Clear</Button>
              </Link>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      <Suspense fallback={
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => <CommitteeSkeleton key={i} />)}
        </div>
      }>
        <CommitteesList chamber={chamber} page={page} />
      </Suspense>
    </div>
  );
}
