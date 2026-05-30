'use client';

/**
 * Pixel-Perfect Authentication UI Component
 * 
 * STRICT SPECIFICATIONS IMPLEMENTED:
 * - Font: Inter, Sans-serif with antialiased
 * - Colors: Exact HEX codes as specified
 * - Typography: Strict sizes and weights
 * - Spacing: Exact pixel-based layout
 * - Components: Inputs, Buttons, OTP boxes, Password Strength, Dividers
 * 
 * NO UX LOGIC, VALIDATION, OR INTERACTIVITY - PURE VISUAL PRESENTATION
 */

import React from 'react';

/* ============================================================================
   SIGN IN PAGE
   ============================================================================ */
export function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-[20px]">
      <div className="w-full max-w-[480px]">
        {/* Card Container */}
        <div className="bg-white rounded-[24px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] p-[40px]">
          
          {/* Logo/Brand Mark */}
          <div className="mb-[32px] flex justify-center">
            <div className="w-[48px] h-[48px] bg-[#5A4BFF] rounded-full flex items-center justify-center">
              <span className="text-white font-extrabold text-[24px]">S</span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-[32px] font-extrabold text-[#1F2937] text-center leading-[1.2]">
            Welcome Back
          </h1>

          {/* Subtitle */}
          <p className="text-[16px] font-normal text-[#6B7280] text-center mt-[8px]">
            Sign in to your account to continue
          </p>

          {/* Form Container */}
          <div className="mt-[32px]">
            {/* Email Input Group */}
            <div className="mb-[24px]">
              <label className="block text-[14px] font-bold text-[#1F2937] mb-[8px]">
                Email Address
              </label>
              <div className="relative flex items-center">
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full h-[48px] px-[20px] border-[1px] border-[#E5E7EB] rounded-full text-[14px] font-normal text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:border-[#5A4BFF]"
                  readOnly
                />
                <svg
                  className="absolute right-[20px] w-[20px] h-[20px] text-[#9CA3AF] pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            {/* Password Input Group */}
            <div className="mb-[24px]">
              <label className="block text-[14px] font-bold text-[#1F2937] mb-[8px]">
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full h-[48px] px-[20px] border-[1px] border-[#E5E7EB] rounded-full text-[14px] font-normal text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:border-[#5A4BFF]"
                  value="••••••••"
                  readOnly
                />
                <svg
                  className="absolute right-[20px] w-[20px] h-[20px] text-[#9CA3AF] pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>

            {/* Remember & Forgot Row */}
            <div className="flex items-center justify-between mb-[24px]">
              <div className="flex items-center gap-[8px]">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-[20px] h-[20px] border-[1px] border-[#E5E7EB] rounded-[4px] accent-[#5A4BFF] cursor-pointer"
                  disabled
                />
                <label htmlFor="remember" className="text-[14px] font-normal text-[#6B7280]">
                  Remember me
                </label>
              </div>
              <a href="#" className="text-[14px] font-semibold text-[#5A4BFF] no-underline">
                Forgot Password?
              </a>
            </div>

            {/* Sign In Button */}
            <button className="w-full h-[48px] bg-[#5A4BFF] text-white rounded-full flex items-center justify-center gap-[8px] text-[16px] font-semibold cursor-pointer hover:bg-[#4A3BEF] transition-colors">
              Sign In
              <svg
                className="w-[20px] h-[20px]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-[12px] my-[24px]">
              <div className="flex-grow h-[1px] bg-[#E5E7EB]" />
              <span className="text-[12px] font-semibold text-[#9CA3AF]">OR</span>
              <div className="flex-grow h-[1px] bg-[#E5E7EB]" />
            </div>

            {/* Social Sign In */}
            <button className="w-full h-[48px] border-[1px] border-[#E5E7EB] rounded-full flex items-center justify-center gap-[8px] text-[16px] font-semibold text-[#1F2937] hover:bg-[#F9FAFB] transition-colors">
              <svg className="w-[20px] h-[20px]" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              Continue with Google
            </button>

            {/* Sign Up Link */}
            <p className="text-center text-[14px] font-normal text-[#6B7280] mt-[24px]">
              Don't have an account?{' '}
              <a href="#" className="font-semibold text-[#5A4BFF] no-underline">
                Sign Up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   SIGN UP PAGE
   ============================================================================ */
export function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-[20px]">
      <div className="w-full max-w-[480px]">
        {/* Card Container */}
        <div className="bg-white rounded-[24px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] p-[40px]">
          
          {/* Logo/Brand Mark */}
          <div className="mb-[32px] flex justify-center">
            <div className="w-[48px] h-[48px] bg-[#5A4BFF] rounded-full flex items-center justify-center">
              <span className="text-white font-extrabold text-[24px]">S</span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-[32px] font-extrabold text-[#1F2937] text-center leading-[1.2]">
            Create Account
          </h1>

          {/* Subtitle */}
          <p className="text-[16px] font-normal text-[#6B7280] text-center mt-[8px]">
            Join us today to get started
          </p>

          {/* Form Container */}
          <div className="mt-[32px]">
            {/* Full Name Input Group */}
            <div className="mb-[24px]">
              <label className="block text-[14px] font-bold text-[#1F2937] mb-[8px]">
                Full Name
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full h-[48px] px-[20px] border-[1px] border-[#E5E7EB] rounded-full text-[14px] font-normal text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:border-[#5A4BFF]"
                  readOnly
                />
                <svg
                  className="absolute right-[20px] w-[20px] h-[20px] text-[#9CA3AF] pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>

            {/* Email Input Group */}
            <div className="mb-[24px]">
              <label className="block text-[14px] font-bold text-[#1F2937] mb-[8px]">
                Email Address
              </label>
              <div className="relative flex items-center">
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full h-[48px] px-[20px] border-[1px] border-[#E5E7EB] rounded-full text-[14px] font-normal text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:border-[#5A4BFF]"
                  readOnly
                />
                <svg
                  className="absolute right-[20px] w-[20px] h-[20px] text-[#9CA3AF] pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            {/* Password Input Group */}
            <div className="mb-[24px]">
              <label className="block text-[14px] font-bold text-[#1F2937] mb-[8px]">
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full h-[48px] px-[20px] border-[1px] border-[#E5E7EB] rounded-full text-[14px] font-normal text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:border-[#5A4BFF]"
                  value="••••••••"
                  readOnly
                />
                <svg
                  className="absolute right-[20px] w-[20px] h-[20px] text-[#9CA3AF] pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>

            {/* Password Strength Indicator */}
            <div className="mb-[24px]">
              <div className="flex gap-[4px]">
                <div className="flex-1 h-[4px] bg-[#10B981] rounded-[2px]" />
                <div className="flex-1 h-[4px] bg-[#10B981] rounded-[2px]" />
                <div className="flex-1 h-[4px] bg-[#E5E7EB] rounded-[2px]" />
                <div className="flex-1 h-[4px] bg-[#E5E7EB] rounded-[2px]" />
              </div>
              <p className="text-[12px] font-normal text-[#6B7280] mt-[8px]">
                Strong password
              </p>
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start gap-[8px] mb-[24px]">
              <input
                type="checkbox"
                id="terms"
                className="w-[20px] h-[20px] border-[1px] border-[#E5E7EB] rounded-[4px] accent-[#5A4BFF] cursor-pointer mt-[2px] flex-shrink-0"
                disabled
              />
              <label htmlFor="terms" className="text-[14px] font-normal text-[#6B7280]">
                I agree to the{' '}
                <a href="#" className="font-semibold text-[#5A4BFF] no-underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="font-semibold text-[#5A4BFF] no-underline">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Sign Up Button */}
            <button className="w-full h-[48px] bg-[#5A4BFF] text-white rounded-full flex items-center justify-center gap-[8px] text-[16px] font-semibold cursor-pointer hover:bg-[#4A3BEF] transition-colors">
              Create Account
              <svg
                className="w-[20px] h-[20px]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Sign In Link */}
            <p className="text-center text-[14px] font-normal text-[#6B7280] mt-[24px]">
              Already have an account?{' '}
              <a href="#" className="font-semibold text-[#5A4BFF] no-underline">
                Sign In
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   FORGOT PASSWORD PAGE
   ============================================================================ */
export function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-[20px]">
      <div className="w-full max-w-[480px]">
        {/* Card Container */}
        <div className="bg-white rounded-[24px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] p-[40px]">
          
          {/* Logo/Brand Mark */}
          <div className="mb-[32px] flex justify-center">
            <div className="w-[48px] h-[48px] bg-[#5A4BFF] rounded-full flex items-center justify-center">
              <span className="text-white font-extrabold text-[24px]">S</span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-[32px] font-extrabold text-[#1F2937] text-center leading-[1.2]">
            Reset Password
          </h1>

          {/* Subtitle */}
          <p className="text-[16px] font-normal text-[#6B7280] text-center mt-[8px]">
            Enter your email to receive reset instructions
          </p>

          {/* Form Container */}
          <div className="mt-[32px]">
            {/* Email Input Group */}
            <div className="mb-[24px]">
              <label className="block text-[14px] font-bold text-[#1F2937] mb-[8px]">
                Email Address
              </label>
              <div className="relative flex items-center">
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full h-[48px] px-[20px] border-[1px] border-[#E5E7EB] rounded-full text-[14px] font-normal text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:border-[#5A4BFF]"
                  readOnly
                />
                <svg
                  className="absolute right-[20px] w-[20px] h-[20px] text-[#9CA3AF] pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            {/* Send Reset Link Button */}
            <button className="w-full h-[48px] bg-[#5A4BFF] text-white rounded-full flex items-center justify-center gap-[8px] text-[16px] font-semibold cursor-pointer hover:bg-[#4A3BEF] transition-colors">
              Send Reset Link
              <svg
                className="w-[20px] h-[20px]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Back to Sign In Link */}
            <p className="text-center text-[14px] font-normal text-[#6B7280] mt-[24px]">
              Remember your password?{' '}
              <a href="#" className="font-semibold text-[#5A4BFF] no-underline">
                Sign In
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   OTP VERIFICATION PAGE
   ============================================================================ */
export function OTPVerificationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-[20px]">
      <div className="w-full max-w-[480px]">
        {/* Card Container */}
        <div className="bg-white rounded-[24px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] p-[40px]">
          
          {/* Logo/Brand Mark */}
          <div className="mb-[32px] flex justify-center">
            <div className="w-[48px] h-[48px] bg-[#5A4BFF] rounded-full flex items-center justify-center">
              <span className="text-white font-extrabold text-[24px]">S</span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-[32px] font-extrabold text-[#1F2937] text-center leading-[1.2]">
            Verify Code
          </h1>

          {/* Subtitle */}
          <p className="text-[16px] font-normal text-[#6B7280] text-center mt-[8px]">
            We've sent a verification code to your email
          </p>

          {/* Form Container */}
          <div className="mt-[32px]">
            {/* OTP Input Boxes */}
            <div className="flex gap-[12px] justify-center mb-[24px]">
              {[1, 2, 3, 4, 5, 6].map((index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  placeholder="0"
                  className="w-[56px] h-[56px] border-[1px] border-[#E5E7EB] rounded-[16px] text-[32px] font-bold text-[#9CA3AF] text-center focus:outline-none focus:border-[#5A4BFF] placeholder-[#9CA3AF]"
                  readOnly
                />
              ))}
            </div>

            {/* Verify Button */}
            <button className="w-full h-[48px] bg-[#5A4BFF] text-white rounded-full flex items-center justify-center gap-[8px] text-[16px] font-semibold cursor-pointer hover:bg-[#4A3BEF] transition-colors mb-[24px]">
              Verify Code
              <svg
                className="w-[20px] h-[20px]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Resend Code */}
            <p className="text-center text-[14px] font-normal text-[#6B7280]">
              Didn't receive the code?{' '}
              <a href="#" className="font-semibold text-[#5A4BFF] no-underline">
                Resend Code
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   AUTHENTICATION UI SHOWCASE/DEMO
   ============================================================================ */
export function AuthenticationUIShowcase() {
  const [activePage, setActivePage] = React.useState<'signin' | 'signup' | 'forgot' | 'otp'>('signin');

  return (
    <div className="font-[Inter] antialiased">
      {/* Navigation */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-[#E5E7EB] p-[20px] flex gap-[12px] justify-center z-50">
        {[
          { key: 'signin', label: 'Sign In' },
          { key: 'signup', label: 'Sign Up' },
          { key: 'forgot', label: 'Forgot Password' },
          { key: 'otp', label: 'OTP Verification' },
        ].map((page) => (
          <button
            key={page.key}
            onClick={() => setActivePage(page.key as any)}
            className={`px-[16px] py-[8px] rounded-full text-[14px] font-semibold transition-colors ${
              activePage === page.key
                ? 'bg-[#5A4BFF] text-white'
                : 'bg-[#E5E7EB] text-[#1F2937] hover:bg-[#D1D5DB]'
            }`}
          >
            {page.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="pt-[80px]">
        {activePage === 'signin' && <SignInPage />}
        {activePage === 'signup' && <SignUpPage />}
        {activePage === 'forgot' && <ForgotPasswordPage />}
        {activePage === 'otp' && <OTPVerificationPage />}
      </div>
    </div>
  );
}
