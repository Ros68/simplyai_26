// Test script to verify form deletion endpoint
import fetch from "node-fetch";

const API_BASE_URL = "https://simplyai.it/api";

async function testFormDeletion() {
  console.log("🧪 Testing Form Deletion Endpoint...\n");

  try {
    // First, get the list of forms to see available forms
    console.log("📋 Step 1: Getting list of forms");
    const listResponse = await fetch(`${API_BASE_URL}/forms`);
    const listResult = await listResponse.json();

    if (listResult.success && listResult.data.length > 0) {
      console.log("Available forms:");
      listResult.data.forEach((form, index) => {
        console.log(`${index + 1}. ID: ${form.id}, Title: "${form.title}"`);
      });

      // For safety, we'll test with a non-existent ID first
      console.log(
        "\n🔍 Step 2: Testing delete with non-existent ID (should return 404)"
      );
      const testId = "non-existent-form-id";

      const deleteResponse = await fetch(`${API_BASE_URL}/forms/${testId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Delete response status:", deleteResponse.status);
      const deleteResult = await deleteResponse.text();
      console.log("Delete response:", deleteResult);

      if (deleteResponse.status === 404) {
        console.log("✅ Correctly returned 404 for non-existent form");
      } else {
        console.log("⚠️ Unexpected response for non-existent form");
      }
    } else {
      console.log("No forms available for testing");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testFormDeletion();
