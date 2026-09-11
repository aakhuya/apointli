'use client'

import Link from 'next/link'
import { ApointliLogo } from '@/app/components/logo/ApointliLogo'
import {
  CalendarIcon,
  UsersIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  MapPinIcon,
  BellIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'

export default function Home() {
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => setIsVisible(true), [])

  const features = [
    { icon: CalendarIcon, title: 'Online Booking', description: 'Let customers book appointments anytime, from any device.' },
    { icon: UsersIcon, title: 'Team Management', description: 'Manage staff schedules, roles and permissions with ease.' },
    { icon: ClockIcon, title: 'Smart Calendar', description: 'View and manage appointments in a simple, intuitive calendar.' },
    { icon: ChatBubbleLeftRightIcon, title: 'Customer Management', description: 'Keep track of your customers and their history.' },
    { icon: MapPinIcon, title: 'Multi-Location', description: 'Manage multiple locations from one dashboard.' },
    { icon: BellIcon, title: 'Notifications', description: 'Reduce no-shows with automated email and SMS reminders.' },
    { icon: ChartBarIcon, title: 'Analytics & Reports', description: 'Track performance, revenue and growth.' },
    { icon: ShieldCheckIcon, title: 'Secure & Reliable', description: 'Your data is protected with industry-standard security.' },
  ]

  const benefits = ['No credit card required', 'Setup in minutes']

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/"><ApointliLogo size="md" /></Link>
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="text-sm font-medium text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all">
                Log in
              </Link>
              <Link href="/auth/register" className="text-sm font-medium text-white bg-[#0a1628] hover:bg-[#1a2a4a] px-5 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-24 pb-12 sm:pt-28 sm:pb-16 lg:pt-36 lg:pb-24 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center">
            <div className={`text-center lg:text-left transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-gray-900 leading-[1.1]">
                The smarter way to
                <span className="block text-[#0a1628] relative">
                  book and manage
                  <svg className="absolute -bottom-2 left-0 w-full h-3 text-[#0a1628]/20" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q25 0 50 5 T100 5" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                </span>
                appointments
              </h1>

              <p className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-600 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Apointli is an all-in-one appointment scheduling platform for service-based businesses.
                Manage your team, bookings, customers and grow — all in one place.
              </p>

              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
                <Link href="/auth/register" className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3 bg-[#0a1628] text-white font-medium rounded-xl hover:bg-[#1a2a4a] transition-all shadow-lg hover:shadow-xl group">
                  Start for Free
                  <ArrowRightIcon className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6">
                {benefits.map((benefit, index) => (
                  <span key={index} className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {benefit}
                  </span>
                ))}
              </div>
            </div>

            {/* Right - Dashboard Preview */}
            <div className={`relative mt-8 lg:mt-0 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50/80 px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400"></div>
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-400"></div>
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-gray-400 ml-2">Dashboard</span>
                </div>
                <div className="p-3 sm:p-5">
                  <div className="flex justify-between items-start mb-3 sm:mb-5">
                    <div>
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Good morning, Sarah</h3>
                      <p className="text-[10px] sm:text-xs text-gray-500">Here's what's happening today</p>
                    </div>
                    <button className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-white bg-[#0a1628] rounded-lg">
                      + New
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 sm:gap-3 mb-3 sm:mb-5">
                    {[
                      { label: 'Bookings', value: '18' },
                      { label: 'Revenue', value: '$847' },
                      { label: 'Upcoming', value: '7' },
                      { label: 'No-shows', value: '2' },
                    ].map((stat, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-1.5 sm:p-2.5">
                        <p className="text-sm sm:text-lg font-bold text-[#0a1628]">{stat.value}</p>
                        <p className="text-[8px] sm:text-[10px] text-gray-500">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5 sm:mb-2.5">
                      <h4 className="text-[10px] sm:text-xs font-semibold text-gray-700">Today's appointments</h4>
                      <span className="text-[8px] sm:text-[10px] text-[#0a1628] font-medium">View all →</span>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      {[
                        { time: '9:00 AM', client: 'Emma Wilson', service: 'Hair Styling', color: 'bg-[#0a1628]' },
                        { time: '10:30 AM', client: 'James Chen', service: 'Consultation', color: 'bg-blue-500' },
                        { time: '1:00 PM', client: 'Lisa Park', service: 'Manicure', color: 'bg-emerald-500' },
                      ].map((appt, i) => (
                        <div key={i} className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg hover:bg-gray-50">
                          <div className={`w-1 h-6 sm:h-8 rounded-full ${appt.color}`}></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{appt.client}</p>
                            <p className="text-[10px] sm:text-xs text-gray-500">{appt.service}</p>
                          </div>
                          <span className="text-[10px] sm:text-xs font-medium text-gray-600 whitespace-nowrap">{appt.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12 md:mb-16">
            <span className="text-xs font-semibold text-[#0a1628] tracking-widest uppercase bg-[#0a1628]/10 px-3 py-1 rounded-full">
              Features
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mt-4">
              Everything you need to
              <span className="block text-[#0a1628]">grow your business</span>
            </h2>
            <p className="mt-2 sm:mt-4 text-base sm:text-lg text-gray-600">
              Powerful features designed to save you time and delight your customers
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div key={i} className="group bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 hover:shadow-xl hover:border-[#0a1628]/20 transition-all duration-300 hover:-translate-y-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#0a1628] rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform shadow-md">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-1.5">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-16 md:py-20 bg-[#0a1628] relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            Ready to transform your business?
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-blue-100 max-w-2xl mx-auto">
            Manage appointments, staff, and customers from one place.
          </p>
          <div className="mt-6 sm:mt-8 md:mt-10">
            <Link href="/auth/register" className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-3.5 bg-white text-[#0a1628] font-medium rounded-xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-2xl group">
              Start for Free
              <ArrowRightIcon className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <p className="mt-4 text-xs text-blue-200">No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a1628] text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
            <div>
              <ApointliLogo size="md" variant="light" />
              <p className="text-xs mt-4 text-blue-200/60 tracking-widest uppercase font-medium">
                Book. Manage. Grow.
              </p>
              <p className="text-xs sm:text-sm mt-2 text-gray-500 max-w-xs">
                Smart scheduling for modern businesses.
              </p>
            </div>

            <div>
              <h4 className="text-white font-medium mb-3 sm:mb-4 text-sm sm:text-base">Product</h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li>
                  <a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-medium mb-3 sm:mb-4 text-sm sm:text-base">Company</h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">About</a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-800 text-xs sm:text-sm text-center text-gray-500">
            &copy; 2026 apointli. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
