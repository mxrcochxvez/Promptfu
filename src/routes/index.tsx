import { createFileRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { useAuth } from '../contexts/AuthContext'
import { BookOpen, GraduationCap, Target, ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const { user } = useAuth()

  const features = [
    {
      icon: <BookOpen className="w-12 h-12 text-olive-400" />,
      title: 'Interactive Classes',
      description:
        'Learn through structured courses with units and assessments. Progress at your own pace with clear completion tracking.',
    },
    {
      icon: <GraduationCap className="w-12 h-12 text-olive-400" />,
      title: 'Flexible Learning',
      description:
        'Access your classes anytime, anywhere. Track your progress and pick up where you left off.',
    },
    {
      icon: <Target className="w-12 h-12 text-olive-400" />,
      title: 'Assess Your Knowledge',
      description:
        'Test your understanding with quizzes and assessments. Get instant feedback and track your performance.',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-hero">
      <section className="relative py-24 md:py-32 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-accent opacity-50"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(125,143,86,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(107,111,255,0.1),transparent_50%)]"></div>
        
        <div className="relative max-w-6xl mx-auto">
          <div className="inline-block mb-6">
            <span className="px-4 py-2 bg-olive-500/10 border border-olive-500/30 rounded-full text-olive-400 text-sm font-semibold">
              Learn. Grow. Succeed.
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-neutral-50 mb-6 [letter-spacing:-0.04em]">
            <span className="bg-gradient-to-r from-olive-400 via-olive-300 to-accent-400 bg-clip-text text-transparent">
              Promptfu
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl lg:text-3xl text-neutral-300 mb-6 font-light max-w-3xl mx-auto">
            Your Online Learning Platform
          </p>
          
          <p className="text-base md:text-lg text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Explore classes, learn at your own pace, and track your progress. 
            Enroll in courses and start your learning journey today.
          </p>
          
          <div className="flex flex-col items-center gap-4">
            {user ? (
              <Link
                to="/dashboard"
                className="group px-8 py-4 bg-gradient-to-r from-olive-600 to-olive-500 hover:from-olive-500 hover:to-olive-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-olive-500/30 hover:shadow-xl hover:shadow-olive-500/40 flex items-center gap-2 hover:scale-105 active:scale-95"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Link
                  to="/signup"
                  className="group px-8 py-4 bg-gradient-to-r from-olive-600 to-olive-500 hover:from-olive-500 hover:to-olive-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-olive-500/30 hover:shadow-xl hover:shadow-olive-500/40 flex items-center gap-2 hover:scale-105 active:scale-95"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <p className="text-neutral-400 text-sm">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="text-accent-500 hover:text-accent-400 font-semibold transition-colors duration-200 underline underline-offset-2"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-50 mb-4">
            Why Choose Promptfu?
          </h2>
          <p className="text-neutral-400 max-w-2xl mx-auto">
            Experience learning designed for the modern student
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group glass-effect border border-neutral-800/50 rounded-2xl p-8 hover:border-olive-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-olive-500/10 hover:-translate-y-1 card-shadow"
            >
              <div className="mb-6 transform group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-neutral-50 mb-3 group-hover:text-olive-400 transition-colors">
                {feature.title}
              </h3>
              <p className="text-neutral-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
