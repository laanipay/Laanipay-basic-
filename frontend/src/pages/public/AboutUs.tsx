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
  StarIcon,
  ShieldCheckIcon,
  TrophyIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

const AboutUs: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-primary-600">LaaniPay</h1>
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link to="/" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Home
                </Link>
                <Link to="/about" className="text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                  About
                </Link>
                <Link to="/contact" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Contact
                </Link>
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
      <section className="bg-gradient-to-r from-primary-600 to-secondary-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            About LaaniPay
          </h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            Empowering Africa through digital entrepreneurship and telecom solutions
          </p>
        </div>
      </section>

      {/* Main About Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Who We Are</h2>
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
              
              <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-6 rounded-xl border-l-4 border-primary-500 mb-8">
                <p className="text-xl font-semibold text-gray-900 text-center">
                  "Experience More, Experience The Best."
                </p>
                <p className="text-center text-gray-600 mt-2">Our Motto</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <UserGroupIcon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Community Focus</h3>
                <p className="text-sm text-gray-600">Building strong networks across Africa</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <div className="bg-secondary-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <LightBulbIcon className="h-6 w-6 text-secondary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Innovation</h3>
                <p className="text-sm text-gray-600">Cutting-edge digital solutions</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <div className="bg-success-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <ShieldCheckIcon className="h-6 w-6 text-success-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Trust & Security</h3>
                <p className="text-sm text-gray-600">Secure and transparent operations</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <div className="bg-warning-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <TrophyIcon className="h-6 w-6 text-warning-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Excellence</h3>
                <p className="text-sm text-gray-600">Committed to the highest standards</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Our Mission & Vision</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Driving change across Africa through sustainable income generation and digital innovation
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Mission */}
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-center mb-6">
                <div className="bg-primary-100 p-3 rounded-full">
                  <ChartBarIcon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 ml-4">Our Mission</h3>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                To reduce poverty and combat youth unemployment across Africa by providing a sustainable 
                income-generating platform through telecom-based services and binary MLM opportunities.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircleIcon className="h-6 w-6 text-success-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Poverty Reduction</h4>
                    <p className="text-gray-600">Creating sustainable income opportunities for all</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircleIcon className="h-6 w-6 text-success-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Youth Employment</h4>
                    <p className="text-gray-600">Empowering young entrepreneurs across the continent</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircleIcon className="h-6 w-6 text-success-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Financial Inclusion</h4>
                    <p className="text-gray-600">Making financial services accessible to everyone</p>
                  </div>
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
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <StarIcon className="h-6 w-6 text-secondary-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Global Leadership</h4>
                    <p className="text-gray-600">Setting industry standards worldwide</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <StarIcon className="h-6 w-6 text-secondary-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Digital Innovation</h4>
                    <p className="text-gray-600">Pioneering technology solutions for Africa</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <StarIcon className="h-6 w-6 text-secondary-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Life Transformation</h4>
                    <p className="text-gray-600">Creating meaningful impact in communities</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">What We Offer</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive digital solutions combining telecom services with MLM opportunities
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-100">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <PhoneIcon className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Telecom Services</h3>
              <p className="text-gray-600 mb-4">
                Airtime recharge, data purchase, and bill payments
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Mobile airtime top-up</li>
                <li>• Data bundle purchases</li>
                <li>• Utility bill payments</li>
                <li>• Cable TV subscriptions</li>
              </ul>
            </div>

            <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-100">
              <div className="bg-secondary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserGroupIcon className="h-8 w-8 text-secondary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Binary MLM</h3>
              <p className="text-gray-600 mb-4">
                6-stage compensation plan with sustainable earnings
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Binary tree structure</li>
                <li>• Stage-based earnings</li>
                <li>• Monthly verification bonuses</li>
                <li>• Recycling opportunities</li>
              </ul>
            </div>

            <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-100">
              <div className="bg-success-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCardIcon className="h-8 w-8 text-success-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure Payments</h3>
              <p className="text-gray-600 mb-4">
                Safe and reliable payment processing
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Multiple payment gateways</li>
                <li>• Bank transfers</li>
                <li>• Mobile money integration</li>
                <li>• Secure transactions</li>
              </ul>
            </div>

            <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-100">
              <div className="bg-warning-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <GlobeAltIcon className="h-8 w-8 text-warning-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Africa-wide Reach</h3>
              <p className="text-gray-600 mb-4">
                Continental network and support
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Multi-country presence</li>
                <li>• Local language support</li>
                <li>• Regional partnerships</li>
                <li>• Cultural adaptation</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              LaaniPay by the Numbers
            </h2>
            <p className="text-xl text-primary-100">
              Building a stronger Africa, one opportunity at a time
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">₦45M+</div>
              <div className="text-primary-100">Maximum Earnings Potential</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">6</div>
              <div className="text-primary-100">MLM Stages</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">24/7</div>
              <div className="text-primary-100">Platform Availability</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">100%</div>
              <div className="text-primary-100">Secure Transactions</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to Join the LaaniPay Movement?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Take the first step towards financial independence and become part of Africa's digital transformation
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
              to="/contact" 
              className="border-2 border-primary-600 text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">LaaniPay</h3>
              <p className="text-gray-400 mb-4">
                Empowering Africa through digital entrepreneurship and telecom solutions.
              </p>
              <p className="text-gray-500 text-sm">
                "Experience More, Experience The Best."
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">News</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Email: laanipay1@gmail.com</li>
                <li>Phone: +229 0155 049165</li>
                <li><a href="https://wa.me/22955049165" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp Support</a></li>
                <li><a href="https://youtube.com/@laanipay?si=bVEYoMf4cy8R9QId" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">YouTube Channel</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">MLM Disclaimer</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 LaaniPay. All rights reserved. Experience More, Experience The Best.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutUs;