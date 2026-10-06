import re
import os

filepath = r'c:\Users\ADMIN\Desktop\fintrack\frontend\src\pages\Insights.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports for useState, useEffect, axios
if 'import React' in content and 'useState' not in content:
    content = content.replace("import React from 'react';", "import React, { useState, useEffect } from 'react';\nimport axios from 'axios';\nimport apiClient from '../apiClient';")

# Replace function start
func_start = 'export default function Insights() {'
new_func_start = """export default function Insights() {
  const [predictionData, setPredictionData] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [nlQuery, setNlQuery] = useState('How much did I spend on Dining in October 2024?');
  const [nlResult, setNlResult] = useState(null);
  const [loadingNl, setLoadingNl] = useState(false);

  useEffect(() => {
    // Fetch Predictions
    apiClient.get('/insights/prediction').then(res => {
      if (res.data.success) setPredictionData(res.data.predictions);
    }).catch(console.error);

    // Fetch Anomalies
    apiClient.get('/insights/anomalies').then(res => {
      if (res.data.success) setAnomalies(res.data.anomalies);
    }).catch(console.error);
  }, []);

  const handleNlSearch = async () => {
    setLoadingNl(true);
    try {
      const res = await apiClient.post('/insights/nl-query', { query: nlQuery });
      if (res.data.success) {
        setNlResult(res.data.result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNl(false);
    }
  };
"""
content = content.replace(func_start, new_func_start)

# Save
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Insights.jsx prepared for React hooks.")
