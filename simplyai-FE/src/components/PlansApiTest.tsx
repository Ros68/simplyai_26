import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config/api";

const PlansApiTest = () => {
  const [status, setStatus] = useState("Initializing...");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const testAPI = async () => {
      try {
        setStatus("Starting API call...");

        const url = `${API_BASE_URL}/plans/admin/all`;
        console.log("Fetching from:", url);

        const response = await fetch(url);

        setStatus(`Response received: ${response.status}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setStatus("Success!");
        setData(result);
      } catch (err) {
        console.error("API Test Error:", err);
        setStatus("Error occurred");
        setError(err.message);
      }
    };

    testAPI();
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h1>Plans API Test</h1>
      <div>
        <strong>Status:</strong> {status}
      </div>
      {error && (
        <div style={{ color: "red", marginTop: "10px" }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      {data && (
        <div style={{ marginTop: "10px" }}>
          <strong>Success!</strong> Found {data.data ? data.data.length : 0}{" "}
          plans
          <details style={{ marginTop: "10px" }}>
            <summary>Raw Data</summary>
            <pre
              style={{
                background: "#f5f5f5",
                padding: "10px",
                overflow: "auto",
                maxHeight: "300px",
              }}
            >
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default PlansApiTest;
