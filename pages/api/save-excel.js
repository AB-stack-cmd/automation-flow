import * as XLSX from 'xlsx';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { columns, rows } = req.body;
    if (!columns || !rows) {
      return res.status(400).json({ message: 'Missing columns or rows' });
    }

    // Build AoA (Array of Arrays)
    const dataToExport = [columns, ...rows];
    
    // Convert to sheet
    const ws = XLSX.utils.aoa_to_sheet(dataToExport);
    
    // Apply basic column widths
    const wscols = columns.map(c => ({ wch: Math.max(c.length + 4, 15) }));
    ws['!cols'] = wscols;

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Neuron AI Grid');
    
    // Save to the current workspace root
    const fileName = `neuron_flow_data_${Date.now().toString().slice(-6)}.xlsx`;
    const filePath = path.join(process.cwd(), fileName);

    XLSX.writeFile(wb, filePath);

    return res.status(200).json({ 
      success: true, 
      filePath: filePath,
      fileName: fileName
    });
  } catch (error) {
    console.error('Server side Excel write error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
