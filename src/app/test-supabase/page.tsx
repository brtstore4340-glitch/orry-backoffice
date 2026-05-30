import { Mail, Lock, Eye, ArrowRight, User } from 'lucide-react';

export default function AuthenticationUI() {
  return (
    <main 
      className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-[20px]" 
      style={{ 
        fontFamily: "'Inter', sans-serif", 
        WebkitFontSmoothing: 'antialiased', 
        MozOsxFontSmoothing: 'grayscale' 
      }}
    >
      <div className="w-full max-w-[480px] bg-[#FFFFFF] p-[40px] rounded-[24px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)]">
        
        {/* Header */}
        <h1 className="text-[32px] font-[800] text-[#1F2937] leading-[1.2] m-0">
          Create your Account
        </h1>
        <p className="mt-[8px] text-[16px] font-[400] text-[#6B7280] mb-0">
          Let's get started with a 30-day free trial.
        </p>

        {/* Form Container */}
        <div className="mt-[32px] flex flex-col gap-[24px]">
          
          {/* Name Input Group */}
          <div className="flex flex-col gap-[8px]">
            <label className="text-[14px] font-[700] text-[#1F2937] m-0 p-0 leading-none">Name</label>
            <div className="relative w-full h-[48px]">
              <User className="absolute left-[20px] top-[14px] w-[20px] h-[20px] text-[#9CA3AF]" />
              <input 
                type="text" 
                placeholder="John Doe"
                className="w-full h-[48px] box-border border border-[#E5E7EB] rounded-[100px] pl-[52px] pr-[20px] text-[14px] font-[400] text-[#1F2937] placeholder:text-[#9CA3AF] outline-none"
              />
            </div>
          </div>

          {/* Email Input Group */}
          <div className="flex flex-col gap-[8px]">
            <label className="text-[14px] font-[700] text-[#1F2937] m-0 p-0 leading-none">Email</label>
            <div className="relative w-full h-[48px]">
              <Mail className="absolute left-[20px] top-[14px] w-[20px] h-[20px] text-[#9CA3AF]" />
              <input 
                type="email" 
                placeholder="john@example.com"
                className="w-full h-[48px] box-border border border-[#E5E7EB] rounded-[100px] pl-[52px] pr-[20px] text-[14px] font-[400] text-[#1F2937] placeholder:text-[#9CA3AF] outline-none"
              />
            </div>
          </div>

          {/* Password Input Group */}
          <div className="flex flex-col gap-[8px]">
            <div className="flex justify-between items-center h-[14px]">
              <label className="text-[14px] font-[700] text-[#1F2937] m-0 p-0 leading-none">Password</label>
              <a href="#" className="text-[14px] font-[600] text-[#5A4BFF] no-underline leading-none">Forgot Password?</a>
            </div>
            <div className="relative w-full h-[48px]">
              <Lock className="absolute left-[20px] top-[14px] w-[20px] h-[20px] text-[#9CA3AF]" />
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full h-[48px] box-border border border-[#E5E7EB] rounded-[100px] pl-[52px] pr-[52px] text-[14px] font-[400] text-[#1F2937] placeholder:text-[#9CA3AF] outline-none"
              />
              <Eye className="absolute right-[20px] top-[14px] w-[20px] h-[20px] text-[#9CA3AF] cursor-pointer" />
            </div>
          </div>

          {/* Password Strength Indicator */}
          <div className="flex gap-[4px] w-full">
            <div className="h-[4px] rounded-[2px] flex-grow bg-[#10B981]"></div>
            <div className="h-[4px] rounded-[2px] flex-grow bg-[#10B981]"></div>
            <div className="h-[4px] rounded-[2px] flex-grow bg-[#E5E7EB]"></div>
            <div className="h-[4px] rounded-[2px] flex-grow bg-[#E5E7EB]"></div>
          </div>

          {/* Primary Button */}
          <button className="h-[48px] w-full bg-[#5A4BFF] rounded-[100px] flex justify-center items-center gap-[8px] border-none cursor-pointer mt-[8px]">
            <span className="text-[16px] font-[600] text-[#FFFFFF]">Sign Up</span>
            <ArrowRight className="w-[20px] h-[20px] text-[#FFFFFF]" />
          </button>

          {/* Divider ("OR") */}
          <div className="flex items-center gap-[12px]">
            <div className="flex-grow h-[1px] bg-[#E5E7EB]"></div>
            <span className="text-[12px] font-[600] text-[#9CA3AF]">OR</span>
            <div className="flex-grow h-[1px] bg-[#E5E7EB]"></div>
          </div>

          {/* OTP Input Boxes */}
          <div className="flex justify-between gap-[12px]">
            {['5', '2', '', ''].map((val, i) => (
              <div 
                key={i} 
                className="w-[56px] h-[56px] box-border border border-[#E5E7EB] rounded-[16px] flex justify-center items-center text-[32px] font-[700] text-[#9CA3AF] bg-[#FFFFFF]"
              >
                {val}
              </div>
            ))}
          </div>

        </div>
      </div>
    </main>
  );
}