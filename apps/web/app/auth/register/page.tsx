'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader } from '@/app/components/Loader'
import { GoogleIcon } from '@/app/components/icons/GoogleIcon'
import { AppleIcon } from '@/app/components/icons/AppleIcon'
import { ApointliLogo } from '@/app/components/logo/ApointliLogo'
import { authService } from '@/app/lib/auth/auth.service'

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const password = watch('password') || ''

  // Live rule checks
  const rules = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
  ]

  const onSubmit = async (data: FormData) => {
    setIsLoading(true); setError(null)
    try {
      const { confirmPassword, ...payload } = data
      const response = await authService.register(payload)
      localStorage.setItem('accessToken', response.accessToken)
      localStorage.setItem('refreshToken', response.refreshToken)
      router.push('/app/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed.')
    } finally { setIsLoading(false) }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center px-6 sm:px-12 lg:px-16 py-12 lg:py-16 bg-white order-2 lg:order-1">
        <div className="w-full max-w-sm">
          <div className="mb-8"><ApointliLogo size="md" /></div>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Create account</h1>
            <p className="mt-2 text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-semibold text-[#0a1628] hover:underline">Sign in</Link>
            </p>
          </div>

          {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-600">{error}</div>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">First name</label>
                <input
                  {...register('firstName')} type="text" autoComplete="given-name"
                  className={`w-full px-4 py-3 border-2 ${errors.firstName ? 'border-rose-300' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a1628] focus:border-[#0a1628] text-sm bg-gray-50`}
                  placeholder="John"
                />
                {errors.firstName && <p className="mt-1 text-sm text-rose-600">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Last name</label>
                <input
                  {...register('lastName')} type="text" autoComplete="family-name"
                  className={`w-full px-4 py-3 border-2 ${errors.lastName ? 'border-rose-300' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a1628] focus:border-[#0a1628] text-sm bg-gray-50`}
                  placeholder="Doe"
                />
                {errors.lastName && <p className="mt-1 text-sm text-rose-600">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
              <input
                {...register('email')} type="email" autoComplete="email"
                className={`w-full px-4 py-3 border-2 ${errors.email ? 'border-rose-300' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a1628] focus:border-[#0a1628] text-sm bg-gray-50`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-sm text-rose-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register('password')} type={showPassword ? 'text' : 'password'} autoComplete="new-password"
                  className={`w-full px-4 py-3 border-2 ${errors.password ? 'border-rose-300' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a1628] focus:border-[#0a1628] text-sm bg-gray-50 pr-12`}
                  placeholder="Create a strong password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Rule checklist */}
              {password && (
                <ul className="mt-2 space-y-1">
                  {rules.map((rule, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs">
                      {rule.met ? (
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className={rule.met ? 'text-green-700' : 'text-gray-500'}>{rule.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm password</label>
              <div className="relative">
                <input
                  {...register('confirmPassword')} type={showConfirm ? 'text' : 'password'} autoComplete="new-password"
                  className={`w-full px-4 py-3 border-2 ${errors.confirmPassword ? 'border-rose-300' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a1628] focus:border-[#0a1628] text-sm bg-gray-50 pr-12`}
                  placeholder="Confirm your password"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showConfirm ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-rose-600">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 bg-[#0a1628] text-white font-semibold rounded-xl hover:bg-[#1a2a4a] disabled:opacity-50 transition-all shadow-sm text-sm"
            >
              {isLoading ? <><Loader className="w-4 h-4" />Creating account...</> : 'Create account'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center text-xs"><span className="px-4 bg-white text-gray-400 font-medium">or continue with</span></div>
          </div>

          <div className="space-y-2.5">
            <button className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-all text-sm font-medium text-gray-700">
              <GoogleIcon /> Continue with Google
            </button>
            <button className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl bg-black hover:bg-gray-900 transition-all text-sm font-medium text-white">
              <AppleIcon className="w-5 h-5 text-white" /> Continue with Apple
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-gray-500">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-[#0a1628] hover:underline font-medium">Terms</a> and{' '}
            <a href="#" className="text-[#0a1628] hover:underline font-medium">Privacy Policy</a>
          </p>
        </div>
      </div>

      {/* Right - Branding */}
      <div className="hidden lg:flex flex-1 bg-[#0a1628] relative overflow-hidden items-center justify-center p-12 order-1 lg:order-2 min-h-screen">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col items-center text-white max-w-md">
          <div className="w-32 h-32 bg-white/5 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl mb-8">
            <ApointliLogo size="xl" variant="light" />
          </div>
          <h2 className="text-3xl font-bold text-center leading-tight">
            Start managing your
            <span className="block text-blue-200">bookings today</span>
          </h2>
          <p className="mt-4 text-blue-100/80 text-center text-lg">
            Get your professional booking system up and running in minutes.
          </p>
          <div className="mt-8 space-y-3 w-full">
            <div className="flex items-center gap-3 text-blue-100/80">
              <svg className="w-5 h-5 text-blue-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">Free to start — no credit card required</span>
            </div>
            <div className="flex items-center gap-3 text-blue-100/80">
              <svg className="w-5 h-5 text-blue-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">Setup in minutes</span>
            </div>
            <div className="flex items-center gap-3 text-blue-100/80">
              <svg className="w-5 h-5 text-blue-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">Secure by design</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
