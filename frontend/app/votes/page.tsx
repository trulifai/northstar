/**
 * Votes Page
 */

import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { votesApi } from '@/lib/api';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface SearchParams {
  searchParams: Promise<{
    congress?: string;
    chamber?: string;
    page?: string;
  }>;
}

async function getVotes(congress?: number, chamber?: string, page: number = 1) {
  try {
    const limit = 20;
    const offset = (page - 1) * limit;
    const response = await votesApi.search({
      congress: congress || 118,
      chamber,
      limit,
      offset,
    });
    return response;
  } catch (error) {
    console.error('Error fetching votes:', error);
    return { success: false, data: [], pagination: { total: 0, offset: 0, limit: 20, hasMore: false } };
  }
}

function VoteSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-full mb-4" />
        <Skeleton className="h-16 w-full" />
      </CardContent>
    </Card>
  );
}

async function VotesList({ congress, chamber, page }: { congress?: number; chamber?: string; page: number }) {
  const response = await getVotes(congress, chamber, page);
  const votes = response.data;

  if (!votes || votes.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-600">No votes found.</p>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 mb-6">
        {votes.map((vote, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold">
                    {vote.chamber === 'house' ? 'House' : 'Senate'} Roll Call #{vote.rollNumber}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {new Date(vote.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <Badge variant={vote.result.toLowerCase().includes('pass') || vote.result.toLowerCase().includes('agree') ? 'default' : 'secondary'}>
                  {vote.result}
                </Badge>
              </div>

              <p className="text-base mb-4">{vote.question}</p>

              {vote.votes && (
                <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{vote.votes.yea}</div>
                    <div className="text-xs text-gray-600">Yea</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{vote.votes.nay}</div>
                    <div className="text-xs text-gray-600">Nay</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{vote.votes.present}</div>
                    <div className="text-xs text-gray-600">Present</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-400">{vote.votes.notVoting}</div>
                    <div className="text-xs text-gray-600">Not Voting</div>
                  </div>
                </div>
              )}
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
              <Link href={`/votes?congress=${congress || 118}&${chamber ? `chamber=${chamber}&` : ''}page=${page - 1}`}>
                <Button variant="outline">Previous</Button>
              </Link>
            )}
            {response.pagination.hasMore && (
              <Link href={`/votes?congress=${congress || 118}&${chamber ? `chamber=${chamber}&` : ''}page=${page + 1}`}>
                <Button variant="outline">Next</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default async function VotesPage(props: SearchParams) {
  const searchParams = await props.searchParams;
  const congress = searchParams.congress ? parseInt(searchParams.congress) : 118;
  const chamber = searchParams.chamber;
  const page = searchParams.page ? parseInt(searchParams.page) : 1;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Congressional Votes</h1>
        <p className="text-gray-600">
          Browse roll-call votes from the U.S. House and Senate
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filter Votes</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="GET" className="flex gap-4">
            <select
              name="congress"
              defaultValue={congress}
              className="px-4 py-2 border rounded-md bg-white"
            >
              <option value="118">118th Congress (2023-2025)</option>
              <option value="117">117th Congress (2021-2023)</option>
              <option value="116">116th Congress (2019-2021)</option>
            </select>

            <select
              name="chamber"
              defaultValue={chamber || ''}
              className="px-4 py-2 border rounded-md bg-white"
            >
              <option value="">Both Chambers</option>
              <option value="house">House</option>
              <option value="senate">Senate</option>
            </select>

            <Button type="submit">Apply Filters</Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      <Suspense fallback={
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <VoteSkeleton key={i} />)}
        </div>
      }>
        <VotesList congress={congress} chamber={chamber} page={page} />
      </Suspense>
    </div>
  );
}
