import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/auth";
import { User, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";

// reCAPTCHA v2 configuration
const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || "6Ld7QMwrAAAAANZke_5BTI-knhtlI2TQ33cYpbdA";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const [recaptchaError, setRecaptchaError] = useState("");
  const recaptchaRef = useRef(null);
  const [recaptchaWidgetId, setRecaptchaWidgetId] = useState(null);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [recaptchaTimeout, setRecaptchaTimeout] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Load reCAPTCHA v2 script and render widget
  useEffect(() => {
    const loadRecaptcha = () => {
      if (window.grecaptcha) {
        setRecaptchaLoaded(true);
        setRecaptchaError("");
        setRecaptchaTimeout(false);
        console.debug("[recaptcha] grecaptcha already present");
        return;
      }

      // Check if script is already being loaded
      const existingScript = document.querySelector(`script[src*="recaptcha/api.js"]`);
      if (existingScript) {
        console.debug("[recaptcha] script already exists, waiting for load");
        return;
      }

      // Set a timeout to handle cases where reCAPTCHA fails to load
      const timeoutId = setTimeout(() => {
        if (!window.grecaptcha) {
          setRecaptchaTimeout(true);
          setRecaptchaError("reCAPTCHA is taking too long to load. Please refresh the page or check your internet connection.");
          console.debug("[recaptcha] timeout waiting for script to load");
        }
      }, 10000); // 10 second timeout

      const script = document.createElement('script');
      script.src = "https://www.google.com/recaptcha/api.js";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        clearTimeout(timeoutId);
        setRecaptchaLoaded(true);
        setRecaptchaError("");
        setRecaptchaTimeout(false);
        console.debug("[recaptcha] v2 script loaded");
      };
      script.onerror = () => {
        clearTimeout(timeoutId);
        setRecaptchaError("Failed to load reCAPTCHA. Please check your internet connection and try again.");
        setRecaptchaLoaded(false);
        setRecaptchaTimeout(true);
        console.debug("[recaptcha] script failed to load");
      };
      document.head.appendChild(script);
    };

    loadRecaptcha();

    return () => {
      // Cleanup on unmount: reset widget and remove script
      try {
        if (window.grecaptcha && recaptchaWidgetId !== null) {
          window.grecaptcha.reset(recaptchaWidgetId);
        }
      } catch {}
      const existingScript = document.querySelector(`script[src*="recaptcha/api.js"]`);
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  // Render widget when component is loaded and script is loaded
  useEffect(() => {
    if (
      isLoaded &&
      recaptchaLoaded &&
      window.grecaptcha &&
      recaptchaRef.current &&
      recaptchaWidgetId === null
    ) {
      // Add a small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        try {
          if (recaptchaRef.current && window.grecaptcha) {
            const id = window.grecaptcha.render(recaptchaRef.current, {
              sitekey: RECAPTCHA_SITE_KEY,
              size: "normal",
              callback: (token) => {
                setRecaptchaToken(token);
              },
              "expired-callback": () => {
                setRecaptchaToken(null);
              }
            });
            setRecaptchaWidgetId(id);
          }
        } catch (err) {
          console.debug('[recaptcha] deferred render error', err);
          setRecaptchaError("Failed to render reCAPTCHA. Please refresh the page.");
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isLoaded, recaptchaLoaded, recaptchaWidgetId]);

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
    setRecaptchaError("");

    // For development, allow submission without reCAPTCHA if it fails to load
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (recaptchaTimeout && !isDevelopment) {
      setError("reCAPTCHA failed to load. Please refresh the page and try again.");
      return;
    }
    if (!recaptchaLoaded && !isDevelopment) {
      setError("reCAPTCHA is still loading. Please wait a moment and try again.");
      return;
    }
    if (!recaptchaToken && !isDevelopment) {
      setError("Please complete the reCAPTCHA checkbox to verify you are human.");
      return;
    }

    setLoading(true);
    try {
      const { email, password } = formData;
      const result = await login(email, password, recaptchaToken);
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
      
      {/* Centered Login Form */}
      <div className={`flex items-center justify-center min-h-screen px-8 transform transition-all duration-1000 ${
        isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}>
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-[#FAFAFB] relative overflow-hidden">
          {/* Decorative top accent */}
          <div className="absolute top-0 left-0 w-full h-2 bg-[#1B2150]"></div>
          
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#1B2150] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[#1B2150] mb-2">Welcome Back</h2>
            <p className="text-[#818181] text-sm">Sign in to your partner account</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block mb-2 text-sm font-semibold text-[#1B2150]">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full border-2 border-[#FAFAFB] rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-[#1B2150] transition-all duration-200 bg-[#FAFAFB] hover:bg-white text-[#818181]"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-semibold text-[#1B2150]">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full border-2 border-[#FAFAFB] rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-[#1B2150] transition-all duration-200 bg-[#FAFAFB] hover:bg-white pr-12 text-[#818181]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#818181] hover:text-[#1B2150] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-[#1B2150] rounded focus:ring-[#1B2150] border-[#FAFAFB]"
                />
                <label htmlFor="remember" className="text-sm text-[#818181] font-medium">
                  Remember me
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm text-[#1B2150] font-semibold hover:text-[#EB664D] transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* reCAPTCHA v2 Widget & Status */}
            <div className="flex flex-col items-center space-y-2">
              <div ref={recaptchaRef} className="my-2" aria-hidden={!!recaptchaToken ? "false" : "true"}></div>
              {recaptchaError && (
                <div className="text-[#EB664D] text-sm font-medium text-center bg-[#EB664D]/10 border border-[#EB664D]/30 rounded-lg p-3">
                  {recaptchaError}
                  {recaptchaTimeout && (
                    <button 
                      onClick={() => window.location.reload()} 
                      className="ml-2 underline hover:no-underline"
                    >
                      Refresh Page
                    </button>
                  )}
                </div>
              )}
              {!recaptchaLoaded && !recaptchaError && !recaptchaTimeout && (
                <div className="text-[#818181] text-sm text-center">
                  Loading reCAPTCHA...
                </div>
              )}
            </div>

            {error && (
              <div className="bg-[#EB664D]/10 border border-[#EB664D]/30 rounded-xl p-3">
                <div className="text-[#EB664D] font-medium text-sm">{error}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1B2150] text-white py-3 rounded-xl text-base font-semibold hover:bg-[#EB664D] hover:shadow-lg transition-all duration-200 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="text-center mt-6 pt-4 border-t border-[#FAFAFB]">
            <p className="text-[#818181] text-sm">
              New Partner?{" "}
              <Link
                to="/application"
                className="text-[#1B2150] font-semibold hover:text-[#EB664D] transition-colors"
              >
                Apply Here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;