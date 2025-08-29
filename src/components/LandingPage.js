import React, { useState, useEffect } from "react";
import { Percent, Headphones, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-gradient-to-br from-white via-green-50/20 to-white font-sans text-gray-800 min-h-screen">
      {/* Header with modern glass effect */}
      <header className="w-full border-b backdrop-blur-sm bg-white/90 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-[#405952]/10 rounded-full blur-md"></div>
              <img
                src="/logo192.png"
                alt="Partner Portal Logo"
                className="h-12 w-12 relative z-10 drop-shadow-lg"
              />
            </div>
            <span className="font-semibold text-base bg-gradient-to-r from-[#405952] to-[#30423f] bg-clip-text text-transparent">
              Power Workplace Partner Portal
            </span>
          </div>
          <Link to="/login">
            <button className="px-6 py-2.5 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200/50">
              Partner Login
            </button>
          </Link>
        </div>
      </header>

      {/* Hero Section with enhanced visual appeal */}
      <section className="py-20 relative overflow-hidden">
        {/* Subtle animated background elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#405952]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#405952]/3 rounded-full blur-3xl"></div>
        
        <div className={`max-w-6xl mx-auto px-6 grid md:grid-cols-2 items-center gap-16 relative z-10 transform transition-all duration-1000 ${
          isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          
          {/* Left: Logo + text with enhanced styling */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-8">
              {/* Glowing ring effect */}
              <div className="w-48 h-48 bg-gradient-to-r from-[#405952] to-[#30423f] rounded-full p-1 shadow-2xl flex items-center justify-center">
                <div className="bg-white rounded-full p-8 w-full h-full flex items-center justify-center">
                  <img
                    src="/logo192.png"
                    alt="Partner Portal Icon"
                    className="h-24 w-24 drop-shadow-xl"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden w-24 h-24 bg-[#405952] rounded-lg items-center justify-center">
                    <span className="text-white font-bold text-2xl">PW</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-wider bg-gradient-to-r from-[#405952] to-[#30423f] bg-clip-text text-transparent">
                PARTNER PORTAL
              </h3>
              <div className="w-24 h-1 bg-gradient-to-r from-[#405952] to-[#30423f] mx-auto mt-2 rounded-full"></div>
            </div>
          </div>

          {/* Right: Headings + Button with premium styling */}
          <div className="flex flex-col items-start space-y-6">
            <div className="space-y-2">
              <h1 className="text-5xl font-black leading-tight">
                Welcome to
              </h1>
              <h2 className="text-5xl font-black bg-gradient-to-r from-[#405952] to-[#30423f] bg-clip-text text-transparent">
                Partner Portal
              </h2>
            </div>
            
            <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
              Access exclusive pricing for <span className="font-semibold text-[#405952]">PointGrab</span>, <span className="font-semibold text-[#405952]">MileSight</span>, <span className="font-semibold text-[#405952]">Humly</span>, <span className="font-semibold text-[#405952]">Eptura</span>, and <span className="font-semibold text-[#405952]">ThingsBoard</span> products.
            </p>
            
            <button
              onClick={() => navigate("/application")}
              className="group relative px-8 py-4 bg-gradient-to-r from-[#405952] to-[#30423f] text-white font-bold rounded-xl shadow-2xl hover:shadow-[#405952]/25 transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10 text-lg">Apply for Partnership</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#30423f] to-[#405952] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </section>

      {/* Benefits Section with modern card design */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className={`text-center mb-16 transform transition-all duration-1000 delay-300 ${
          isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <h3 className="font-semibold text-[#405952] mb-2 text-lg tracking-wide">
            Benefits of Partnership
          </h3>
          <h2 className="text-3xl font-black text-gray-800 mb-4">
            Maximize Your Success with
          </h2>
          <h2 className="text-3xl font-black bg-gradient-to-r from-[#405952] to-[#30423f] bg-clip-text text-transparent">
            Power Workplace
          </h2>
          <div className="w-32 h-1 bg-gradient-to-r from-[#405952] to-[#30423f] mx-auto mt-6 rounded-full"></div>
        </div>

        <div className={`grid md:grid-cols-3 gap-8 transform transition-all duration-1000 delay-500 ${
          isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          
          {/* Card 1 - Enhanced design */}
          <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden">
            {/* Gradient background on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#405952]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Icon with enhanced styling */}
            <div className="relative z-10 mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#405952] to-[#30423f] rounded-2xl flex items-center justify-center shadow-lg">
                <Percent className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <div className="relative z-10">
              <h4 className="font-bold text-xl mb-4 text-gray-800 group-hover:text-[#405952] transition-colors">
                Tiered Discounts
              </h4>
              <p className="text-gray-600 leading-relaxed">
                Unlock increasing discounts based on your partnership level, maximizing your profitability with every tier advancement.
              </p>
            </div>
            
            {/* Bottom accent line */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#405952] to-[#30423f] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </div>

          {/* Card 2 */}
          <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#405952]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative z-10 mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#405952] to-[#30423f] rounded-2xl flex items-center justify-center shadow-lg">
                <Headphones className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <div className="relative z-10">
              <h4 className="font-bold text-xl mb-4 text-gray-800 group-hover:text-[#405952] transition-colors">
                Technical Support
              </h4>
              <p className="text-gray-600 leading-relaxed">
                Receive dedicated technical support from our expert team to ensure seamless implementations and ongoing success.
              </p>
            </div>
            
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#405952] to-[#30423f] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </div>

          {/* Card 3 */}
          <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#405952]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative z-10 mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#405952] to-[#30423f] rounded-2xl flex items-center justify-center shadow-lg">
                <Package className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <div className="relative z-10">
              <h4 className="font-bold text-xl mb-4 text-gray-800 group-hover:text-[#405952] transition-colors">
                Product Access
              </h4>
              <p className="text-gray-600 leading-relaxed">
                Gain access to our comprehensive suite of products and solutions to meet your clients' diverse and evolving needs.
              </p>
            </div>
            
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#405952] to-[#30423f] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </div>
        </div>
      </section>

      {/* Footer with enhanced styling */}
      <footer className={`border-t bg-gradient-to-r from-gray-50 to-white mt-20 transform transition-all duration-1000 delay-700 ${
        isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex justify-center items-center">
            <div className="text-gray-500 font-medium text-center">
              © 2025 by Power Workplace.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;