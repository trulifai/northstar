/**
 * Main Navigation Component
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Navigation() {
  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-blue-600">🇺🇸 Northstar</div>
          </Link>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/bills" className="text-sm font-medium hover:text-blue-600 transition-colors">
              Bills
            </Link>
            <Link href="/members" className="text-sm font-medium hover:text-blue-600 transition-colors">
              Members
            </Link>
            <Link href="/committees" className="text-sm font-medium hover:text-blue-600 transition-colors">
              Committees
            </Link>
            <Link href="/votes" className="text-sm font-medium hover:text-blue-600 transition-colors">
              Votes
            </Link>
          </div>
          
          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
