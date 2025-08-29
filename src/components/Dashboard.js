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
          href: '/admin/products',
          gradient: 'from-[#405952] to-[#30423f]'
        },
        {
          title: 'User Management',
          description: 'Manage users, roles and partnership levels',
          icon: Users,
          href: '/admin/users',
          gradient: 'from-[#405952] to-[#30423f]'
        },
        {
          title: 'Quotes',
          description: 'Manage comprehensive quotes',
          icon: FileText,
          href: '/request-quote',
          gradient: 'from-[#405952] to-[#30423f]'
        }
      ];
    } else if (currentRole === 'professional' || currentRole === 'expert' || currentRole === 'master') {
      return [
        {
          title: 'Products',
          description: 'Browse our comprehensive product catalog',
          icon: Package,
          href: '/products',
          gradient: 'from-[#405952] to-[#30423f]'
        },
        {
          title: 'Support',
          description: 'Get dedicated technical support assistance',
          icon: MessageSquare,
          href: '/support',
          gradient: 'from-[#405952] to-[#30423f]'
        },
        {
          title: 'Quotes',
          description: 'Create quotes ',
          icon: FileText,
          href: '/request-quote',
          gradient: 'from-[#405952] to-[#30423f]'
        }
      ];
    }

    return [
      {
        title: 'Products',
        description: 'Browse our comprehensive product catalog',
        icon: Package,
        href: '/products',
        gradient: 'from-[#405952] to-[#30423f]'
      },
      {
        title: 'Support',
        description: 'Get dedicated technical support assistance',
        icon: MessageSquare,
        href: '/support',
        gradient: 'from-[#405952] to-[#30423f]'
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
        color: 'text-[#405952]',
        bgGradient: 'from-[#405952]/10 via-[#405952]/5 to-white'
      },
      professional: {
        name: 'Professional Partner',
        description: 'Access to products with professional-tier discount rates and premium support',
        icon: Shield,
        color: 'text-[#405952]',
        bgGradient: 'from-[#405952]/10 via-[#405952]/5 to-white'
      },
      expert: {
        name: 'Expert Partner',
        description: 'Enhanced access to products and quotes with expert-level discounts',
        icon: User,
        color: 'text-[#405952]',
        bgGradient: 'from-[#405952]/10 via-[#405952]/5 to-white'
      },
      master: {
        name: 'Master Partner',
        description: 'Premium access with discount rates and support',
        icon: Crown,
        color: 'text-[#405952]',
        bgGradient: 'from-[#405952]/10 via-[#405952]/5 to-white'
      }
    };

    return roleInfo[currentRole] || roleInfo.professional;
  };

  const quickLinks = getQuickLinks();
  const roleInfo = getRoleInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <Header toggleSidebar={toggleSidebar} />
      
      {/* Subtle background elements for depth */}
      <div className="fixed top-32 left-20 w-96 h-96 bg-[#405952]/3 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-20 right-20 w-72 h-72 bg-[#405952]/2 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Main content */}
      <main className="pt-16 relative z-10">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className={`mb-8 transform transition-all duration-1000 ${
            isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
            <div className={`bg-gradient-to-br ${roleInfo.bgGradient} rounded-2xl p-6 border border-[#405952]/10 shadow-xl backdrop-blur-sm relative overflow-hidden`}>
              {/* Enhanced decorative elements */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full blur-xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#405952]/5 rounded-full blur-xl"></div>
              
              <div className="relative z-10">
                <div className="mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-3xl font-black bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        Welcome back!
                      </h1>
                    </div>
                    <p className="text-lg font-semibold bg-gradient-to-r from-[#405952] to-[#30423f] bg-clip-text text-transparent">
                      You're logged in as a {roleInfo.name}
                    </p>
                  </div>
                </div>
                <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                  <p className="text-gray-700 leading-relaxed">
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
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Quick Actions</h2>
              <div className="h-1 flex-1 bg-gradient-to-r from-[#405952] to-transparent rounded-full opacity-60"></div>
              <TrendingUp className="w-6 h-6 text-[#405952]" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickLinks.map((link, index) => {
                const LinkIcon = link.icon;
                return (
                  <Link
                    key={index}
                    to={link.href}
                    className={`group bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100/50 relative overflow-hidden backdrop-blur-sm transform transition-all duration-700 delay-${(index + 1) * 200} ${
                      isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                    }`}
                  >
                    {/* Gradient background on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#405952]/5 to-[#30423f]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-[#405952]/20 rounded-xl blur-sm"></div>
                          <div className={`relative p-3 bg-gradient-to-br ${link.gradient} rounded-xl shadow-lg transform group-hover:scale-110 transition-all duration-300`}>
                            <LinkIcon className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-[#405952] opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-[#405952] transition-colors duration-300">
                          {link.title}
                        </h3>
                        <p className="text-gray-600 leading-relaxed text-sm">
                          {link.description}
                        </p>
                      </div>
                      
                      {/* Bottom accent line */}
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#405952] to-[#30423f] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
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