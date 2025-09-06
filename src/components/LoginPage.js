import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/auth";
import { User, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { email, password } = formData;
      const result = await login(email, password);
      console.log('Login result:', result);
      
      if (result?.role) {
        // Role-based redirection mapped to existing routes
        const roleRoutes = {
          admin: "/admin/products",
          professional: "/dashboard",
          expert: "/dashboard",
          master: "/dashboard"
        };
        
        const targetRoute = roleRoutes[result.role];
        if (targetRoute) {
          console.log(`Navigating to ${targetRoute} for role: ${result.role}`);
          navigate(targetRoute, { replace: true });
        } else {
          console.log(`No specific route for role: ${result.role}, falling back to dashboard`);
          navigate("/dashboard", { replace: true });
        }
      } else {
        console.log('No role received, navigating to dashboard');
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Invalid credentials";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  return (
    <div className="bg-white min-h-screen font-sans text-[#818181]">
      {/* Animated background elements */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-[#1B2150]/5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#5F6485]/10 rounded-full blur-3xl animate-pulse"></div>
      
      {/* Back to Home Button */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={handleBackToHome}
          className="flex items-center space-x-2 px-4 py-2 bg-[#FAFAFB] text-[#818181] rounded-lg hover:bg-[#1B2150] hover:text-white transition-all duration-200 border border-[#FAFAFB] hover:border-[#1B2150]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="font-medium">Back</span>
        </button>
      </div>
      
      <div className={`flex min-h-screen transform transition-all duration-1000 ${
        isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}>
        {/* Left Section - Login Form */}
        <div className="flex flex-1 items-center justify-center px-8 relative z-10">
          <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl p-10 border border-[#FAFAFB] relative overflow-hidden">
            {/* Decorative top accent */}
            <div className="absolute top-0 left-0 w-full h-2 bg-[#1B2150]"></div>
            
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-[#1B2150] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <User className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-[#1B2150] mb-3">Welcome Back</h2>
              <p className="text-[#818181]">Sign in to your partner account</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block mb-3 text-sm font-semibold text-[#1B2150]">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full border-2 border-[#FAFAFB] rounded-xl px-6 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-[#1B2150] transition-all duration-200 bg-[#FAFAFB] hover:bg-white text-[#818181]"
                  required
                />
              </div>

              <div>
                <label className="block mb-3 text-sm font-semibold text-[#1B2150]">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full border-2 border-[#FAFAFB] rounded-xl px-6 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-[#1B2150] transition-all duration-200 bg-[#FAFAFB] hover:bg-white pr-14 text-[#818181]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#818181] hover:text-[#1B2150] transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="remember"
                    name="remember"
                    checked={formData.remember}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-[#1B2150] rounded focus:ring-[#1B2150] border-[#FAFAFB]"
                  />
                  <label htmlFor="remember" className="text-sm text-[#818181] font-medium">
                    Remember me
                  </label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm text-[#1B2150] font-semibold hover:text-[#E22400] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {error && (
                <div className="bg-[#E22400]/10 border border-[#E22400]/30 rounded-xl p-4">
                  <div className="text-[#E22400] font-medium">{error}</div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1B2150] text-white py-4 rounded-xl text-lg font-semibold hover:bg-[#E22400] hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-60 disabled:transform-none disabled:hover:shadow-none"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="text-center mt-8 pt-6 border-t border-[#FAFAFB]">
              <p className="text-[#818181]">
                New Partner?{" "}
                <Link
                  to="/application"
                  className="text-[#1B2150] font-semibold hover:text-[#E22400] transition-colors"
                >
                  Apply Here
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right Section - Logo & Branding */}
        <div className="hidden md:flex flex-1 items-center justify-center bg-[#FAFAFB] relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute top-10 right-20 w-32 h-32 bg-[#1B2150]/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 left-10 w-40 h-40 bg-[#E22400]/10 rounded-full blur-2xl"></div>
          
          <div className="flex flex-col items-center text-center relative z-10">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-[#1B2150]/20 rounded-full blur-lg opacity-30 scale-110"></div>
              <img
                src="/logo192.png"
                alt="Partner’s Marketplace Logo"
                className="h-40 w-40 relative z-10 drop-shadow-2xl"
              />
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-bold text-[#1B2150]">
                Partner’s Marketplace
              </h3>
              <p className="text-xl text-[#818181] font-medium">Power Workplace</p>
              <div className="mt-8 space-y-2 text-[#818181]">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-[#1B2150] rounded-full"></div>
                  <span>Secure Partner Access</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-[#E22400] rounded-full"></div>
                  <span>Exclusive Resources</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;