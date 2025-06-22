"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  CheckCircle,
  Zap,
  MessageSquare,
  BarChart3,
  Sparkles,
  ArrowRight,
  Feather,
  BookOpen,
  AlertCircle,
  Users,
  LogOut,
  User,
} from "lucide-react"
import { useAuthContext } from "./auth/auth-context"

interface LandingPageProps {
  onGetStarted: () => void
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const { user, signOut } = useAuthContext()

  const features = [
    {
      icon: <AlertCircle className="h-6 w-6 text-red-500" />,
      title: "Real-time Spell Check",
      description: "Catch typos and spelling errors as you type with our advanced dictionary system.",
    },
    {
      icon: <BookOpen className="h-6 w-6 text-blue-500" />,
      title: "Grammar Suggestions",
      description: "Get intelligent grammar recommendations to improve your writing clarity and impact.",
    },
    {
      icon: <MessageSquare className="h-6 w-6 text-green-500" />,
      title: "Thread Management",
      description: "Easily create and manage Twitter threads with automatic character counting.",
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-purple-500" />,
      title: "Character Optimization",
      description: "Visual character counter with warnings to help you stay within Twitter's limits.",
    },
    {
      icon: <Zap className="h-6 w-6 text-yellow-500" />,
      title: "Instant Feedback",
      description: "Get immediate writing suggestions with Grammarly-style highlighting and corrections.",
    },
    {
      icon: <Users className="h-6 w-6 text-indigo-500" />,
      title: "Social Media Optimized",
      description: "Built specifically for Twitter with understanding of hashtags, mentions, and social language.",
    },
  ]

  const benefits = [
    "Write error-free tweets and threads",
    "Improve engagement with better grammar",
    "Save time with instant corrections",
    "Build professional credibility",
    "Optimize content for Twitter's format",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Feather className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">FeatherDrafts</span>
            </div>
            <div className="flex items-center gap-2">
              {user && (
                <div className="flex items-center gap-2 mr-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>{user.user_metadata?.full_name || user.email}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={async () => {
                      await signOut()
                      window.location.href = '/'
                    }} 
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Button onClick={onGetStarted} className="bg-blue-600 hover:bg-blue-700">
                Get Started
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Grammarly for Twitter
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Write Perfect
            <span className="text-blue-600"> Twitter Threads</span>
            <br />
            Every Time
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Our AI-powered grammar and spell checker helps you craft engaging, error-free Twitter content that builds
            credibility and drives engagement.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={onGetStarted} size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3">
              Start Writing Better Tweets
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Perfect Tweets
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive writing assistance designed specifically for Twitter's unique format and audience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Why Choose TwitterGrammar?</h2>
            <p className="text-xl text-blue-100">Join thousands of creators who trust us with their Twitter presence</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                  <span className="text-white text-lg">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">10,000+</div>
                <div className="text-blue-100 mb-4">Tweets improved daily</div>

                <div className="text-4xl font-bold text-white mb-2">95%</div>
                <div className="text-blue-100 mb-4">Accuracy rate</div>

                <div className="text-4xl font-bold text-white mb-2">2.5x</div>
                <div className="text-blue-100">Better engagement</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Elevate Your Twitter Game?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Start creating professional, error-free Twitter content that engages your audience and builds your brand.
          </p>

          <Button onClick={onGetStarted} size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3">
            Get Started for Free
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>

          <p className="text-gray-400 mt-4 text-sm">No credit card required • Start writing better tweets in seconds</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Feather className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">FeatherDrafts</span>
            </div>

            <div className="text-gray-400 text-sm">© 2024 TwitterGrammar. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
