export default function Page() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[1280px] items-center justify-center px-6 py-10">
        <section className="w-full max-w-[440px]">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-700 to-violet-400 text-base font-bold text-white shadow-sm">
              S
            </div>
            <div className="text-[28px] font-normal leading-none tracking-[-0.02em] text-black">
              slothui
            </div>
          </div>

          <header className="mb-8 text-center">
            <h1 className="mb-2 text-[36px] font-bold leading-[1.15] tracking-[-0.03em] text-gray-800">
              Create Your Account.
            </h1>
            <p className="text-base font-normal leading-6 text-gray-500">
              Join slothui and unlock your inner sloth 4.0 in a few quick steps.
            </p>
          </header>

          <form className="space-y-6">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="flex h-12 items-center rounded-[10px] border border-gray-200 bg-white px-4">
                <span className="flex h-5 w-5 items-center justify-center text-gray-400">
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 6h16v12H4z" />
    <path d="m4 7 8 6 8-6" />
  </svg>
</span>
                <input id="name" name="name" type="text" placeholder="Sherlock Holmes" className="h-full w-full border-0 bg-transparent p-0 text-base text-gray-800 outline-none placeholder:text-gray-400" />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="flex h-12 items-center rounded-[10px] border border-gray-200 bg-white px-4">
                <span className="flex h-5 w-5 items-center justify-center text-gray-400">
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 6h16v12H4z" />
    <path d="m4 7 8 6 8-6" />
  </svg>
</span>
                <input id="email" name="email" type="email" placeholder="elementary221b@gmail.com" className="h-full w-full border-0 bg-transparent p-0 text-base text-gray-800 outline-none placeholder:text-gray-400" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="flex h-12 items-center rounded-[10px] border border-gray-200 bg-white px-4">
                <span className="flex h-5 w-5 items-center justify-center text-gray-400">
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 6h16v12H4z" />
    <path d="m4 7 8 6 8-6" />
  </svg>
</span>
                <input id="password" name="password" type="password" placeholder="******************" className="h-full w-full border-0 bg-transparent p-0 text-base text-gray-800 outline-none placeholder:text-gray-400" />
              </div>
            </div>

            <button type="submit" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#5B4AFF] px-4 text-base font-bold text-white shadow-sm transition hover:opacity-95">
              <span>Sign Up</span>
              <span className="flex h-5 w-5 items-center justify-center text-gray-400">
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 6h16v12H4z" />
    <path d="m4 7 8 6 8-6" />
  </svg>
</span>
            </button>
          </form>

          <p className="mt-6 text-center text-sm font-normal text-gray-700">
            Already have an account? <a href="/login" className="font-medium text-[#5B4AFF] hover:opacity-90">Sign In</a>
          </p>
        </section>
      </div>
    </main>
  );
}