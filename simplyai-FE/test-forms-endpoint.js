// Test script to check if the forms endpoint is accessible
import fetch from "node-fetch";

const API_BASE_URL = "https://simplyai.it/api";

async function testFormsEndpoint() {
  console.log("🧪 Testing Forms Endpoint Accessibility...\n");

  // Test 1: Check if the endpoint responds to GET request
  try {
    console.log("📋 Test 1: GET request to forms endpoint");
    const getResponse = await fetch(`${API_BASE_URL}/forms`);
    console.log("GET Status:", getResponse.status);
    console.log(
      "GET Headers:",
      Object.fromEntries(getResponse.headers.entries())
    );

    if (getResponse.status === 404) {
      console.log("❌ GET /forms returns 404 - endpoint may not exist");
    } else {
      const getResult = await getResponse.text();
      console.log("GET Response:", getResult.substring(0, 200) + "...");
    }
  } catch (error) {
    console.error("❌ GET request failed:", error.message);
  }

  console.log("\n" + "=".repeat(60) + "\n");

  // Test 2: Check if other endpoints work (to verify backend is running)
  try {
    console.log(
      "🔍 Test 2: Testing other endpoints to verify backend is running"
    );

    const settingsResponse = await fetch(`${API_BASE_URL}/settings`);
    console.log("Settings endpoint status:", settingsResponse.status);

    const plansResponse = await fetch(`${API_BASE_URL}/plans`);
    console.log("Plans endpoint status:", plansResponse.status);

    if (settingsResponse.status < 400 || plansResponse.status < 400) {
      console.log("✅ Backend appears to be running (other endpoints work)");
    } else {
      console.log("❌ Backend may not be running (all endpoints failing)");
    }
  } catch (error) {
    console.error("❌ Backend connectivity test failed:", error.message);
  }

  console.log("\n" + "=".repeat(60) + "\n");

  // Test 3: Test the exact POST request that's failing
  try {
    console.log("📤 Test 3: Testing exact POST request that is failing");

    const testFormData = {
      id: "0",
      title: "Test Form",
      description: "Test description",
      surveyJSON: { pages: [{ name: "page1", elements: [] }] },
      logo: null,
      status: "published",
      createdBy: "admin",
    };

    console.log("Request URL:", `${API_BASE_URL}/forms`);
    console.log("Request Method: POST");
    console.log("Request Data:", JSON.stringify(testFormData, null, 2));

    const postResponse = await fetch(`${API_BASE_URL}/forms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testFormData),
    });

    console.log("POST Status:", postResponse.status);
    console.log(
      "POST Headers:",
      Object.fromEntries(postResponse.headers.entries())
    );

    const postResult = await postResponse.text();
    console.log("POST Response:", postResult);

    if (postResponse.status === 404) {
      console.log("❌ Confirmed: POST /forms returns 404");
    } else if (postResponse.ok) {
      console.log("✅ POST request successful!");
    } else {
      console.log("⚠️ POST request failed with status:", postResponse.status);
    }
  } catch (error) {
    console.error("❌ POST request failed:", error.message);
  }
}

testFormsEndpoint();
