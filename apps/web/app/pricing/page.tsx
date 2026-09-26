'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowRightIcon,
  CheckIcon,
  MinusIcon,
} from '@heroicons/react/24/outline'

import { ApointliLogo } from '@/app/components/logo/ApointliLogo'

interface Plan {
  id: 'free' | 'pro' | 'business'
  name: string
  tagline: string
  priceMonthly: number
  priceYearly: number
  highlighted?: boolean
  features: string[]
  ctaLabel: string
  ctaHref: string
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'For solo operators just getting started',
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      '1 staff member',
      'Up to 20 bookings/month',
      '1 location',
      'Public booking page',
      'Email notifications',
      'Customer management',
    ],
    ctaLabel: 'Start for free',
    ctaHref: '/auth/register',
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For growing service businesses',
    priceMonthly: 29,
    priceYearly: 290,
    highlighted: true,
    features: [
      'Up to 5 staff members',
      'Unlimited bookings',
      'Up to 2 locations',
      'Everything in Free, plus:',
      'SMS reminders',
      'Advanced analytics',
      'Custom booking page',
      'Priority support',
    ],
    ctaLabel: 'Start free trial',
    ctaHref: '/auth/register?plan=pro',
  },
  {
    id: 'business',
    name: 'Business',
    tagline: 'For teams with multiple locations',
    priceMonthly: 79,
    priceYearly: 790,
    features: [
      'Unlimited staff members',
      'Unlimited bookings',
      'Unlimited locations',
      'Everything in Pro, plus:',
      'Multi-location management',
      'Staff performance reports',
      'API access',
      'Dedicated onboarding',
    ],
    ctaLabel: 'Start free trial',
    ctaHref: '/auth/register?plan=business',
  },
]

const comparisonFeatures = [
  { label: 'Staff members', free: '1', pro: '5', business: 'Unlimited' },
  { label: 'Bookings / month', free: '20', pro: 'Unlimited', business: 'Unlimited' },
  { label: 'Locations', free: '1', pro: '2', business: 'Unlimited' },
  { label: 'Public booking page', free: true, pro: true, business: true },
  { label: 'Email notifications', free: true, pro: true, business: true },
  { label: 'SMS reminders', free: false, pro: true, business: true },
  { label: 'Advanced analytics', free: false, pro: true, business: true },
  { label: 'Custom booking page', free: false, pro: true, business: true },
  { label: 'Multi-location support', free: false, pro: false, business: true },
  { label: 'API access', free: false, pro: false, business: true },
  { label: 'Priority support', free: false, pro: true, business: true },
  { label: 'Dedicated onboarding', free: false, pro: false, business: true },
]

