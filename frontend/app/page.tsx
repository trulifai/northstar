/**
 * Homepage / Dashboard
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { billsApi, votesApi, statsApi } from '@/lib/api';

export const dynamic = 'force-dynamic';

async function getStats() {
  try {
    const response = await statsApi.get();
    return response.data || null;
  } catch (error) {
    console.error('Error fetching stats:', error);
    return null;
  }
}

async function getRecentBills() {
  try {
    const response = await billsApi.search({ congress: 118, limit: 5 });
    return response.data || [];
  } catch (error) {
    console.error('Error fetching bills:', error);
    return [];
  }
}

async function getRecentVotes() {
  try {
    const response = await votesApi.search({ congress: 118, limit: 3 });
    return response.data || [];
  } catch (error) {
    console.error('Error fetching votes:', error);
    return [];
  }
}

function formatCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k+`;
  }
  return count.toLocaleString();
}

export default async function Home() {
  const [stats, recentBills, recentVotes] = await Promise.all([
    getStats(),
    getRecentBills(),
    getRecentVotes(),
  ]);

  const billCount = stats?.counts.bills ?? 0;
  const memberCount = stats?.counts.members ?? 0;
  const committeeCount = stats?.counts.committees ?? 0;
  const voteCount = stats?.counts.votes ?? 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Congressional Intelligence Platform
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Complete congressional data with AI-powered insights
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/bills">
            <Button size="lg">Explore Bills</Button>
          </Link>
          <Link href="/members">
            <Button variant="outline" size="lg">View Members</Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>118th Congress</CardDescription>
            <CardTitle className="text-3xl">{billCount > 0 ? formatCount(billCount) : '--'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Bills Tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Members</CardDescription>
            <CardTitle className="text-3xl">{memberCount > 0 ? memberCount.toLocaleString() : '--'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">House + Senate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Committees</CardDescription>
            <CardTitle className="text-3xl">{committeeCount > 0 ? committeeCount.toLocaleString() : '--'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Standing & Select</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Roll-Call Votes</CardDescription>
            <CardTitle className="text-3xl">{voteCount > 0 ? formatCount(voteCount) : '--'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">This Congress</p>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Recent Bills */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Bills</CardTitle>
              <Link href="/bills">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
            <CardDescription>Latest legislation from the 118th Congress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBills.length === 0 && (
                <p className="text-sm text-gray-500">No bills synced yet. Run a data sync to populate.</p>
              )}
              {recentBills.map((bill, index) => (
                <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <Link
                      href={`/bills/${bill.congress}/${bill.type}/${bill.number}`}
                      className="font-medium hover:text-blue-600 transition-colors"
                    >
                      {bill.type?.toUpperCase() || 'BILL'}.{bill.number}
                    </Link>
                    <Badge variant="outline">{bill.originChamber || 'Congress'}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{bill.title}</p>
                  {bill.latestAction?.actionDate && (
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(bill.latestAction.actionDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Votes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Votes</CardTitle>
              <Link href="/votes">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
            <CardDescription>Latest roll-call votes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentVotes.length === 0 && (
                <p className="text-sm text-gray-500">No votes synced yet. Run a data sync to populate.</p>
              )}
              {recentVotes.map((vote, index) => (
                <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-medium">
                      {vote.chamber === 'house' ? 'House' : 'Senate'} Roll #{vote.rollNumber}
                    </span>
                    <Badge variant={vote.result?.toLowerCase().includes('pass') ? 'default' : 'secondary'}>
                      {vote.result || 'Unknown'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{vote.question}</p>
                  {vote.votes && (
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>Yea: {vote.votes.yea}</span>
                      <span>Nay: {vote.votes.nay}</span>
                      <span>Present: {vote.votes.present}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Section */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-center mb-8">Platform Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Complete Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Access all bills, votes, members, and committees with live data from Congress.gov
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI-Powered</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                AI-generated bill summaries, natural language search, and intelligent insights
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Voting patterns, lobbying data, campaign finance, and district-level impact analysis
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
