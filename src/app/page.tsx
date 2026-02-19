import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section - Optimized for LCP */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              TalentFlow
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Hyper-Local Student Freelancer Marketplace
            </p>
            <p className="text-lg mb-12 text-blue-200 max-w-2xl mx-auto">
              Connect with verified student freelancers in your neighborhood. Get immediate help for content creation, tech support, errands, and more.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/auth/signup?role=client"
                className="bg-white text-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Hire a Freelancer
              </Link>
              <Link 
                href="/auth/signup?role=freelancer"
                className="bg-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-900 transition-colors border border-blue-600"
              >
                Become a Freelancer
              </Link>
            </div>
          </div>
        </div>
        
        {/* Wave divider - simplified SVG */}
        <div className="relative h-16">
          <svg className="absolute bottom-0 w-full h-16 text-gray-100" viewBox="0 0 1440 64" preserveAspectRatio="none">
            <path fill="currentColor" d="M0,32L60,37.3C120,43,240,53,360,53.3C480,53,600,43,720,42.7C840,43,960,53,1080,53.3C1200,53,1320,43,1380,37.3L1440,32L1440,64L1380,64C1320,64,1200,64,1080,64C960,64,840,64,720,64C600,64,480,64,360,64C240,64,120,64,60,64L0,64Z" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mb-4">
                <span className="text-white text-xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Mode A: Immediate</h3>
              <p className="text-gray-600">
                Post a task with a fixed price. Verified freelancers within 5km receive instant notifications. First to accept gets the job!
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-4">
                <span className="text-white text-xl">📋</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Mode B: Standard</h3>
              <p className="text-gray-600">
                Post a creative project. Freelancers submit proposals with portfolios. Review and choose the best fit.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                <span className="text-white text-xl">✅</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Verified Students</h3>
              <p className="text-gray-600">
                All freelancers are verified students. Enjoy 10% commission on verified accounts vs 50% on unverified.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Categories</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-6 text-center hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="text-4xl mb-2">🎬</div>
              <div className="font-medium text-gray-800">Content Engine</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 text-center hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="text-4xl mb-2">📦</div>
              <div className="font-medium text-gray-800">Hyper-Local Logistics</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 text-center hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="text-4xl mb-2">💻</div>
              <div className="font-medium text-gray-800">Tech Neighbor</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 text-center hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="text-4xl mb-2">📚</div>
              <div className="font-medium text-gray-800">Academic Support</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 text-center hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="text-4xl mb-2">🎪</div>
              <div className="font-medium text-gray-800">Event Support</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 text-center hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="text-4xl mb-2">🎙️</div>
              <div className="font-medium text-gray-800">AI Training</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 text-center hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="text-4xl mb-2">📊</div>
              <div className="font-medium text-gray-800">Digital Assistant</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of students earning while learning.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth/signup"
              className="bg-white text-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Sign Up Now
            </Link>
            <Link 
              href="/auth/login"
              className="bg-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-900 transition-colors border border-blue-600"
            >
              Log In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <span className="text-2xl font-bold text-white">TalentFlow</span>
              <p className="mt-2">Hyper-Local Student Freelancer Marketplace</p>
            </div>
            <div className="flex gap-8">
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p>© 2024 TalentFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
