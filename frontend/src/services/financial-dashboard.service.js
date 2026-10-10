import api from './api';

export const FinancialDashboardService = {
  getDashboardSummary: async () => {
    const response = await api.get('/financial/dashboard');
    return response.data;
  },

  downloadPdfReport: async () => {
    const response = await api.get('/financial/report', { responseType: 'blob' });
    const disposition = response.headers['content-disposition'];
    const filename = disposition?.match(/filename\*?=(?:UTF-8''|")?([^;"]+)/i)?.[1]?.replaceAll('"', '') || 'upiq-financial-report.pdf';
    const blobUrl = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = decodeURIComponent(filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    return true;
  },
};

export default FinancialDashboardService;