const faqs = [
  {
    q: 'How does the free plan work?',
    a: "The Free plan is genuinely free — no credit card required, no time limit. It's perfect for trying Apointli or for solo operators with light booking needs. Upgrade anytime when you outgrow it.",
  },
  {
    q: 'Can I change plans later?',
    a: 'Yes. You can upgrade or downgrade at any time. When you upgrade, the new limits apply immediately. When you downgrade, the change takes effect at the end of your billing cycle.',
  },
  {
    q: 'Do you charge per booking?',
    a: 'No. Unlike other platforms, we never take a cut of your bookings. You pay a flat monthly fee regardless of how many appointments you take.',
  },
  {
    q: 'Is there a contract or minimum commitment?',
    a: 'No contracts. All plans are month-to-month (or annual if you prefer the discount). Cancel anytime with one click.',
  },
  {
    q: 'What happens to my data if I cancel?',
    a: 'Your data remains yours. You can export everything at any time. If you cancel, we keep your data for 30 days so you can reactivate without losing anything.',
  },
  {
    q: 'Do you offer a discount for annual billing?',
    a: 'Yes — two months free when you pay annually. That\'s a ~17% discount on the monthly price.',
  },
]

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const getPrice = (plan: Plan) =>
    billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <ApointliLogo size="md" />
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
                Features
              </Link>
              <Link href="/pricing" className="text-sm font-medium text-gray-900">
                Pricing
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Log in
              </Link>
              <Link
                href="/auth/register"
                className="text-sm font-medium text-white bg-[#0a1628] hover:bg-[#1a2a4a] px-5 py-2.5 rounded-lg transition-all"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-28 sm:pt-32 pb-12 sm:pb-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
            Simple pricing for
            <span className="block text-[#0a1628]">every business</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Start free. Upgrade when you need more. No contracts, no hidden fees,
            no cut of your bookings.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center gap-3 bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-colors flex items-center gap-2 ${
                billingCycle === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              Yearly
              <span className="text-[10px] font-semibold uppercase tracking-wide bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Plan cards */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan) => {
              const price = getPrice(plan)
              const period = billingCycle === 'monthly' ? '/month' : '/year'
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border-2 p-6 sm:p-8 transition-all ${
                    plan.highlighted
                      ? 'border-[#0a1628] shadow-xl lg:scale-105 bg-white'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-[#0a1628] text-white text-[10px] font-semibold uppercase tracking-wide px-3 py-1 rounded-full">
                        Most popular
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">{plan.tagline}</p>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-bold text-gray-900">
                        ${price}
                      </span>
                      <span className="text-sm text-gray-500">{period}</span>
                    </div>
                    {billingCycle === 'yearly' && price > 0 && (
                      <p className="text-xs text-emerald-600 mt-1 font-medium">
                        2 months free
                      </p>
                    )}
                  </div>

                  <Link
                    href={plan.ctaHref}
                    className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all mb-8 ${
                      plan.highlighted
                        ? 'bg-[#0a1628] hover:bg-[#1a2a4a] text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    {plan.ctaLabel}
                    <ArrowRightIcon className="w-4 h-4" />
                  </Link>

                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <CheckIcon className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span
                          className={
                            feature.startsWith('Everything')
                              ? 'text-gray-500 font-medium'
                              : 'text-gray-700'
                          }
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            All plans include 14-day free trial on paid tiers · No credit card
            required to start
          </p>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Compare plans
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Everything you get on each tier
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left p-4 sm:p-6 text-sm font-semibold text-gray-900">
                      Features
                    </th>
                    <th className="text-center p-4 sm:p-6 text-sm font-semibold text-gray-900 min-w-[100px]">
                      Free
                    </th>
                    <th className="text-center p-4 sm:p-6 text-sm font-semibold text-[#0a1628] min-w-[100px] bg-blue-50/50">
                      Pro
                    </th>
                    <th className="text-center p-4 sm:p-6 text-sm font-semibold text-gray-900 min-w-[100px]">
                      Business
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50"
                    >
                      <td className="p-4 sm:p-6 text-sm text-gray-700">
                        {row.label}
                      </td>
                      {(['free', 'pro', 'business'] as const).map((tier) => {
                        const value = row[tier]
                        return (
                          <td
                            key={tier}
                            className={`text-center p-4 sm:p-6 text-sm ${
                              tier === 'pro' ? 'bg-blue-50/30' : ''
                            }`}
                          >
                            {typeof value === 'boolean' ? (
                              value ? (
                                <CheckIcon className="w-5 h-5 text-emerald-600 mx-auto" />
                              ) : (
                                <MinusIcon className="w-5 h-5 text-gray-300 mx-auto" />
                              )
                            ) : (
                              <span className="font-medium text-gray-900">
                                {value}
                              </span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900 text-sm sm:text-base">
                    {faq.q}
                  </span>
                  <span
                    className={`text-gray-400 text-xl font-light transition-transform flex-shrink-0 ${
                      openFaq === i ? 'rotate-45' : ''
                    }`}
                  >
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#0a1628]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
            Join businesses already using Apointli to manage their appointments
            and grow.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-[#0a1628] font-medium rounded-xl hover:bg-gray-50 transition-all"
            >
              Start for free
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-transparent border border-white/30 text-white font-medium rounded-xl hover:bg-white/10 transition-all"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <ApointliLogo size="sm" variant="light" />
          <p className="text-xs">
            © 2026 apointli. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
