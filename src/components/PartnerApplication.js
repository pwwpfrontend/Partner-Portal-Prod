import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/auth";
import { Building2, User, Upload, FileCheck, CheckCircle } from "lucide-react";

const PartnerApplication = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    companyAddress: "",
    businessType: "",
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

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateStep = (currentStep) => {
    switch (currentStep) {
      case 1:
        return formData.companyName.trim() && formData.companyAddress.trim() && formData.businessType.trim();
      case 2:
        return formData.contactName.trim() && formData.email.trim() && formData.phone.trim() && formData.position.trim() && formData.password.trim();
      case 3:
        return certificateFile !== null;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    } else {
      setSubmitError("Please fill in all required fields before continuing.");
    }
  };

  const handlePrevious = () => {
    setSubmitError("");
    setStep(step - 1);
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

    if (!certificateFile) {
      setSubmitError("Please upload your Business Registration Certificate.");
      return;
    }
    if (!ndaAgreed) {
      setSubmitError("Please agree to the NDA terms to continue.");
      return;
    }

    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append("companyName", formData.companyName);
      fd.append("companyAddress", formData.companyAddress);
      fd.append("businessType", formData.businessType);
      fd.append("bussinessType", formData.businessType);
      fd.append("contactPersonName", formData.contactName);
      fd.append("phoneNumber", formData.phone);
      fd.append("email", formData.email);
      fd.append("password", formData.password);
      fd.append("position", formData.position);
      fd.append("certificate", certificateFile);

      await api.post("/auth/register", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setStep(5);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to submit application";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: "Company Info", icon: Building2 },
    { number: 2, title: "Contact Details", icon: User },
    { number: 3, title: "Documentation", icon: Upload },
    { number: 4, title: "Agreement", icon: FileCheck }
  ];

  return (
    <div className="bg-white min-h-screen font-sans text-[#818181]">
      {/* Animated background elements */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-[#1B2150]/5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#5F6485]/10 rounded-full blur-3xl animate-pulse"></div>
      
      {/* Header */}
      <header className="w-full border-b backdrop-blur-sm bg-white/90 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-[#1B2150]/10 rounded-full blur-md"></div>
              <img src="/logo192.png" alt="Partner's Marketplace Logo" className="h-10 w-10 relative z-10 drop-shadow-lg" />
            </div>
            <span className="font-semibold text-lg text-[#1B2150]">
              Power Workplace Partner's Marketplace
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
                        type="text"
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
                        onChange={(e) => setNdaAgreed(e.target.checked)} 
                        className="mt-1 h-4 w-4 text-[#1B2150] rounded focus:ring-[#1B2150]" 
                      />
                      <label htmlFor="nda" className="text-base text-[#818181] leading-relaxed">
                        I agree to the terms of the <a href="#" className="text-[#1B2150] underline font-semibold hover:text-[#EB664D]">Non-Disclosure Agreement</a> and partnership terms. I understand that all shared information will be kept confidential and used solely for partnership evaluation purposes.
                      </label>
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
                      className="px-6 py-2 bg-[#1B2150] text-white rounded-xl text-base font-semibold hover:bg-[#EB664D] hover:shadow-lg transition-all duration-200 disabled:opacity-60"
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
                      <span className="font-mono text-[#1B2150]">support@workplace.com</span>
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