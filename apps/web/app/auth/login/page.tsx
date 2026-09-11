'use client'

import { useState, useEffect } from 'react'
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

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [lastUsedEmail, setLastUsedEmail] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  })

  const emailValue = watch('email')

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail')
    if (savedEmail) {
      setLastUsedEmail(savedEmail)
      setValue('email', savedEmail)
      setValue('rememberMe', true)
    }
  }, [setValue])

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await authService.login(data)
      localStorage.setItem('accessToken', response.accessToken)
      localStorage.setItem('refreshToken', response.refreshToken)
      
      if (data.rememberMe) {
        localStorage.setItem('rememberedEmail', data.email)
      } else {
        localStorage.removeItem('rememberedEmail')
      }
      
      router.push('/app/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`
  }

  const handleAppleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/apple`
  }

  const handleUseLastEmail = () => {
    if (lastUsedEmail) {
      setValue('email', lastUsedEmail)
    }
  }

  return (
    <div className="h-screen bg-white flex flex-col lg:flex-row overflow-hidden">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-6 sm:px-8 lg:px-12 xl:px-16 bg-white order-2 lg:order-1 h-full">
        <div className="w-full max-w-sm">
          {/* Logo at top */}
          <div className="mb-6 flex justify-center lg:justify-start">
            <ApointliLogo size="md" />
          </div>

          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Welcome back</h1>
            <p className="mt-1.5 text-sm text-gray-500">
              Don't have an account?{' '}
              <Link href="/auth/register" className="font-semibold text-[#0a1628] hover:text-[#1a2a4a] transition-colors">
                Create one
              </Link>
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl">
              <p className="text-sm text-rose-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                {...register('email')}
                id="email"
                type="email"
                autoComplete="email"
                className={`w-full px-4 py-2.5 border-2 ${
                  errors.email ? 'border-rose-300' : 'border-gray-300'
                } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a1628] focus:border-[#0a1628] transition-all text-sm placeholder-gray-400 bg-gray-50/50 hover:bg-gray-50`}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1.5 text-sm text-rose-600">{errors.email.message}</p>
              )}
              
              {/* Last Used Email Suggestion */}
              {lastUsedEmail && !emailValue && (
                <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-500">
                    Last used:{' '}
                    <button
                      type="button"
                      onClick={handleUseLastEmail}
                      className="font-medium text-[#0a1628] hover:underline focus:outline-none"
                    >
                      {lastUsedEmail}
                    </button>
                  </p>
                </div>
              )}
              
              {lastUsedEmail && emailValue && emailValue !== lastUsedEmail && (
                <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-500">
                    Not {lastUsedEmail}?{' '}
                    <button
                      type="button"
                      onClick={handleUseLastEmail}
                      className="font-medium text-[#0a1628] hover:underline focus:outline-none"
                    >
                      Use last used
                    </button>
                  </p>
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  Password
                </label>
                <Link href="/auth/forgot-password" className="text-sm font-medium text-[#0a1628] hover:text-[#1a2a4a] transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`w-full px-4 py-2.5 border-2 ${
                    errors.password ? 'border-rose-300' : 'border-gray-300'
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a1628] focus:border-[#0a1628] transition-all text-sm placeholder-gray-400 bg-gray-50/50 hover:bg-gray-50 pr-12`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
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
              {errors.password && (
                <p className="mt-1.5 text-sm text-rose-600">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  {...register('rememberMe')}
                  type="checkbox"
                  className="w-4 h-4 text-[#0a1628] border-2 border-gray-300 rounded focus:ring-[#0a1628] group-hover:border-[#0a1628] transition-colors"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-[#0a1628] text-white font-semibold rounded-xl hover:bg-[#1a2a4a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0a1628] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm hover:shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-white text-gray-400 font-medium">or continue with</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium text-gray-700 shadow-sm hover:shadow-md"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <button
              onClick={handleAppleLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-black hover:bg-gray-900 hover:border-gray-600 transition-all text-sm font-medium text-white shadow-sm hover:shadow-md"
            >
              <AppleIcon className="w-5 h-5 text-white" />
              Continue with Apple
            </button>
          </div>

          <p className="mt-5 text-center text-xs text-gray-500">
            By continuing, you agree to our{' '}
            <a href="#" className="text-[#0a1628] hover:text-[#1a2a4a] font-medium">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-[#0a1628] hover:text-[#1a2a4a] font-medium">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex flex-1 bg-[#0a1628] relative overflow-hidden items-center justify-center p-8 xl:p-12 order-1 lg:order-2 h-full">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col items-center text-white max-w-md">
          <div className="mb-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 xl:w-32 xl:h-32 bg-white/5 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl">
              <ApointliLogo size="xl" variant="light" />
            </div>
          </div>
          
          <h2 className="text-2xl xl:text-3xl font-bold text-center leading-tight">
            Manage your business
            <span className="block text-blue-200">from anywhere</span>
          </h2>
          
          <p className="mt-3 xl:mt-4 text-blue-100/80 text-center text-base xl:text-lg leading-relaxed">
            Access your appointments, staff, and customers all in one place.
          </p>
          
          <div className="mt-6 xl:mt-8 space-y-3 w-full">
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
