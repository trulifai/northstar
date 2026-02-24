/**
 * Members Directory Page
 */

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { membersApi } from '@/lib/api';

export const dynamic = 'force-dynamic';

interface SearchParams {
  searchParams: Promise<{
    state?: string;
    party?: string;
    chamber?: string;
    page?: string;
  }>;
}

async function getMembers(state?: string, party?: string, chamber?: string, page: number = 1) {
  try {
    const limit = 24;
    const offset = (page - 1) * limit;
    const response = await membersApi.search({
      state,
      party,
      chamber,
      limit,
      offset,
    });
    return response;
  } catch (error) {
    console.error('Error fetching members:', error);
    return { success: false, data: [], pagination: { total: 0, offset: 0, limit: 24, hasMore: false } };
  }
}

function MemberSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6 text-center">
        <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
        <Skeleton className="h-6 w-32 mx-auto mb-2" />
        <Skeleton className="h-4 w-24 mx-auto" />
      </CardContent>
    </Card>
  );
}

function getPartyColor(party: string) {
  switch (party) {
    case 'Democratic':
    case 'D':
      return 'bg-blue-500';
    case 'Republican':
    case 'R':
      return 'bg-red-500';
    default:
      return 'bg-purple-500';
  }
}

function getPartyVariant(party: string): "default" | "secondary" | "destructive" | "outline" {
  switch (party) {
    case 'Democratic':
    case 'D':
      return 'default';
    case 'Republican':
    case 'R':
      return 'destructive';
    default:
      return 'secondary';
  }
}

async function MembersList({ state, party, chamber, page }: { state?: string; party?: string; chamber?: string; page: number }) {
  const response = await getMembers(state, party, chamber, page);
  const members = response.data;

  if (!members || members.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-600">No members found. Try adjusting your filters.</p>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
        {members.map((member, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 text-center">
              {/* Member Photo */}
              <div className="mb-4">
                {member.depiction?.imageUrl ? (
                  <Image
                    src={member.depiction.imageUrl}
                    alt={member.name}
                    width={96}
                    height={96}
                    className="rounded-full mx-auto"
                    unoptimized
                  />
                ) : (
                  <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold ${getPartyColor(member.partyName)}`}>
                    {member.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Member Info */}
              <Link
                href={`/members/${member.bioguideId}`}
                className="text-lg font-bold hover:text-blue-600 block mb-2"
              >
                {member.name}
              </Link>

              <div className="space-y-2">
                <Badge variant={getPartyVariant(member.partyName)}>
                  {member.partyName}
                </Badge>
                
                <p className="text-sm text-gray-600">
                  {member.state}
                  {member.district !== undefined && member.district !== null && ` - District ${member.district}`}
                </p>
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
              <Link href={`/members?${new URLSearchParams({ ...(state && { state }), ...(party && { party }), ...(chamber && { chamber }), page: (page - 1).toString() }).toString()}`}>
                <Button variant="outline">Previous</Button>
              </Link>
            )}
            {response.pagination.hasMore && (
              <Link href={`/members?${new URLSearchParams({ ...(state && { state }), ...(party && { party }), ...(chamber && { chamber }), page: (page + 1).toString() }).toString()}`}>
                <Button variant="outline">Next</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default async function MembersPage(props: SearchParams) {
  const searchParams = await props.searchParams;
  const state = searchParams.state;
  const party = searchParams.party;
  const chamber = searchParams.chamber;
  const page = searchParams.page ? parseInt(searchParams.page) : 1;

  // US States for filter
  const states = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Members of Congress</h1>
        <p className="text-gray-600">
          Browse all 535 members of the U.S. House and Senate
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filter Members</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="GET" className="flex flex-wrap gap-4">
            <select
              name="chamber"
              defaultValue={chamber || ''}
              className="px-4 py-2 border rounded-md bg-white"
            >
              <option value="">All Chambers</option>
              <option value="house">House</option>
              <option value="senate">Senate</option>
            </select>

            <select
              name="party"
              defaultValue={party || ''}
              className="px-4 py-2 border rounded-md bg-white"
            >
              <option value="">All Parties</option>
              <option value="D">Democratic</option>
              <option value="R">Republican</option>
              <option value="I">Independent</option>
            </select>

            <select
              name="state"
              defaultValue={state || ''}
              className="px-4 py-2 border rounded-md bg-white"
            >
              <option value="">All States</option>
              {states.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <Button type="submit">Apply Filters</Button>
            {(state || party || chamber) && (
              <Link href="/members">
                <Button type="button" variant="outline">Clear</Button>
              </Link>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      <Suspense fallback={
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => <MemberSkeleton key={i} />)}
        </div>
      }>
        <MembersList state={state} party={party} chamber={chamber} page={page} />
      </Suspense>
    </div>
  );
}
