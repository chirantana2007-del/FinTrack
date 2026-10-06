import re

filepath = r'c:\Users\ADMIN\Desktop\fintrack\frontend\src\pages\Report.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
if 'import React' in content and 'apiClient' not in content:
    content = content.replace("import React from 'react';", "import React from 'react';\nimport apiClient from '../api/client';")

# Add handler
func_start = 'export default function Report() {'
new_func_start = """export default function Report() {
  const handleDownloadPDF = async () => {
    try {
        const response = await apiClient.get('/reports/export', { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'FinTrack_Report.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (err) {
        console.error(err);
        alert('Failed to download PDF');
    }
  };
"""
if 'handleDownloadPDF' not in content:
    content = content.replace(func_start, new_func_start)

# Add onClick to button
btn_target = '<button className="flex-1 sm:flex-initial flex items-center justify-center gap-space-xs px-space-md py-2 rounded-lg bg-primary-container text-on-primary hover:bg-primary font-label-md text-label-md font-semibold shadow-sm transition-all" id="pdfExportBtn" type="button">'
btn_replacement = '<button onClick={handleDownloadPDF} className="flex-1 sm:flex-initial flex items-center justify-center gap-space-xs px-space-md py-2 rounded-lg bg-primary-container text-on-primary hover:bg-primary font-label-md text-label-md font-semibold shadow-sm transition-all" id="pdfExportBtn" type="button">'
content = content.replace(btn_target, btn_replacement)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Report PDF wiring complete.")
