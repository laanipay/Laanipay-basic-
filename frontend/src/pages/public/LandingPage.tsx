import React from 'react';
import { Link } from 'react-router-dom';
import { 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon,
  PhoneIcon,
  CreditCardIcon,
  GlobeAltIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header/Navigation */}
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-primary-600">LaaniPay</h1>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="#about" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  About
                </a>
                <a href="#mission" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Mission
                </a>
                <a href="#features" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Features
                </a>
                <Link to="/login" className="text-primary-600 hover:text-primary-800 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Experience More.
              <br />
              <span className="text-primary-600">Experience The Best.</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              LaaniPay is a revolutionary digital platform at the intersection of telecom services and multi-level marketing (MLM). 
              Empower yourself across Africa to earn and grow through our binary MLM system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/register" 
                className="bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors inline-flex items-center justify-center"
              >
                Start Your Journey
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link 
                to="/login" 
                className="bg-white text-primary-600 border-2 border-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-50 transition-colors"
              >
                Login to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-20 left-10 w-20 h-20 bg-primary-200 rounded-full opacity-20"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-secondary-200 rounded-full opacity-20"></div>
          <div className="absolute bottom-20 left-20 w-16 h-16 bg-success-200 rounded-full opacity-20"></div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">About Us</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                LaaniPay is a revolutionary digital platform at the intersection of telecom services and multi-level marketing (MLM). 
                We empower individuals across Africa to earn and grow through our binary MLM system while offering essential telecom 
                solutions like airtime recharge, data purchase, bill payments, and more—all from one easy-to-use mobile app.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                With a strong commitment to innovation and financial empowerment, LaaniPay is more than just a business—it's a movement. 
                We are building a network-driven economy that enables people to take control of their income, develop entrepreneurial 
                skills, and create long-term wealth.
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600">₦45M+</div>
                  <div className="text-sm text-gray-600">Maximum Earnings</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600">6</div>
                  <div className="text-sm text-gray-600">MLM Stages</div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-6 rounded-xl text-white">
                <PhoneIcon className="h-12 w-12 mb-4" />
                <h3 className="font-semibold mb-2">Telecom Services</h3>
                <p className="text-sm opacity-90">Airtime, data, and bill payments</p>
              </div>
              <div className="bg-gradient-to-br from-secondary-500 to-secondary-600 p-6 rounded-xl text-white">
                <UserGroupIcon className="h-12 w-12 mb-4" />
                <h3 className="font-semibold mb-2">Binary MLM</h3>
                <p className="text-sm opacity-90">Sustainable income generation</p>
              </div>
              <div className="bg-gradient-to-br from-success-500 to-success-600 p-6 rounded-xl text-white">
                <CurrencyDollarIcon className="h-12 w-12 mb-4" />
                <h3 className="font-semibold mb-2">Financial Growth</h3>
                <p className="text-sm opacity-90">Multiple earning opportunities</p>
              </div>
              <div className="bg-gradient-to-br from-warning-500 to-warning-600 p-6 rounded-xl text-white">
                <GlobeAltIcon className="h-12 w-12 mb-4" />
                <h3 className="font-semibold mb-2">Africa-wide</h3>
                <p className="text-sm opacity-90">Continental reach and impact</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section id="mission" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Mission */}
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-center mb-6">
                <div className="bg-primary-100 p-3 rounded-full">
                  <ChartBarIcon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 ml-4">Our Mission</h3>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed">
                To reduce poverty and combat youth unemployment across Africa by providing a sustainable 
                income-generating platform through telecom-based services and binary MLM opportunities.
              </p>
              
              <div className="mt-6 space-y-3">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-success-500 mr-3" />
                  <span className="text-gray-700">Poverty reduction initiatives</span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-success-500 mr-3" />
                  <span className="text-gray-700">Youth employment solutions</span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-success-500 mr-3" />
                  <span className="text-gray-700">Sustainable income generation</span>
                </div>
              </div>
            </div>

            {/* Vision */}
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-center mb-6">
                <div className="bg-secondary-100 p-3 rounded-full">
                  <StarIcon className="h-8 w-8 text-secondary-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 ml-4">Our Vision</h3>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                To become—if not the first—one of the most innovative and leading MLM companies globally, 
                known for transforming lives through accessible digital entrepreneurship and telecom solutions.
              </p>
              
              <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-6 rounded-xl border-l-4 border-primary-500">
                <p className="text-xl font-semibold text-gray-900 text-center">
                  "Experience More. Experience The Best."
                </p>
                <p className="text-center text-gray-600 mt-2">Our Motto</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Why Choose LaaniPay?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the power of combining telecom services with a proven MLM compensation plan
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CurrencyDollarIcon className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Binary MLM System</h3>
              <p className="text-gray-600">
                Earn through our 6-stage binary compensation plan with earnings up to ₦45,875,200
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-secondary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <PhoneIcon className="h-8 w-8 text-secondary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Telecom Services</h3>
              <p className="text-gray-600">
                Complete telecom solutions including airtime, data, and bill payments
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-success-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCardIcon className="h-8 w-8 text-success-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure Payments</h3>
              <p className="text-gray-600">
                Safe and secure payment processing with multiple gateway options
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Financial Future?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of Africans who are already building wealth through LaaniPay's revolutionary platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/register" 
              className="bg-white text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors inline-flex items-center justify-center"
            >
              Start Earning Today
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
            <a 
              href="#about" 
              className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">LaaniPay</h3>
              <p className="text-gray-400">
                Empowering Africa through digital entrepreneurship and telecom solutions.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/register" className="hover:text-white transition-colors">Get Started</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
                <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Email: support@laanipay.com</li>
                <li>Phone: +234-XXX-XXXX-XXX</li>
                <li>Help Center</li>
                <li>Documentation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>MLM Disclaimer</li>
                <li>Cookie Policy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 LaaniPay. All rights reserved. Experience More. Experience The Best.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;