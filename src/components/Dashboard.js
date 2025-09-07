import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { 
  Package, 
  Settings, 
  Users, 
  FileText, 
  MessageSquare, 
  TrendingUp,
  Shield,
  Crown,
  Building,
  User,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Dashboard = () => {
  console.log('Dashboard component rendering');
  const { currentRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  console.log('Dashboard currentRole:', currentRole);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Role-specific quick links
  const getQuickLinks = () => {
    if (currentRole === 'admin') {
      return [
        {
          title: 'Product Management',
          description: 'Manage products and pricing with full administrative control',
          icon: Settings,
          href: '/admin/products'
        },
        {
          title: 'User Management',
          description: 'Manage users, roles and partnership levels',
          icon: Users,
          href: '/admin/users'
        },
        {
          title: 'Quotes',
          description: 'Manage comprehensive quotes',
          icon: FileText,
          href: '/request-quote'
        }
      ];
    } else if (currentRole === 'professional' || currentRole === 'expert' || currentRole === 'master') {
      return [
        {
          title: 'Products',
          description: 'Browse our comprehensive product catalog',
          icon: Package,
          href: '/products'
        },
        {
          title: 'Support',
          description: 'Get dedicated technical support assistance',
          icon: MessageSquare,
          href: '/support'
        },
        {
          title: 'Quotes',
          description: 'Create quotes ',
          icon: FileText,
          href: '/request-quote'
        }
      ];
    }

    return [
      {
        title: 'Products',
        description: 'Browse our comprehensive product catalog',
        icon: Package,
        href: '/products'
      },
      {
        title: 'Support',
        description: 'Get dedicated technical support assistance',
        icon: MessageSquare,
        href: '/support'
      }
    ];
  };

  // Role display information
  const getRoleInfo = () => {
    const roleInfo = {
      admin: {
        name: 'Administrator',
        description: 'Full system access with complete product and user management capabilities',
        icon: Crown,
        color: 'text-[#1B2150]'
      },
      professional: {
        name: 'Professional Partner',
        description: 'Access to products with professional-tier discount rates and premium support',
        icon: Shield,
        color: 'text-[#1B2150]'
      },
      expert: {
        name: 'Expert Partner',
        description: 'Enhanced access to products and quotes with expert-level discounts',
        icon: User,
        color: 'text-[#1B2150]'
      },
      master: {
        name: 'Master Partner',
        description: 'Premium access with discount rates and support',
        icon: Crown,
        color: 'text-[#1B2150]'
      }
    };

    return roleInfo[currentRole] || roleInfo.professional;
  };

  const quickLinks = getQuickLinks();
  const roleInfo = getRoleInfo();

  return (
    <div className="min-h-screen bg-[#FAFAFB] font-sans text-[#818181]">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <Header toggleSidebar={toggleSidebar} />
      
      {/* Animated background elements */}
      <div className="fixed top-32 left-20 w-96 h-96 bg-[#1B2150]/5 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
      <div className="fixed bottom-20 right-20 w-80 h-80 bg-[#5F6485]/5 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
      
      {/* Main content */}
      <main className="pt-16 relative z-10">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className={`mb-8 transform transition-all duration-1000 ${
            isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
            <div className="bg-white rounded-2xl p-8 border border-[#FAFAFB] shadow-lg relative overflow-hidden">
              {/* Decorative accent line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-[#1B2150]"></div>
              
              {/* Subtle decorative elements */}
              <div className="absolute top-2 right-2 w-16 h-16 bg-[#FAFAFB] rounded-full blur-xl"></div>
              <div className="absolute bottom-2 left-2 w-20 h-20 bg-[#FAFAFB] rounded-full blur-xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-6 mb-6">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-[#FAFAFB] rounded-xl blur-sm"></div>
                    <div className="relative p-3 bg-[#1B2150] hover:bg-[#EB664D] transition-colors duration-300 rounded-xl shadow-md">
                      <roleInfo.icon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-[#1B2150] mb-1">
                      Welcome back!
                    </h1>
                    <p className="text-lg font-semibold text-[#1B2150]">
                      You're logged in as a {roleInfo.name}
                    </p>
                  </div>
                </div>
                <div className="bg-[#FAFAFB] rounded-xl p-4 border border-[#FAFAFB]">
                  <p className="text-[#818181] leading-relaxed">
                    {roleInfo.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className={`mb-8 transform transition-all duration-1000 delay-300 ${
            isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
            <div className="flex items-center gap-3 mb-8 justify-center">
              <div className="h-1 flex-1 bg-[#1B2150] rounded-full opacity-60"></div>
              <h2 className="text-2xl font-bold text-[#1B2150]">Quick Actions</h2>
              <TrendingUp className="w-6 h-6 text-[#1B2150]" />
              <div className="h-1 flex-1 bg-[#1B2150] rounded-full opacity-60"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickLinks.map((link, index) => {
                const LinkIcon = link.icon;
                return (
                  <Link
                    key={index}
                    to={link.href}
                    className={`group bg-white hover:bg-[#FAFAFB] rounded-3xl shadow-2xl p-8 hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-[#FAFAFB] hover:border-[#EB664D] relative overflow-hidden transform transition-all duration-700 delay-${(index + 1) * 200} ${
                      isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                    }`}
                  >
                    {/* Decorative accent line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#EB664D] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-6">
                        <div className="relative">
                          <div className="absolute inset-0 bg-[#FAFAFB] rounded-2xl blur-md"></div>
                          <div className="relative p-4 bg-[#1B2150] group-hover:bg-[#EB664D] rounded-2xl shadow-lg transform group-hover:scale-110 transition-all duration-300">
                            <LinkIcon className="w-8 h-8 text-white" />
                          </div>
                        </div>
                        <ArrowRight className="w-6 h-6 text-[#1B2150] group-hover:text-[#EB664D] opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                      </div>
                      
                      <div className="space-y-3">
                        <h3 className="text-xl font-bold text-[#1B2150] group-hover:text-[#1B2150] transition-colors duration-300">
                          {link.title}
                        </h3>
                        <p className="text-[#818181] leading-relaxed">
                          {link.description}
                        </p>
                      </div>
                      
                      {/* Bottom accent line */}
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-[#EB664D] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-b-3xl"></div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;