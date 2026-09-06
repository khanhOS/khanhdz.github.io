import { db } from '@/lib/db'
import { getUserQuota, consumeQuota, setUserPlan, resetUserQuota, adjustUserUsage } from '@/lib/quota'

// Re-export from quota for convenience
export {
  getUserQuota,
  consumeQuota,
  setUserPlan,
  resetUserQuota,
  adjustUserUsage,
}
