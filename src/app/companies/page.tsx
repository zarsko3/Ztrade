'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  TrendingUp, 
  BarChart3, 
  Shield, 
  Target, 
  Zap,
  ArrowRight,
  Star,
  Users,
  Globe,
  Award,
  Brain
} from 'lucide-react';
import { TradeLogo } from '@/components/ui/TradeLogo';

interface Company {
  id: string;
  name: string;
  symbol: string;
  sector: string;
  marketCap: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  description: string;
  features: string[];
}

const featuredCompanies: Company[] = [
  {
    id: '1',
    name: 'Apple Inc.',
    symbol: 'AAPL',
    sector: 'Technology',
    marketCap: '$2.8T',
    price: 175.43,
    change: 2.15,
    changePercent: 1.24,
    volume: '45.2M',
    description: 'Leading technology company known for innovative consumer electronics and software.',
    features: ['High Growth', 'Dividend Aristocrat', 'Blue Chip']
  },
  {
    id: '2',
    name: 'Microsoft Corporation',
    symbol: 'MSFT',
    sector: 'Technology',
    marketCap: '$2.6T',
    price: 378.85,
    change: -1.23,
    changePercent: -0.32,
    volume: '28.7M',
    description: 'Global technology leader in software, cloud services, and enterprise solutions.',
    features: ['Cloud Leader', 'AI Innovation', 'Stable Growth']
  },
  {
    id: '3',
    name: 'Tesla, Inc.',
    symbol: 'TSLA',
    sector: 'Automotive',
    marketCap: '$850B',
    price: 245.67,
    change: 8.92,
    changePercent: 3.76,
    volume: '89.1M',
    description: 'Electric vehicle and clean energy company revolutionizing transportation.',
    features: ['EV Leader', 'High Volatility', 'Growth Stock']
  },
  {
    id: '4',
    name: 'Amazon.com Inc.',
    symbol: 'AMZN',
    sector: 'Consumer Discretionary',
    marketCap: '$1.7T',
    price: 165.23,
    change: 3.45,
    changePercent: 2.13,
    volume: '52.3M',
    description: 'E-commerce and cloud computing giant with diverse business operations.',
    features: ['E-commerce', 'Cloud Services', 'Market Leader']
  }
];

const sectors = [
  { name: 'Technology', icon: Zap, count: 156, color: 'bg-blue-500' },
  { name: 'Healthcare', icon: Shield, count: 89, color: 'bg-green-500' },
  { name: 'Financial', icon: BarChart3, count: 124, color: 'bg-purple-500' },
  { name: 'Consumer', icon: Users, count: 98, color: 'bg-orange-500' },
  { name: 'Energy', icon: Globe, count: 67, color: 'bg-red-500' },
  { name: 'Industrial', icon: Building2, count: 112, color: 'bg-gray-500' }
];

export default function CompaniesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const filteredCompanies = featuredCompanies.filter(company => {
    const matchesSector = selectedSector === 'all' || company.sector === selectedSector;
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         company.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSector && matchesSearch;
  });

  // Don't render anything while loading or if user is authenticated (will redirect)
  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <TradeLogo />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trade</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Professional Trading
            <span className="text-emerald-600 dark:text-emerald-400"> Dashboard</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Track your stock trades, analyze performance, and benchmark against the S&P 500 with 
            professional-grade analytics and AI-powered insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/login')}
              className="px-8 py-4 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Start Trading</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="px-8 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Why Choose Trade?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Advanced Analytics</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Professional-grade performance metrics and risk analysis tools.
              </p>
            </div>
            <div className="text-center p-6 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">AI Insights</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Machine learning-powered pattern recognition and predictive analytics.
              </p>
            </div>
            <div className="text-center p-6 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">S&P 500 Benchmarking</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Compare your performance against the market's leading index.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Companies Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Featured Companies
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Explore top-performing stocks across different sectors
              </p>
            </div>
            
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mt-4 lg:mt-0">
              <input
                type="text"
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="all">All Sectors</option>
                {sectors.map(sector => (
                  <option key={sector.name} value={sector.name}>{sector.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Companies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCompanies.map((company) => (
              <div
                key={company.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {company.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {company.symbol} • {company.sector}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      ${company.price.toFixed(2)}
                    </p>
                    <p className={`text-sm font-medium ${
                      company.changePercent >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {company.changePercent >= 0 ? '+' : ''}{company.changePercent.toFixed(2)}%
                    </p>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                  {company.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {company.features.map((feature, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
                
                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                  <span>Market Cap: {company.marketCap}</span>
                  <span>Vol: {company.volume}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sectors Overview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Market Sectors
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {sectors.map((sector) => (
              <div
                key={sector.name}
                className="text-center p-6 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => setSelectedSector(sector.name)}
              >
                <div className={`w-12 h-12 ${sector.color} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                  <sector.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {sector.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {sector.count} companies
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-emerald-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Trading?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Join thousands of traders who trust our platform for their investment decisions.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-8 py-4 bg-white text-emerald-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2 mx-auto"
          >
            <span>Create Free Account</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <TradeLogo />
                <span className="text-xl font-bold">Trade</span>
              </div>
              <p className="text-gray-400">
                Professional trading dashboard for serious investors.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Trade Tracking</li>
                <li>Performance Analytics</li>
                <li>AI Insights</li>
                <li>Risk Management</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>About</li>
                <li>Privacy</li>
                <li>Terms</li>
                <li>Support</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Twitter</li>
                <li>LinkedIn</li>
                <li>GitHub</li>
                <li>Contact</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Trade. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 