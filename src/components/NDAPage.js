import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, ArrowLeft } from "lucide-react";

const NDAPage = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    // Navigate back to partner application step 4 (Legal Agreement)
    navigate('/partner-application?step=4');
  };

  return (
    <div className="bg-white min-h-screen font-sans text-[#818181] print:bg-white print:text-black">
      {/* Animated background elements */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-[#1B2150]/5 rounded-full blur-3xl animate-pulse print:hidden"></div>
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#5F6485]/10 rounded-full blur-3xl animate-pulse print:hidden"></div>
      
      {/* Header */}
      <header className="w-full border-b backdrop-blur-sm bg-white/90 sticky top-0 z-50 shadow-sm print:hidden">
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
            className="px-4 py-2 text-sm font-medium text-[#818181] hover:text-[#1B2150] transition-colors flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Application</span>
          </button>
        </div>
      </header>

      <div className={`max-w-4xl mx-auto px-6 py-8 transform transition-all duration-1000 ${
        isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}>
        {/* Main Content */}
        <div className="flex justify-center">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#FAFAFB] relative overflow-hidden">
            {/* Decorative top accent */}
            <div className="absolute top-0 left-0 w-full h-2 bg-[#1B2150]"></div>
            
            <div className="p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-[#1B2150] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-[#1B2150] mb-2">Non-Disclosure Agreement (NDA)</h1>
                <p className="text-[#818181] text-sm">Partnership Agreement Terms and Conditions</p>
              </div>

              {/* NDA Content */}
              <div className="prose prose-lg max-w-none text-[#818181] leading-relaxed space-y-6">
                <div className="bg-[#FAFAFB] rounded-xl p-6 border border-[#FAFAFB]">
                  <p className="text-base leading-relaxed">
                    This Non-Disclosure Agreement (the "Agreement") is entered into by and between Sharp Peak Consulting Limited (the "Disclosing Party"), a company incorporated and operating under the laws of Hong Kong, with its principal place of business Unit N7, 3/F, W Luxe, 5 On Yiu Street, Sha Tin, Hong Kong, and the undersigned partner or reseller (the "Receiving Party"), effective as of the date of submission of the Sign Up as Partner form on the Power Workplace Partner's Portals (the "Effective Date").
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[#1B2150] mb-4">Recitals</h2>
                  <div className="space-y-4 text-base leading-relaxed">
                    <p>
                      WHEREAS, the Disclosing Party operates the Power Workplace Partner's Portals and provides access to confidential information, including but not limited to pricing information for resellers, to facilitate partnerships;
                    </p>
                    <p>
                      WHEREAS, the Receiving Party desires to access such confidential information for the purpose of evaluating or engaging in a reseller partnership with the Disclosing Party;
                    </p>
                    <p>
                      WHEREAS, the Disclosing Party agrees to disclose such confidential information to the Receiving Party subject to the terms and conditions of this Agreement;
                    </p>
                    <p className="font-semibold text-[#1B2150]">
                      NOW, THEREFORE, in consideration of the mutual promises and covenants contained herein, the parties agree as follows:
                    </p>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[#1B2150] mb-4">1. Definition of Confidential Information</h2>
                  <div className="space-y-4 text-base leading-relaxed">
                    <p>
                      "Confidential Information" means any non-public information disclosed by the Disclosing Party to the Receiving Party, whether orally, in writing, electronically, or by any other means, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and the circumstances of disclosure. Confidential Information includes, without limitation:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Pricing information for resellers, including discounts, margins, and pricing structures;</li>
                      <li>Business strategies, marketing plans, customer lists, and technical specifications related to the Power Workplace Partner's Portals;</li>
                      <li>Any other proprietary information disclosed in connection with the partnership sign-up process.</li>
                    </ul>
                    <p>
                      Confidential Information does not include information that:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>(a) Is or becomes publicly available through no fault of the Receiving Party;</li>
                      <li>(b) Was rightfully known to the Receiving Party prior to disclosure by the Disclosing Party;</li>
                      <li>(c) Is independently developed by the Receiving Party without reference to the Confidential Information;</li>
                      <li>(d) Is lawfully obtained by the Receiving Party from a third party without breach of any obligation of confidentiality; or</li>
                      <li>(e) Is required to be disclosed by law, provided that the Receiving Party gives the Disclosing Party prompt written notice of such requirement prior to disclosure and assists in obtaining an order protecting the information from public disclosure.</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[#1B2150] mb-4">2. Obligations of the Receiving Party</h2>
                  <div className="space-y-4 text-base leading-relaxed">
                    <p>The Receiving Party agrees to:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>(a) Hold the Confidential Information in strict confidence and not disclose it to any third party without the prior written consent of the Disclosing Party;</li>
                      <li>(b) Use the Confidential Information solely for the purpose of evaluating or participating in the reseller partnership with the Disclosing Party (the "Permitted Purpose") and not for any other purpose;</li>
                      <li>(c) Limit access to the Confidential Information to its employees, agents, or representatives who have a need to know for the Permitted Purpose and who are bound by confidentiality obligations at least as protective as those in this Agreement;</li>
                      <li>(d) Take reasonable measures to protect the secrecy of and avoid disclosure or unauthorized use of the Confidential Information, such measures being no less than those used to protect its own confidential information of a similar nature.</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[#1B2150] mb-4">3. Term</h2>
                  <p className="text-base leading-relaxed">
                    This Agreement shall remain in effect for a period of two (2) years from the Effective Date, or until the Confidential Information no longer qualifies as confidential under the terms herein, whichever is longer. The obligations of confidentiality shall survive the termination or expiration of this Agreement with respect to any Confidential Information that remains confidential.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[#1B2150] mb-4">4. Return or Destruction of Confidential Information</h2>
                  <p className="text-base leading-relaxed">
                    Upon the Disclosing Party's written request or upon termination of the partnership discussions, the Receiving Party shall promptly return or destroy all copies of the Confidential Information and certify in writing that such return or destruction has been completed.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[#1B2150] mb-4">5. Remedies</h2>
                  <p className="text-base leading-relaxed">
                    The Receiving Party acknowledges that any breach of this Agreement may cause irreparable harm to the Disclosing Party for which monetary damages may be inadequate. Accordingly, the Disclosing Party shall be entitled to seek injunctive relief in addition to any other remedies available at law or in equity.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[#1B2150] mb-4">6. No License or Obligation</h2>
                  <p className="text-base leading-relaxed">
                    Nothing in this Agreement grants the Receiving Party any rights, by license or otherwise, to the Confidential Information except as expressly provided herein. This Agreement does not obligate either party to enter into any further business relationship.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[#1B2150] mb-4">7. Governing Law and Jurisdiction</h2>
                  <p className="text-base leading-relaxed">
                    This Agreement shall be governed by and construed in accordance with the laws of Hong Kong, without regard to its conflict of laws principles. Any disputes arising out of or related to this Agreement shall be subject to the exclusive jurisdiction of the courts located in Hong Kong.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[#1B2150] mb-4">8. Entire Agreement</h2>
                  <p className="text-base leading-relaxed">
                    This Agreement constitutes the entire understanding between the parties with respect to the subject matter hereof and supersedes all prior agreements, whether written or oral. No amendment or modification shall be effective unless in writing and signed by both parties.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[#1B2150] mb-4">9. Severability</h2>
                  <p className="text-base leading-relaxed">
                    If any provision of this Agreement is held to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[#1B2150] mb-4">10. Electronic Acceptance</h2>
                  <p className="text-base leading-relaxed">
                    By submitting the Sign Up as Partner form on the Power Workplace Partner's Portals, the Receiving Party acknowledges that they have read, understood, and agree to be bound by the terms of this Agreement. Such submission shall constitute the Receiving Party's electronic signature and acceptance of this Agreement.
                  </p>
                </div>

                <div className="bg-[#FAFAFB] rounded-xl p-6 border border-[#FAFAFB] mt-8">
                  <div className="grid md:grid-cols-2 gap-6 text-sm">
                    <div>
                      <h3 className="font-bold text-[#1B2150] mb-2">Receiving Party:</h3>
                      <p>[Name of Partner/Reseller]</p>
                      <p>[Authorized Signature] (Electronic acceptance via form submission)</p>
                      <p>[Date: Effective Date]</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1B2150] mb-2">Disclosing Party:</h3>
                      <p>Sharp Peak Consulting Limited</p>
                      <p>[Authorized Signature]</p>
                      <p>[Date: Effective Date]</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t border-[#FAFAFB] print:hidden">
                <div className="flex flex-wrap justify-center gap-4">
                  <button
                    onClick={handleBack}
                    className="px-6 py-3 bg-[#FAFAFB] text-[#818181] rounded-xl text-base font-semibold hover:bg-[#5F6485] hover:text-white transition-all duration-200 border-2 border-transparent hover:border-[#5F6485]"
                  >
                    ← Back to Application
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-6 py-3 bg-[#5F6485] text-white rounded-xl text-base font-semibold hover:bg-[#1B2150] hover:shadow-lg transition-all duration-200"
                  >
                    Print NDA
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default NDAPage;
