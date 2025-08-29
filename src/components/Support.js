import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Mail, Phone, Clock, HelpCircle } from 'lucide-react';

const Support = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // LinkedIn SVG Icon Component
  const LinkedInIcon = () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <Header toggleSidebar={toggleSidebar} />

      {/* Subtle background elements for depth */}
      <div className="fixed top-32 right-20 w-72 h-72 bg-[#405952]/3 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-32 left-20 w-96 h-96 bg-[#405952]/2 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main content */}
      <main className="pt-16 relative z-10">
        <div className="p-6 max-w-5xl mx-auto">
          {/* Page Header */}
          <div className={`mb-8 text-center transform transition-all duration-1000 ${
            isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
            <h1 className="text-3xl font-black bg-gradient-to-r from-gray-800 to-[#405952] bg-clip-text text-transparent tracking-tight mb-3">
              Support Center
            </h1>
            <p className="text-lg text-gray-600">
              Get dedicated help and support for your partnership needs
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-[#405952] to-[#30423f] mx-auto mt-4 rounded-full"></div>
          </div>

          {/* Contact Information - 2x2 Grid Layout */}
          <div className={`transform transition-all duration-1000 delay-300 ${
            isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              
              {/* Email Support Card */}
              <div className="bg-white rounded-3xl shadow-2xl p-6 border border-gray-100/50 backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#405952]/5 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#405952]/5 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-[#405952]/3 rounded-full blur-xl"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-[#405952]/20 rounded-xl blur-sm"></div>
                      <div className="relative p-3 bg-gradient-to-r from-[#405952] to-[#30423f] rounded-xl shadow-lg">
                        <Mail className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#405952] transition-colors">Email Support</h3>
                  </div>
                  <a 
                    href="mailto:ask@powerworkplace.com"
                    className="text-gray-700 font-medium hover:text-[#405952] transition-colors cursor-pointer block mb-2"
                  >
                    ask@powerworkplace.com
                  </a>
                  <p className="text-sm text-gray-500">Response within 24 hours</p>
                </div>
              </div>

              {/* Phone Support Card */}
              <div className="bg-white rounded-3xl shadow-2xl p-6 border border-gray-100/50 backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#405952]/5 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#405952]/5 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-[#405952]/3 rounded-full blur-xl"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-[#405952]/20 rounded-xl blur-sm"></div>
                      <div className="relative p-3 bg-gradient-to-r from-[#405952] to-[#30423f] rounded-xl shadow-lg">
                        <Phone className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#405952] transition-colors">Phone Support</h3>
                  </div>
                  <p className="text-gray-700 font-medium mb-2">+852 3461 3113</p>
                  <p className="text-sm text-gray-500">Mon-Fri, 9 AM - 6 PM HKT</p>
                </div>
              </div>

              {/* LinkedIn Card */}
              <div className="bg-white rounded-3xl shadow-2xl p-6 border border-gray-100/50 backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#405952]/5 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#405952]/5 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-[#405952]/3 rounded-full blur-xl"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-[#405952]/20 rounded-xl blur-sm"></div>
                      <div className="relative p-3 bg-gradient-to-r from-[#405952] to-[#30423f] rounded-xl shadow-lg">
                        <LinkedInIcon />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#405952] transition-colors">LinkedIn</h3>
                  </div>
                  <a 
                    href="https://www.linkedin.com/company/75524688/admin/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 font-medium hover:text-[#405952] transition-colors cursor-pointer block mb-2"
                  >
                    Connect with us on LinkedIn
                  </a>
                  <p className="text-sm text-gray-500">Follow for updates</p>
                </div>
              </div>

              {/* Business Hours Card */}
              <div className="bg-white rounded-3xl shadow-2xl p-6 border border-gray-100/50 backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#405952]/5 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#405952]/5 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-[#405952]/3 rounded-full blur-xl"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-[#405952]/20 rounded-xl blur-sm"></div>
                      <div className="relative p-3 bg-gradient-to-r from-[#405952] to-[#30423f] rounded-xl shadow-lg">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#405952] transition-colors">Business Hours</h3>
                  </div>
                  <p className="text-gray-700 font-medium mb-2">Monday - Friday</p>
                  <p className="text-sm text-gray-500">9:00 AM - 6:00 PM EST</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Support;