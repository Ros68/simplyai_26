import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import PricingTable from "@/components/PricingTable";
import { fetchAllPlans } from "@/services/plansService";
import { fetchPageData } from "@/services/pagesService";
import { Loader2 } from "lucide-react";
import Footer from "@/components/Footer";

const Pricing = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [googleData, setGoogleData] = useState(null);
  const [isGoogleSignup, setIsGoogleSignup] = useState(false);
  const [facebookData, setFacebookData] = useState(null);
  const [isFacebookSignup, setIsFacebookSignup] = useState(false);
  const [userSelectedPlanId, setUserSelectedPlanId] = useState(null);
  const [isEmailPasswordUser, setIsEmailPasswordUser] = useState(false);
  const [tempUserData, setTempUserData] = useState(null);

  // Page content from database
  const [pageData, setPageData] = useState(null);

  const location = useLocation();

  // Fetch editable page content
  useEffect(() => {
    const loadPageContent = async () => {
      try {
        const data = await fetchPageData("pricing");
        if (data && data.content) {
          setPageData(data);
        }
      } catch (error) {
        console.error("Error loading pricing page content:", error);
      }
    };
    loadPageContent();
  }, []);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await fetchAllPlans();
        setPlans(data || []);
      } catch (error) {
        console.error("Error fetching plans:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Check for OAuth data in URL parameters
    const urlParams = new URLSearchParams(location.search);

    // Check for Google OAuth data
    const googleSignup = urlParams.get("google_signup");
    const googleDataParam = urlParams.get("google_data");

    if (googleSignup === "true" && googleDataParam) {
      try {
        const parsedGoogleData = JSON.parse(
          decodeURIComponent(googleDataParam)
        );
        setGoogleData(parsedGoogleData);
        setIsGoogleSignup(true);
      } catch (error) {
        console.error("Error parsing Google data:", error);
      }
    }

    // Check for Facebook OAuth data
    const facebookSignup = urlParams.get("facebook_signup");
    const facebookDataParam = urlParams.get("facebook_data");

    if (facebookSignup === "true" && facebookDataParam) {
      try {
        const parsedFacebookData = JSON.parse(
          decodeURIComponent(facebookDataParam)
        );
        setFacebookData(parsedFacebookData);
        setIsFacebookSignup(true);
      } catch (error) {
        console.error("Error parsing Facebook data:", error);
      }
    }

    // Check for email/password user with pre-selected plan
    const userSelectedPlan = localStorage.getItem("user_selected_plan_id");
    if (userSelectedPlan && !isGoogleSignup && !isFacebookSignup) {
      setUserSelectedPlanId(userSelectedPlan);
      setIsEmailPasswordUser(true);
    }

    // Check for temporary user data from normal registration
    const tempUserDataStr = localStorage.getItem("temp_user_data");
    if (tempUserDataStr && !isGoogleSignup && !isFacebookSignup) {
      try {
        const parsedTempData = JSON.parse(tempUserDataStr);
        setTempUserData(parsedTempData);
        setIsEmailPasswordUser(true);
      } catch (error) {
        console.error("Error parsing temp user data:", error);
      }
    }

    fetchPlans();
  }, [location.search]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-grow py-16 px-4 bg-[var(--color-secondary)]">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-[var(--color-primary-600)]" />
            </div>
          ) : (
            <>
              {/* Editable Header Section */}
              {pageData && pageData.content ? (
                <>
                  {/* Split content at placeholder */}
                  {(() => {
                    const content = pageData.content;
                    const placeholder = "<!-- PRICING_TABLE_PLACEHOLDER -->";

                    if (content.includes(placeholder)) {
                      const [before, after] = content.split(placeholder);
                      return (
                        <>
                          <div dangerouslySetInnerHTML={{ __html: before }} />
                          <PricingTable
                            googleData={googleData}
                            isGoogleSignup={isGoogleSignup}
                            facebookData={facebookData}
                            isFacebookSignup={isFacebookSignup}
                            userSelectedPlanId={userSelectedPlanId}
                            isEmailPasswordUser={isEmailPasswordUser}
                            tempUserData={tempUserData}
                          />
                          <div dangerouslySetInnerHTML={{ __html: after }} />
                        </>
                      );
                    } else {
                      // No placeholder, just show content then pricing table
                      return (
                        <>
                          <div dangerouslySetInnerHTML={{ __html: content }} />
                          <PricingTable
                            googleData={googleData}
                            isGoogleSignup={isGoogleSignup}
                            facebookData={facebookData}
                            isFacebookSignup={isFacebookSignup}
                            userSelectedPlanId={userSelectedPlanId}
                            isEmailPasswordUser={isEmailPasswordUser}
                            tempUserData={tempUserData}
                          />
                        </>
                      );
                    }
                  })()}
                </>
              ) : (
                // Default content when nothing in database
                <>
                  <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold mb-4">
                      Scegli il piano più adatto a te
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                      Offriamo diverse soluzioni per soddisfare le tue esigenze
                    </p>
                  </div>

                  <PricingTable
                    googleData={googleData}
                    isGoogleSignup={isGoogleSignup}
                    facebookData={facebookData}
                    isFacebookSignup={isFacebookSignup}
                    userSelectedPlanId={userSelectedPlanId}
                    isEmailPasswordUser={isEmailPasswordUser}
                    tempUserData={tempUserData}
                  />

                  <div className="mt-20 text-center">
                    <h2 className="text-2xl font-semibold mb-6">
                      Domande frequenti sui prezzi
                    </h2>
                    {/* FAQ content */}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
      <Footer/>
    </div>
  );
};

export default Pricing;
