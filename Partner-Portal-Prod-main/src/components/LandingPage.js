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
    <div className="bg-white font-sans text-[#818181] min-h-screen">
      {/* Header with modern glass effect */}
      <header className="w-full border-b backdrop-blur-sm bg-white/90 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-[#1B2150]/20 rounded-full blur-md"></div>
              <img
                src="/logo192.png"
                alt="Partner’s Portal Logo"
                className="h-12 w-12 relative z-10 drop-shadow-lg"
              />
            </div>
            <span className="font-semibold text-base text-[#1B2150]">
              Power Workplace Partner’s Portal
            </span>
          </div>
          <Link to="/login">
            <button className="px-6 py-2.5 bg-[#1B2150] text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:bg-[#5F6485]">
              Partner Login
            </button>
          </Link>
        </div>
      </header>

      {/* Hero Section with enhanced visual appeal */}
      <section className="py-20 relative overflow-hidden bg-[#FAFAFB]">
        {/* Subtle animated background elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#1B2150]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#5F6485]/20 rounded-full blur-3xl"></div>
        
        <div className={`max-w-6xl mx-auto px-6 grid md:grid-cols-2 items-center gap-16 relative z-10 transform transition-all duration-1000 ${
          isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          
          {/* Left: Logo + text with enhanced styling */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-8">
              {/* Ring effect with blue focus */}
              <div className="w-48 h-48 bg-[#1B2150] rounded-full p-1 shadow-2xl flex items-center justify-center">
                <div className="bg-white rounded-full p-8 w-full h-full flex items-center justify-center">
                  <img
                    src="/logo192.png"
                    alt="Partner’s Portal Icon"
                    className="h-24 w-24 drop-shadow-xl"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden w-24 h-24 bg-[#1B2150] rounded-lg items-center justify-center">
                    <span className="text-white font-bold text-2xl">PW</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-wider text-[#1B2150]">
                Partner’s Portal
              </h3>
              <div className="w-24 h-1 bg-[#1B2150] mx-auto mt-2 rounded-full"></div>
            </div>
          </div>

          {/* Right: Headings + Button with premium styling */}
          <div className="flex flex-col items-start space-y-6">
            <div className="space-y-2">
              <h1 className="text-5xl font-black leading-tight text-[#818181]">
                Welcome to
              </h1>
              <h2 className="text-5xl font-black text-[#1B2150]">
                Partner’s Portal
              </h2>
            </div>
            
            <p className="text-lg text-[#818181] leading-relaxed max-w-lg">
              Access exclusive pricing for <span className="font-semibold text-[#1B2150]">PointGrab</span>, <span className="font-semibold text-[#1B2150]">MileSight</span>, <span className="font-semibold text-[#1B2150]">Humly</span>, <span className="font-semibold text-[#1B2150]">Eptura</span>, and <span className="font-semibold text-[#1B2150]">ThingsBoard</span> products.
            </p>
            
            <button
              onClick={() => navigate("/application")}
              className="group relative px-8 py-4 bg-[#1B2150] text-white font-bold rounded-xl shadow-2xl hover:shadow-lg hover:bg-[#EB664D] transition-all duration-300"
            >
              <span className="relative z-10 text-lg">Apply for Partnership</span>
            </button>
          </div>
        </div>
      </section>

      {/* Benefits Section with modern card design */}
      <section className="max-w-6xl mx-auto px-6 py-16 bg-white">
        <div className={`text-center mb-16 transform transition-all duration-1000 delay-300 ${
          isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <h3 className="font-semibold text-[#1B2150] mb-2 text-lg tracking-wide">
            Benefits of Partnership
          </h3>
          <h2 className="text-3xl font-black text-[#818181] mb-4">
            Maximize Your Success with
          </h2>
          <h2 className="text-3xl font-black text-[#1B2150]">
            Power Workplace
          </h2>
          <div className="w-32 h-1 bg-[#1B2150] mx-auto mt-6 rounded-full"></div>
        </div>

        <div className={`grid md:grid-cols-3 gap-8 transform transition-all duration-1000 delay-500 ${
          isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          
          {/* Card 1 - Enhanced design with blue focus */}
          <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-[#FAFAFB] overflow-hidden">
            {/* Background on hover */}
            <div className="absolute inset-0 bg-[#1B2150]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Icon with blue styling */}
            <div className="relative z-10 mb-6">
              <div className="w-16 h-16 bg-[#1B2150] rounded-2xl flex items-center justify-center shadow-lg group-hover:bg-[#EB664D] transition-colors duration-300">
                <Percent className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <div className="relative z-10">
              <h4 className="font-bold text-xl mb-4 text-[#818181] group-hover:text-[#1B2150] transition-colors">
                Tiered Discounts
              </h4>
              <p className="text-[#818181] leading-relaxed">
                Unlock increasing discounts based on your partnership level, maximizing your profitability with every tier advancement.
              </p>
            </div>
            
            {/* Bottom accent line with orange accent */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-[#EB664D] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </div>

          {/* Card 2 */}
          <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-[#FAFAFB] overflow-hidden">
            <div className="absolute inset-0 bg-[#1B2150]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative z-10 mb-6">
              <div className="w-16 h-16 bg-[#5F6485] rounded-2xl flex items-center justify-center shadow-lg group-hover:bg-[#EB664D] transition-colors duration-300">
                <Headphones className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <div className="relative z-10">
              <h4 className="font-bold text-xl mb-4 text-[#818181] group-hover:text-[#1B2150] transition-colors">
                Technical Support
              </h4>
              <p className="text-[#818181] leading-relaxed">
                Receive dedicated technical support from our expert team to ensure seamless implementations and ongoing success.
              </p>
            </div>
            
            <div className="absolute bottom-0 left-0 w-full h-1 bg-[#EB664D] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </div>

          {/* Card 3 */}
          <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-[#FAFAFB] overflow-hidden">
            <div className="absolute inset-0 bg-[#1B2150]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative z-10 mb-6">
              <div className="w-16 h-16 bg-[#1B2150] rounded-2xl flex items-center justify-center shadow-lg group-hover:bg-[#EB664D] transition-colors duration-300">
                <Package className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <div className="relative z-10">
              <h4 className="font-bold text-xl mb-4 text-[#818181] group-hover:text-[#1B2150] transition-colors">
                Product Access
              </h4>
              <p className="text-[#818181] leading-relaxed">
                Gain access to our comprehensive suite of products and solutions to meet your clients' diverse and evolving needs.
              </p>
            </div>
            
            <div className="absolute bottom-0 left-0 w-full h-1 bg-[#EB664D] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </div>
        </div>
      </section>

      {/* Footer with enhanced styling */}
      <footer className={`border-t bg-[#FAFAFB] mt-20 transform transition-all duration-1000 delay-700 ${
        isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex justify-center items-center">
            <div className="text-[#818181] font-medium text-center">
              © 2025 by Power Workplace.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;