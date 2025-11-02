import { createFileRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { useAuth } from '../contexts/AuthContext'
import { BookOpen, GraduationCap, Target, ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const { user } = useAuth()

  const features = [
    {
      icon: <BookOpen className="w-12 h-12 text-cyan-400" />,
      title: 'Interactive Classes',
      description:
        'Learn through structured courses with units and assessments. Progress at your own pace with clear completion tracking.',
    },
    {
      icon: <GraduationCap className="w-12 h-12 text-cyan-400" />,
      title: 'Flexible Learning',
      description:
        'Access your classes anytime, anywhere. Track your progress and pick up where you left off.',
    },
    {
      icon: <Target className="w-12 h-12 text-cyan-400" />,
      title: 'Assess Your Knowledge',
      description:
        'Test your understanding with quizzes and assessments. Get instant feedback and track your performance.',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <section className="relative py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
        <div className="relative max-w-5xl mx-auto">
          <h1 className="text-6xl md:text-7xl font-black text-white mb-6 [letter-spacing:-0.08em]">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Promptfu
            </span>
          </h1>
          <p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light">
            Your Online Learning Platform
          </p>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-8">
            Explore classes, learn at your own pace, and track your progress. 
            Enroll in courses and start your learning journey today.
          </p>
          <div className="flex flex-col items-center gap-4">
            {user ? (
              <Link
                to="/dashboard"
                className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50 flex items-center gap-2"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <div className="space-y-4">
                <Link
                  to="/signup"
                  className="inline-block px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50 flex items-center gap-2"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <p className="text-gray-400 text-sm">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Why Choose Promptfu?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
