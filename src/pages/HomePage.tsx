import { Link } from 'react-router-dom';
import { Star, Brain, TrendingUp, Globe, Book, Trophy, LogIn, UserPlus } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function HomePage() {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  
  // If already signed in, redirect to dashboard
  useEffect(() => {
    if (isSignedIn) {
      navigate('/dashboard');
    }
  }, [isSignedIn, navigate]);
  
  if (isSignedIn) {
    return null; // Don't render the homepage content while redirecting
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-transparent to-purple-100/50"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="text-center">
            {/* Main Title */}
            <h1 className="text-5xl lg:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-6 animate-fade-in">
              Arabic Dialects Hub
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl lg:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Master all Arabic dialects - <strong>Darija</strong>, <strong>Lebanese</strong>, <strong>Syrian</strong>, <strong>Emirati</strong>, and <strong>Saudi</strong>. 
              Learn from any dialect to any other with interactive quizzes and cultural context.
            </p>
            
            {/* CTA Buttons - Large and Prominent */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
              <Link
                to="/signup"
                className="group px-10 py-5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-200 flex items-center gap-3 min-w-[250px] justify-center"
              >
                <UserPlus className="h-6 w-6 group-hover:scale-110 transition-transform" />
                Create Free Account
              </Link>
              <Link
                to="/login"
                className="group px-10 py-5 bg-white text-blue-600 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl border-3 border-blue-600 hover:bg-blue-50 transform hover:scale-105 transition-all duration-200 flex items-center gap-3 min-w-[250px] justify-center"
              >
                <LogIn className="h-6 w-6 group-hover:scale-110 transition-transform" />
                Sign In
              </Link>
            </div>
            
            {/* Learn More Button */}
            <div className="mb-12">
              <button
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-gray-600 hover:text-gray-800 underline underline-offset-4 text-lg transition-colors"
              >
                Learn more about our features ↓
              </button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">400+</div>
                <div className="text-gray-600">Authentic Phrases</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">5</div>
                <div className="text-gray-600">Arabic Dialects</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">AI</div>
                <div className="text-gray-600">Smart Learning</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div id="features" className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built for Arabic speakers who want to communicate fluently across all dialects and regions
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-blue-600 p-3 rounded-xl w-fit mb-4">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Quizzes</h3>
              <p className="text-gray-600">
                AI-powered multiple choice and word ordering exercises that adapt to your learning pace
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-purple-600 p-3 rounded-xl w-fit mb-4">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Progress Mastery</h3>
              <p className="text-gray-600">
                Track phrases you've mastered through quiz performance and manual marking
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-green-600 p-3 rounded-xl w-fit mb-4">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Cultural Context</h3>
              <p className="text-gray-600">
                Learn not just words, but cultural nuances and appropriate usage in different situations
              </p>
            </div>
            
            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-red-600 p-3 rounded-xl w-fit mb-4">
                <Book className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Translation Hub</h3>
              <p className="text-gray-600">
                Instant translation between 5 major Arabic dialects with pronunciation guides
              </p>
            </div>
            
            {/* Feature 5 */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-yellow-600 p-3 rounded-xl w-fit mb-4">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Progress Tracking</h3>
              <p className="text-gray-600">
                Monitor your learning journey with detailed analytics and achievement milestones
              </p>
            </div>
            
            {/* Feature 6 */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-indigo-600 p-3 rounded-xl w-fit mb-4">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Free Forever</h3>
              <p className="text-gray-600">
                Access all features without any subscription fees or hidden costs
              </p>
            </div>
          </div>
          
          {/* Final CTA */}
          <div className="text-center mt-16 bg-gradient-to-r from-blue-50 to-purple-50 py-12 rounded-3xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Master Arabic Dialects?
            </h3>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of learners bridging Arabic dialects
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/signup"
                className="group px-10 py-5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-200 flex items-center gap-3"
              >
                <UserPlus className="h-6 w-6 group-hover:scale-110 transition-transform" />
                Sign Up Free
              </Link>
              <Link
                to="/login"
                className="group px-10 py-5 bg-white text-blue-600 text-xl font-bold rounded-2xl shadow-xl hover:shadow-2xl border-2 border-blue-200 hover:border-blue-400 transform hover:scale-105 transition-all duration-200 flex items-center gap-3"
              >
                <LogIn className="h-6 w-6 group-hover:scale-110 transition-transform" />
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}