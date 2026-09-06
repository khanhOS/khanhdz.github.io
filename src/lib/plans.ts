// KhanhOS AI — Plan definitions (server-side source of truth)
export type Plan = 'FREE' | 'PLUS' | 'MAX'
export type Role = 'USER' | 'ADMIN' | 'OWNER'

export const PLAN_TOKEN_LIMITS: Record<Plan, number> = {
  FREE: 20000, PLUS: 80000, MAX: 200000,
}
export const PLAN_PRICES: Record<Plan, number> = {
  FREE: 0, PLUS: 99000, MAX: 299000,
}
export const PLANS = [
  { id: 'FREE' as Plan, name: 'FREE', tokenLimit: 20000, priceVnd: 0, priceLabel: 'Miễn phí',
    description: 'Bắt đầu trải nghiệm KhanhOS AI với gói miễn phí.',
    features: ['20.000 token / tháng', 'Chat AI không giới hạn cuộc trò chuyện',
               'Lưu lịch sử trò chuyện', 'Hỗ trợ Markdown & code blocks'] },
  { id: 'PLUS' as Plan, name: 'PLUS', tokenLimit: 80000, priceVnd: 99000, priceLabel: '99.000đ',
    description: 'Tăng 4 lần quota cho người dùng thường xuyên.',
    features: ['80.000 token / tháng', 'Mọi tính năng của FREE',
               'Ưu tiên hàng đợi xử lý', 'Regenerate & stop generation'],
    highlight: true },
  { id: 'MAX' as Plan, name: 'MAX', tokenLimit: 200000, priceVnd: 299000, priceLabel: '299.000đ',
    description: 'Quota cao nhất cho người dùng chuyên nghiệp.',
    features: ['200.000 token / tháng', 'Mọi tính năng của PLUS',
               'Context window mở rộng', 'Hỗ trợ ưu tiên'] },
]
export function isPlan(v: unknown): v is Plan {
  return v === 'FREE' || v === 'PLUS' || v === 'MAX'
}
export function formatTokens(n: number): string {
  return new Intl.NumberFormat('vi-VN').format(n)
}
