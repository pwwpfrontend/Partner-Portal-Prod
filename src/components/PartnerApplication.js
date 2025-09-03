import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/auth";

const PartnerApplication = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // track form step
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => setStep(step + 1);
  const handlePrevious = () => setStep(step - 1);
  const handleBack = () => navigate(-1); // Navigate back to previous page
  
  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
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
      fd.append("bussinessType", formData.businessType); // compatibility with API key spelling
      fd.append("contactPersonName", formData.contactName);
      fd.append("phoneNumber", formData.phone);
      fd.append("email", formData.email);
      fd.append("password", formData.password);
      fd.append("position", formData.position);
      fd.append("certificate", certificateFile);

      await api.post("/auth/register", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setStep(5); // success screen
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to submit application";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen font-sans text-gray-800">
      {/* Header */}
      <header className="w-full border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center space-x-2">
          <img src="/logo192.png" alt="Partner Portal Logo" className="h-8 w-8" />
          <span className="font-medium text-sm">Power Workplace Partner Portal</span>
        </div>
      </header>

      {/* Form Section */}
      <section className="max-w-2xl mx-auto px-6 py-12">
        {step === 1 && (
          <>
            <h2 className="text-center text-2xl font-bold mb-10">Partner Application</h2>
            <form className="space-y-6">
              {/* Company Name */}
              <div>
                <label className="block mb-2 text-sm font-medium">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Enter your company name"
                  className="w-full border rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#405952]"
                />
              </div>

              {/* Company Address */}
              <div>
                <label className="block mb-2 text-sm font-medium">Company Address</label>
                <input
                  type="text"
                  name="companyAddress"
                  value={formData.companyAddress}
                  onChange={handleChange}
                  placeholder="Enter your company address"
                  className="w-full border rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#405952]"
                />
              </div>

              {/* Business Type */}
              <div>
                <label className="block mb-2 text-sm font-medium">Business Type</label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  className="w-full border rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#405952]"
                >
                  <option value="">Select business type</option>
                  <option value="reseller">Reseller</option>
                  <option value="integrator">System Integrator</option>
                  <option value="consultant">Consultant</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-5 py-2 bg-gray-100 rounded-md text-sm font-medium hover:bg-gray-200"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-[#405952] text-white rounded-md text-sm font-medium hover:bg-[#30423f]"
                >
                  Next
                </button>
              </div>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-center text-2xl font-bold mb-10">Contact Information</h2>
            <form className="space-y-6">
              {/* Contact Name */}
              <div>
                <label className="block mb-2 text-sm font-medium">Contact Person's Name</label>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  className="w-full border rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#405952]"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block mb-2 text-sm font-medium">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  className="w-full border rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#405952]"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block mb-2 text-sm font-medium">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className="w-full border rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#405952]"
                />
              </div>

              {/* Position */}
              <div>
                <label className="block mb-2 text-sm font-medium">Position in Company</label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  placeholder="Enter your position"
                  className="w-full border rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#405952]"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block mb-2 text-sm font-medium">Create Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Set a password"
                  className="w-full border rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#405952]"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="px-5 py-2 bg-gray-100 rounded-md text-sm font-medium hover:bg-gray-200"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-[#405952] text-white rounded-md text-sm font-medium hover:bg-[#30423f]"
                >
                  Next
                </button>
              </div>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-center text-2xl font-bold mb-10">Business Registration Upload</h2>
            <form className="space-y-6">
              <div>
                <label className="block mb-2 text-sm font-medium">Business Registration Certificate (Required)</label>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleFileChange}
                  className="w-full border rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#405952] bg-white"
                />
              </div>
              <div className="flex justify-between mt-8">
                <button type="button" onClick={handlePrevious} className="px-5 py-2 bg-gray-100 rounded-md text-sm font-medium hover:bg-gray-200">Previous</button>
                <button type="button" onClick={handleNext} className="px-6 py-2 bg-[#405952] text-white rounded-md text-sm font-medium hover:bg-[#30423f]">Next</button>
              </div>
            </form>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-center text-2xl font-bold mb-10">NDA Agreement</h2>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="flex items-start space-x-3">
                <input id="nda" type="checkbox" checked={ndaAgreed} onChange={(e) => setNdaAgreed(e.target.checked)} className="mt-1 h-4 w-4" />
                <label htmlFor="nda" className="text-sm text-gray-700">I agree to the terms of the Non-Disclosure Agreement. <a href="#" className="text-[#405952] underline">View full terms</a></label>
              </div>

              {submitError && <div className="text-red-600 text-sm">{submitError}</div>}

              <div className="flex justify-between mt-8">
                <button type="button" onClick={handlePrevious} className="px-5 py-2 bg-gray-100 rounded-md text-sm font-medium hover:bg-gray-200">Previous</button>
                <button type="submit" disabled={submitting} className="px-6 py-2 bg-[#405952] text-white rounded-md text-sm font-medium hover:bg-[#30423f] disabled:opacity-60">{submitting ? "Submitting..." : "Submit Application"}</button>
              </div>
            </form>
          </>
        )}

        {step === 5 && (
          <>
            <h2 className="text-center text-2xl font-bold mb-2">Application Status</h2>
            <p className="text-center text-sm text-gray-500 mb-8">Under Review</p>
            <div className="space-y-4 text-sm text-gray-700 max-w-xl mx-auto">
              <p>Your application is being reviewed. You'll receive an email notification upon approval.</p>
              <p className="font-medium">Typical review: 2-3 business days</p>
              <div>
                <div className="font-medium">Contact Support</div>
                <p>For any questions, please reach out to our support team at <span className="font-mono">support@workplace.com</span></p>
              </div>
              <div className="flex justify-center pt-2">
                <button onClick={() => navigate("/login")} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">Return to Login</button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default PartnerApplication;