# 🚀 Next Session: Continue Database Integration

## Current Status: ✅ Database Foundation Complete

**What's working:**
- PostgreSQL + Prisma setup ✅
- 220 members synced ✅
- Members API using database cache (<20ms responses) ✅
- Caching layer operational ✅

## What to Build Next (Priority Order)

### 1. Update Bills Route to Use Database (2 hours)

**File:** `backend/src/routes/bills.route.ts`

**Current:** Calls Congress.gov API directly
**Goal:** Use database service like members route

**Steps:**
```typescript
// 1. Import database service
import { dbService } from '../services/db.service';

// 2. Update GET /api/bills endpoint
router.get('/', async (req, res) => {
  const result = await dbService.getBills({
    congress: parseInt(req.query.congress as string) || 118,
    query: req.query.query as string,
    offset: parseInt(req.query.offset as string) || 0,
    limit: parseInt(req.query.limit as string) || 20,
  });
  
  res.json({
    success: true,
    data: result.data,
    pagination: { total: result.total, ... },
    meta: { cached: result.cached }
  });
});
```

**Test:**
```bash
curl "http://localhost:3000/api/bills?congress=118&limit=5"
# Should return: cached: true (once bills are synced)
```

---

### 2. Update Votes Route to Use Database (2 hours)

**File:** `backend/src/routes/votes.route.ts`

**Steps:**
```typescript
// 1. Import database service
import { dbService } from '../services/db.service';

// 2. Update GET /api/votes endpoint
router.get('/', async (req, res) => {
  const result = await dbService.getVotes({
    congress: parseInt(req.query.congress as string) || 118,
    chamber: req.query.chamber as string,
    offset: parseInt(req.query.offset as string) || 0,
    limit: parseInt(req.query.limit as string) || 20,
  });
  
  res.json({
    success: true,
    data: result.data,
    pagination: { total: result.total, ... },
    meta: { cached: result.cached }
  });
});
```

---

### 3. Get Real API Key & Full Sync (1 hour)

**Problem:** DEMO_KEY is rate-limited (5 req/sec)
**Solution:** Get real key for full sync

**Steps:**
1. Go to: https://api.congress.gov/sign-up/
2. Request API key (instant approval)
3. Update `.env`:
   ```bash
   CONGRESS_GOV_API_KEY=<your-real-key-here>
   ```
4. Run full sync:
   ```bash
   npx tsx backend/src/services/sync.service.ts
   ```

**Expected Results:**
- Bills synced: ~15,000 (118th Congress)
- Votes synced: ~1,000 (House + Senate)
- Time: ~30 minutes

---

### 4. Add Background Sync Scheduler (2 hours)

**Goal:** Auto-refresh data every 24 hours

**Create:** `backend/src/services/scheduler.service.ts`

```typescript
import cron from 'node-cron';
import { syncService } from './sync.service';

export class SchedulerService {
  start() {
    // Run every day at 3 AM
    cron.schedule('0 3 * * *', async () => {
      console.log('[Scheduler] Starting daily sync...');
      await syncService.runInitialSync();
      console.log('[Scheduler] Daily sync complete!');
    });
  }
}

export const scheduler = new SchedulerService();
```

**Start in server.ts:**
```typescript
import { scheduler } from './services/scheduler.service';

// After app.listen()
scheduler.start();
console.log('✓ Background sync scheduler started');
```

---

### 5. Build Admin Dashboard (4 hours)

**Goal:** Manually trigger syncs + view status

**Create:** `frontend/app/admin/sync/page.tsx`

**Features:**
- Button to trigger member sync
- Button to trigger bill sync
- Button to trigger vote sync
- Display sync status (last run, record counts)
- Show progress bars during sync

**Backend API:**
```typescript
// POST /api/admin/sync
router.post('/sync', async (req, res) => {
  const { type } = req.body; // 'members' | 'bills' | 'votes'
  
  const count = await syncService.syncMembers(1000);
  
  res.json({
    success: true,
    synced: count,
    timestamp: new Date()
  });
});

// GET /api/admin/status
router.get('/status', async (req, res) => {
  const memberCount = await prisma.member.count();
  const billCount = await prisma.bill.count();
  const voteCount = await prisma.vote.count();
  
  res.json({
    members: memberCount,
    bills: billCount,
    votes: voteCount,
    lastSync: ... // from database
  });
});
```

---

## Quick Start Commands

### Start Development Server
```bash
cd /Users/banvithchowdaryravi/northstar
npm run dev
```

### Test Current API
```bash
# Test members (working!)
curl "http://localhost:3000/api/members?limit=3"

# Test bills (not cached yet)
curl "http://localhost:3000/api/bills?congress=118&limit=3"

# Test votes (not cached yet)
curl "http://localhost:3000/api/votes?congress=118&chamber=house&limit=3"
```

### Run Sync Manually
```bash
npx tsx backend/src/services/sync.service.ts
```

### Open Database GUI
```bash
npx prisma studio
# Opens at http://localhost:5555
```

---

## File Reference

### Key Files to Edit
```
backend/src/routes/bills.route.ts        - Update to use dbService
backend/src/routes/votes.route.ts        - Update to use dbService
backend/src/services/scheduler.service.ts- Create (background sync)
frontend/app/admin/sync/page.tsx         - Create (admin dashboard)
.env                                     - Update API key
```

### Reference Implementations
```
backend/src/routes/members.route.ts      - Working example of DB caching
backend/src/services/db.service.ts       - Database service methods
backend/src/services/sync.service.ts     - Sync implementation
```

---

## Expected Timeline

| Task | Time | Cumulative |
|------|------|------------|
| Update bills route | 2h | 2h |
| Update votes route | 2h | 4h |
| Get API key + full sync | 1h | 5h |
| Background scheduler | 2h | 7h |
| Admin dashboard | 4h | 11h |

**Total:** ~1.5 days of work

---

## Testing Checklist

After each task, verify:

- [ ] Bills API returns `cached: true`
- [ ] Votes API returns `cached: true`
- [ ] Response times <20ms
- [ ] Filtering/pagination working
- [ ] Full dataset synced (bills + votes)
- [ ] Background sync runs automatically
- [ ] Admin dashboard shows accurate counts
- [ ] Can manually trigger syncs

---

## Questions?

Check these docs:
- `DATABASE_COMPLETE.md` - Complete setup guide
- `DATABASE_STATUS.md` - Current status
- `README.md` - Project overview

Or search codebase:
```bash
# Find all database service usage
grep -r "dbService" backend/src/routes/

# Find all sync service calls
grep -r "syncService" backend/src/
```

---

**Status:** Ready to continue! 🚀

**Next Action:** Update `bills.route.ts` to use database caching

**Command to Start:**
```bash
cd /Users/banvithchowdaryravi/northstar
code backend/src/routes/bills.route.ts
# Reference: backend/src/routes/members.route.ts
```
