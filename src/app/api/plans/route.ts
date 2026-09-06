import { PLANS, formatTokens } from '@/lib/plans'
import { ok, withErrors } from '@/lib/api-response'

export const GET = withErrors(async () => {
  return ok({
    plans: PLANS.map((p) => ({
      id: p.id, name: p.name,
      tokenLimit: p.tokenLimit, tokenLimitLabel: formatTokens(p.tokenLimit),
      priceVnd: p.priceVnd, priceLabel: p.priceLabel,
      description: p.description, features: p.features, highlight: p.highlight,
    })),
  })
})
