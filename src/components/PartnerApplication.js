import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../services/auth";
import { Building2, User, Upload, FileCheck, CheckCircle } from "lucide-react";

// reCAPTCHA v2 configuration
// IMPORTANT: Set your site key in env `REACT_APP_RECAPTCHA_SITE_KEY` for production.
// The fallback is for local/dev only. Replace the endpoint in handleSubmit as needed.
const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || "6Ld7QMwrAAAAANZke_5BTI-knhtlI2TQ33cYpbdA";

const PartnerApplication = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    companyAddress: "",
    businessType: "",
    country: "",
    contactName: "",
    email: "",
    phone: "",
    position: "",
    password: ""
  });
  const [certificateFile, setCertificateFile] = useState(null);
  const [ndaAgreed, setNdaAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const [recaptchaError, setRecaptchaError] = useState("");
  const recaptchaRef = useRef(null);
  const [recaptchaWidgetId, setRecaptchaWidgetId] = useState(null);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [recaptchaTimeout, setRecaptchaTimeout] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Load form data from localStorage on component mount
  useEffect(() => {
    const savedFormData = localStorage.getItem('partnerApplicationFormData');
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        setFormData(parsedData);
      } catch (error) {
        console.error('Error parsing saved form data:', error);
      }
    }

    const savedNdaAgreed = localStorage.getItem('partnerApplicationNdaAgreed');
    if (savedNdaAgreed === 'true') {
      setNdaAgreed(true);
    }

    const savedStep = localStorage.getItem('partnerApplicationStep');
    if (savedStep) {
      const stepNumber = parseInt(savedStep);
      if (stepNumber >= 1 && stepNumber <= 4) {
        setStep(stepNumber);
      }
    }
  }, []);

  // Check if NDA was accepted and set the checkbox, or handle step parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('ndaAccepted') === 'true') {
      setNdaAgreed(true);
      saveNdaAgreedToStorage(true);
      setStep(4); // Go to the agreement step
      saveStepToStorage(4);
    } else if (urlParams.get('step')) {
      const stepNumber = parseInt(urlParams.get('step'));
      if (stepNumber >= 1 && stepNumber <= 4) {
        setStep(stepNumber);
        saveStepToStorage(stepNumber);
      }
    }
  }, [location.search]);

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

  // Render widget when step 4 is visible and script is loaded
  useEffect(() => {
    if (
      step === 4 &&
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
  }, [step, recaptchaLoaded, recaptchaWidgetId]);

  // v2 checkbox flow does not require programmatic execution

  // Function to save form data to localStorage
  const saveFormDataToStorage = (data) => {
    try {
      localStorage.setItem('partnerApplicationFormData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving form data to localStorage:', error);
    }
  };

  // Function to save step to localStorage
  const saveStepToStorage = (stepNumber) => {
    try {
      localStorage.setItem('partnerApplicationStep', stepNumber.toString());
    } catch (error) {
      console.error('Error saving step to localStorage:', error);
    }
  };

  // Function to save NDA agreement status to localStorage
  const saveNdaAgreedToStorage = (agreed) => {
    try {
      localStorage.setItem('partnerApplicationNdaAgreed', agreed.toString());
    } catch (error) {
      console.error('Error saving NDA agreement to localStorage:', error);
    }
  };

  // Function to clear all form data from localStorage
  const clearFormDataFromStorage = () => {
    try {
      localStorage.removeItem('partnerApplicationFormData');
      localStorage.removeItem('partnerApplicationNdaAgreed');
      localStorage.removeItem('partnerApplicationStep');
    } catch (error) {
      console.error('Error clearing form data from localStorage:', error);
    }
  };

  const handleChange = (e) => {
    const newFormData = { ...formData, [e.target.name]: e.target.value };
    setFormData(newFormData);
    saveFormDataToStorage(newFormData);
    setSubmitError(""); // Clear error when user starts typing
  };

  // Input validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const validateStep = (currentStep) => {
    setSubmitError("");
    
    switch (currentStep) {
      case 1:
        if (!formData.companyName.trim()) {
          setSubmitError("Company name is required.");
          return false;
        }
        if (!formData.companyAddress.trim()) {
          setSubmitError("Company address is required.");
          return false;
        }
        if (!formData.businessType.trim()) {
          setSubmitError("Business type is required.");
          return false;
        }
        if (!formData.country.trim()) {
          setSubmitError("Country is required.");
          return false;
        }
        return true;
        
      case 2:
        if (!formData.contactName.trim()) {
          setSubmitError("Contact person's name is required.");
          return false;
        }
        if (!formData.email.trim()) {
          setSubmitError("Email address is required.");
          return false;
        }
        if (!validateEmail(formData.email)) {
          setSubmitError("Please enter a valid email address.");
          return false;
        }
        if (!formData.phone.trim()) {
          setSubmitError("Phone number is required.");
          return false;
        }
        if (!validatePhone(formData.phone)) {
          setSubmitError("Please enter a valid phone number.");
          return false;
        }
        if (!formData.position.trim()) {
          setSubmitError("Position in company is required.");
          return false;
        }
        if (!formData.password.trim()) {
          setSubmitError("Password is required.");
          return false;
        }
        if (!validatePassword(formData.password)) {
          setSubmitError("Password must be at least 6 characters long.");
          return false;
        }
        return true;
        
      case 3:
        if (!certificateFile) {
          setSubmitError("Business registration certificate is required.");
          return false;
        }
        return true;
        
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      const nextStep = step + 1;
      setStep(nextStep);
      saveStepToStorage(nextStep);
    }
  };

  const handlePrevious = () => {
    setSubmitError("");
    const prevStep = step - 1;
    setStep(prevStep);
    saveStepToStorage(prevStep);
  };

  const handleBack = () => navigate(-1);
  
  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setSubmitError("");
    
    if (file) {
      // Check file type
      if (file.type !== 'application/pdf') {
        setSubmitError("Please upload only PDF files.");
        setCertificateFile(null);
        return;
      }
      
      // Check file size (20MB = 20 * 1024 * 1024 bytes)
      if (file.size > 20 * 1024 * 1024) {
        setSubmitError("File size must be less than 20MB.");
        setCertificateFile(null);
        return;
      }
    }
    
    setCertificateFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setRecaptchaError("");

    if (!certificateFile) {
      setSubmitError("Please upload your Business Registration Certificate.");
      return;
    }
    if (!ndaAgreed) {
      setSubmitError("Please agree to the NDA terms to continue.");
      return;
    }
    // For development, allow submission without reCAPTCHA if it fails to load
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (recaptchaTimeout && !isDevelopment) {
      setSubmitError("reCAPTCHA failed to load. Please refresh the page and try again.");
      return;
    }
    if (!recaptchaLoaded && !isDevelopment) {
      setSubmitError("reCAPTCHA is still loading. Please wait a moment and try again.");
      return;
    }
    if (!recaptchaToken && !isDevelopment) {
      setSubmitError("Please complete the reCAPTCHA checkbox to verify you are human.");
      return;
    }

    try {
      setSubmitting(true);
      console.debug("[submit] starting submission...");
      
      console.debug("[submit] got recaptcha token, preparing payload");
      
      const fd = new FormData();
      fd.append("companyName", formData.companyName);
      fd.append("companyAddress", formData.companyAddress);
      fd.append("businessType", formData.businessType);
      fd.append("bussinessType", formData.businessType);
      fd.append("country", formData.country);
      fd.append("contactPersonName", formData.contactName);
      fd.append("phoneNumber", formData.phone);
      fd.append("email", formData.email);
      fd.append("password", formData.password);
      fd.append("position", formData.position);
      fd.append("certificate", certificateFile);
      if (recaptchaToken) {
      fd.append("recaptchaToken", recaptchaToken);
      fd.append("g-recaptcha-response", recaptchaToken);
      }

      // TODO: Update the endpoint below to your actual backend handler for partner applications.
      await api.post("/auth/register", fd);
      setStep(5);
      // Clear form data from localStorage after successful submission
      clearFormDataFromStorage();
      // Reset reCAPTCHA after successful submission
      try {
        if (window.grecaptcha && recaptchaWidgetId !== null) {
          window.grecaptcha.reset(recaptchaWidgetId);
          setRecaptchaToken(null);
        }
      } catch {}
    } catch (err) {
      if (err.message && err.message.includes("reCAPTCHA")) {
        setRecaptchaError(err.message);
      } else {
        const msg = err?.response?.data?.message || "Failed to submit application";
        setSubmitError(msg);
      }
    } finally {
      setSubmitting(false);
      console.debug("[submit] submission finished");
    }
  };

  const steps = [
    { number: 1, title: "Company Info", icon: Building2 },
    { number: 2, title: "Contact Details", icon: User },
    { number: 3, title: "Documentation", icon: Upload },
    { number: 4, title: "Agreement", icon: FileCheck }
  ];

  const countries = [
    "Afghanistan", "Albania", "Algeria", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
    "Bahrain", "Bangladesh", "Belarus", "Belgium", "Bolivia", "Bosnia and Herzegovina", "Brazil", "Bulgaria",
    "Cambodia", "Canada", "Chile", "China", "Colombia", "Costa Rica", "Croatia", "Cyprus", "Czech Republic",
    "Denmark", "Dominican Republic", "Ecuador", "Egypt", "Estonia", "Ethiopia", "Finland", "France",
    "Georgia", "Germany", "Ghana", "Greece", "Guatemala", "Honduras", "Hong Kong", "Hungary",
    "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
    "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait", "Latvia", "Lebanon", "Lithuania", "Luxembourg",
    "Malaysia", "Mexico", "Morocco", "Netherlands", "New Zealand", "Nigeria", "Norway",
    "Oman", "Pakistan", "Panama", "Peru", "Philippines", "Poland", "Portugal", "Qatar",
    "Romania", "Russia", "Saudi Arabia", "Singapore", "Slovakia", "Slovenia", "South Africa", "South Korea", "Spain", "Sri Lanka", "Sweden", "Switzerland",
    "Taiwan", "Thailand", "Turkey", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Venezuela", "Vietnam"
  ];

  return (
    <div className="bg-white min-h-screen font-sans text-[#818181]">
      {/* Animated background elements */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-[#1B2150]/5 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#5F6485]/10 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
      
      {/* Header */}
      <header className="w-full border-b backdrop-blur-sm bg-white/90 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-[#1B2150]/10 rounded-full blur-md"></div>
              <img src="/logo192.png" alt="Partner Portal Logo" className="h-10 w-10 relative z-10 drop-shadow-lg" />
            </div>
            <span className="font-semibold text-lg text-[#1B2150]">
              Power Workplace Partner Portal
            </span>
          </div>
          <button
            onClick={handleBack}
            className="px-4 py-2 text-sm font-medium text-[#818181] hover:text-[#1B2150] transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </header>

      <div className={`max-w-4xl mx-auto px-6 py-8 transform transition-all duration-1000 ${
        isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}>
        {/* Progress Steps - More compact */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center space-x-6">
            {steps.map((stepInfo, index) => {
              const IconComponent = stepInfo.icon;
              const isActive = step === stepInfo.number;
              const isCompleted = step > stepInfo.number;
              
              return (
                <div key={stepInfo.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-[#1B2150] text-white shadow-lg' 
                        : isActive 
                          ? 'bg-[#EB664D] text-white shadow-lg animate-pulse' 
                          : 'bg-[#FAFAFB] text-[#818181] border-2 border-[#FAFAFB]'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <IconComponent className="h-6 w-6" />
                      )}
                    </div>
                    <span className={`mt-2 text-xs font-medium ${
                      isActive || isCompleted ? 'text-[#1B2150]' : 'text-[#818181]'
                    }`}>
                      {stepInfo.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-1 mx-3 rounded-full transition-all duration-500 ${
                      step > stepInfo.number 
                        ? 'bg-[#1B2150]' 
                        : 'bg-[#FAFAFB]'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content Area - More compact form */}
        <div className="flex justify-center">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 border border-[#FAFAFB] relative overflow-hidden">
            {/* Decorative top accent */}
            <div className="absolute top-0 left-0 w-full h-2 bg-[#1B2150]"></div>
            
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#1B2150] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#1B2150] mb-2">Company Information</h2>
                  <p className="text-[#818181] text-sm">Tell us about your business</p>
                </div>

                <form className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-[#1B2150]">Company Name *</label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="Enter your company name"
                      className="w-full border-2 border-[#FAFAFB] rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-[#1B2150] transition-all duration-200 bg-[#FAFAFB] hover:bg-white text-[#818181]"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-semibold text-[#1B2150]">Company Address *</label>
                    <input
                      type="text"
                      name="companyAddress"
                      value={formData.companyAddress}
                      onChange={handleChange}
                      placeholder="Enter your complete business address"
                      className="w-full border-2 border-[#FAFAFB] rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-[#1B2150] transition-all duration-200 bg-[#FAFAFB] hover:bg-white text-[#818181]"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-sm font-semibold text-[#1B2150]">Business Type *</label>
                      <select
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleChange}
                        className="w-full border-2 border-[#FAFAFB] rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-[#1B2150] transition-all duration-200 bg-[#FAFAFB] hover:bg-white text-[#818181]"
                      >
                        <option value="">Select your business type</option>
                        <option value="reseller">Reseller</option>
                        <option value="integrator">System Integrator</option>
                        <option value="consultant">Consultant</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-semibold text-[#1B2150]">Country *</label>
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="w-full border-2 border-[#FAFAFB] rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-[#1B2150] transition-all duration-200 bg-[#FAFAFB] hover:bg-white text-[#818181]"
                      >
                        <option value="">Select your country</option>
                        {countries.map((country) => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {submitError && (
                    <div className="bg-[#EB664D]/10 border border-[#EB664D]/30 rounded-xl p-3">
                      <div className="text-[#EB664D] font-medium text-sm">{submitError}</div>
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="px-6 py-2 bg-[#FAFAFB] text-[#818181] rounded-xl text-base font-semibold hover:bg-[#5F6485] hover:text-white transition-all duration-200 border-2 border-transparent hover:border-[#5F6485]"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-6 py-2 bg-[#1B2150] text-white rounded-xl text-base font-semibold hover:bg-[#EB664D] hover:shadow-lg transition-all duration-200"
                    >
                      Continue →
                    </button>
                  </div>
                </form>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#1B2150] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#1B2150] mb-2">Contact Information</h2>
                  <p className="text-[#818181] text-sm">Your primary contact details</p>
                </div>

                <form className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-[#1B2150]">Contact Person's Name *</label>
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleChange}
                      placeholder="Enter full name"
                      className="w-full border-2 border-[#FAFAFB] rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-[#1B2150] transition-all duration-200 bg-[#FAFAFB] hover:bg-white text-[#818181]"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-sm font-semibold text-[#1B2150]">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        className="w-full border-2 border-[#FAFAFB] rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-[#1B2150] transition-all duration-200 bg-[#FAFAFB] hover:bg-white text-[#818181]"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-semibold text-[#1B2150]">Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+1 (555) 000-0000"
                        className="w-full border-2 border-[#FAFAFB] rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-[#1B2150] transition-all duration-200 bg-[#FAFAFB] hover:bg-white text-[#818181]"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-sm font-semibold text-[#1B2150]">Position in Company *</label>
                      <input
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleChange}
                        placeholder="e.g., CEO, Sales Director"
                        className="w-full border-2 border-[#FAFAFB] rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-[#1B2150] transition-all duration-200 bg-[#FAFAFB] hover:bg-white text-[#818181]"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-semibold text-[#1B2150]">Create Password *</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Create a secure password"
                        className="w-full border-2 border-[#FAFAFB] rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-[#1B2150] transition-all duration-200 bg-[#FAFAFB] hover:bg-white text-[#818181]"
                      />
                      <div className="mt-2 text-xs text-[#818181] space-y-1">
                        <p className="font-medium">Password must contain:</p>
                        <div className="grid grid-cols-2 gap-x-4">
                          <div className={`flex items-center space-x-1 ${formData.password.length >= 8 ? 'text-green-600' : 'text-[#818181]'}`}>
                            <span className="w-1 h-1 rounded-full bg-current"></span>
                            <span>8+ characters</span>
                          </div>
                          <div className={`flex items-center space-x-1 ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-[#818181]'}`}>
                            <span className="w-1 h-1 rounded-full bg-current"></span>
                            <span>Uppercase letter</span>
                          </div>
                          <div className={`flex items-center space-x-1 ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-[#818181]'}`}>
                            <span className="w-1 h-1 rounded-full bg-current"></span>
                            <span>Lowercase letter</span>
                          </div>
                          <div className={`flex items-center space-x-1 ${/\d/.test(formData.password) ? 'text-green-600' : 'text-[#818181]'}`}>
                            <span className="w-1 h-1 rounded-full bg-current"></span>
                            <span>Number</span>
                          </div>
                          <div className={`flex items-center space-x-1 col-span-2 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'text-green-600' : 'text-[#818181]'}`}>
                            <span className="w-1 h-1 rounded-full bg-current"></span>
                            <span>Special character (!@#$%^&*)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {submitError && (
                    <div className="bg-[#EB664D]/10 border border-[#EB664D]/30 rounded-xl p-3">
                      <div className="text-[#EB664D] font-medium text-sm">{submitError}</div>
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={handlePrevious}
                      className="px-6 py-2 bg-[#FAFAFB] text-[#818181] rounded-xl text-base font-semibold hover:bg-[#5F6485] hover:text-white transition-all duration-200 border-2 border-transparent hover:border-[#5F6485]"
                    >
                      ← Previous
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-6 py-2 bg-[#1B2150] text-white rounded-xl text-base font-semibold hover:bg-[#EB664D] hover:shadow-lg transition-all duration-200"
                    >
                      Continue →
                    </button>
                  </div>
                </form>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#1B2150] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Upload className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#1B2150] mb-2">Business Documentation</h2>
                  <p className="text-[#818181] text-sm">Upload your business registration certificate</p>
                </div>

                <form className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-[#1B2150]">Business Registration Certificate *</label>
                    <div className="border-2 border-dashed border-[#FAFAFB] rounded-xl p-6 text-center hover:border-[#1B2150] transition-all duration-200 bg-[#FAFAFB] hover:bg-[#1B2150]/5">
                      <Upload className="h-10 w-10 text-[#818181] mx-auto mb-3" />
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        id="certificate-upload"
                      />
                      <label htmlFor="certificate-upload" className="cursor-pointer">
                        <div className="text-base font-semibold text-[#1B2150] mb-2">
                          {certificateFile ? certificateFile.name : "Drop your PDF file here or click to browse"}
                        </div>
                        <div className="text-sm text-[#818181]">
                          Supported format: PDF only (Max 20MB)
                        </div>
                      </label>
                    </div>
                    <div className="mt-2 text-xs text-[#818181] bg-blue-50 border border-blue-200 rounded-lg p-2">
                      <strong>Note:</strong> If you navigate away and return, you'll need to re-upload your file as it cannot be saved automatically.
                    </div>
                  </div>

                  {submitError && (
                    <div className="bg-[#EB664D]/10 border border-[#EB664D]/30 rounded-xl p-3">
                      <div className="text-[#EB664D] font-medium text-sm">{submitError}</div>
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={handlePrevious}
                      className="px-6 py-2 bg-[#FAFAFB] text-[#818181] rounded-xl text-base font-semibold hover:bg-[#5F6485] hover:text-white transition-all duration-200 border-2 border-transparent hover:border-[#5F6485]"
                    >
                      ← Previous
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-6 py-2 bg-[#1B2150] text-white rounded-xl text-base font-semibold hover:bg-[#EB664D] hover:shadow-lg transition-all duration-200"
                    >
                      Continue →
                    </button>
                  </div>
                </form>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#1B2150] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileCheck className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#1B2150] mb-2">Legal Agreement</h2>
                  <p className="text-[#818181] text-sm">Review and accept the partnership terms</p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="bg-[#FAFAFB] rounded-xl p-4 border border-[#FAFAFB]">
                    <div className="flex items-start space-x-3">
                      <input 
                        id="nda" 
                        type="checkbox" 
                        checked={ndaAgreed} 
                        onChange={(e) => {
                          setNdaAgreed(e.target.checked);
                          saveNdaAgreedToStorage(e.target.checked);
                        }} 
                        aria-required="true"
                        className="mt-1 h-4 w-4 text-[#1B2150] rounded focus:ring-[#1B2150]" 
                      />
                      <label htmlFor="nda" className="text-base text-[#818181] leading-relaxed">
                        I agree to the terms of the <button type="button" onClick={() => navigate('/nda')} className="text-[#1B2150] underline font-semibold hover:text-[#EB664D] transition-colors">Non-Disclosure Agreement</button> and partnership terms. I understand that all shared information will be kept confidential and used solely for partnership evaluation purposes.
                      </label>
                    </div>
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

                  {/* Requirements Status */}
                  <div className="bg-[#FAFAFB] rounded-xl p-4 border border-[#FAFAFB]">
                    <h3 className="text-sm font-semibold text-[#1B2150] mb-2">Submission Requirements:</h3>
                    <div className="space-y-1 text-sm text-[#818181]">
                      <div className={`flex items-center space-x-2 ${ndaAgreed ? 'text-green-600' : 'text-[#818181]'}`}>
                        <span className="w-2 h-2 rounded-full bg-current"></span>
                        <span>✓ NDA Agreement accepted</span>
                      </div>
                      <div className={`flex items-center space-x-2 ${(recaptchaLoaded && recaptchaToken) ? 'text-green-600' : 'text-[#818181]'}`}>
                        <span className="w-2 h-2 rounded-full bg-current"></span>
                        <span>✓ reCAPTCHA ready for verification</span>
                      </div>
                    </div>
                  </div>

                  {submitError && (
                    <div className="bg-[#EB664D]/10 border border-[#EB664D]/30 rounded-xl p-3">
                      <div className="text-[#EB664D] font-medium text-sm">{submitError}</div>
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <button 
                      type="button" 
                      onClick={handlePrevious} 
                      className="px-6 py-2 bg-[#FAFAFB] text-[#818181] rounded-xl text-base font-semibold hover:bg-[#5F6485] hover:text-white transition-all duration-200 border-2 border-transparent hover:border-[#5F6485]"
                    >
                      ← Previous
                    </button>
                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="px-6 py-2 bg-[#1B2150] text-white rounded-xl text-base font-semibold hover:bg-[#EB664D] hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {submitting ? "Submitting..." : "Submit Application ✓"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {step === 5 && (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-[#1B2150] rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#1B2150] mb-2">Application Submitted!</h2>
                  <p className="text-lg text-[#818181] mb-4">Your partnership request is under review</p>
                </div>
                
                <div className="bg-[#FAFAFB] rounded-xl p-6 text-left space-y-3">
                  <h3 className="font-bold text-base text-[#1B2150]">What happens next?</h3>
                  <div className="space-y-2 text-[#818181] text-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-[#1B2150] rounded-full"></div>
                      <span>Our team will review your application within 2-3 business days</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-[#1B2150] rounded-full"></div>
                      <span>You'll receive an email notification upon approval</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-[#1B2150] rounded-full"></div>
                      <span>Access to partner resources and pricing will be granted</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-[#EB664D]/20 pt-3 mt-4">
                    <div className="text-sm text-[#818181]">
                      <strong className="text-[#1B2150]">Need help?</strong> Contact our support team at{" "}
                      <span className="font-mono text-[#1B2150]">ask@powerworkplace.com</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => navigate("/login")} 
                  className="px-6 py-2 bg-[#1B2150] text-white rounded-xl text-base font-semibold hover:bg-[#EB664D] hover:shadow-lg transition-all duration-200"
                >
                  Go to Login Portal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerApplication;