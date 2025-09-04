export const transformTableData = (jsonData) => {
  const headers = [
    'S. No.', 'State', 'District', 'Location', 'Longitude', 'Latitude', 'Year',
    'pH', 'EC (µS/cm at 25 °C)', 'CO3 (mg/L)', 'HCO3 (mg/L)', 'Cl (mg/L)',
    'F (mg/L)', 'SO4 (mg/L)', 'NO3 (mg/L)', 'PO4 (mg/L)', 'Total Hardness (mg/L)',
    'Ca (mg/L)', 'Mg (mg/L)', 'Na (mg/L)', 'K (mg/L)', 'Fe (ppm)', 'As (ppb)', 'U (ppb)'
  ];
  const data = [];
  jsonData.pageTables.forEach(page => {
    if (page.tables && page.tables.length > 0) {
      let columns = page.tables.slice().reverse(); // Reverse to align with headers order
      if (columns.length !== headers.length) {
        console.warn(`Column length mismatch on page ${page.page}: expected ${headers.length}, got ${columns.length}`);
        return;
      }
      const numRows = columns[0].length - 1; // Exclude the header row in columns
      for (let i = 1; i <= numRows; i++) {
        const row = {};
        headers.forEach((header, j) => {
          let value = columns[j][i]?.trim();
          if (value === '-' || value === '') {
            value = null;
          } else {
            const num = parseFloat(value);
            if (!isNaN(num)) {
              value = num;
            }
          }
          row[header] = value;
        });
        // Clean S. No. and State
        let sno = row['S. No.'];
        if (typeof sno === 'string' && sno.includes(' ')) {
          const parts = sno.split(/\s+/);
          row['S. No.'] = parseInt(parts[0], 10);
          if (!row['State'] || row['State'] === '') {
            row['State'] = parts.slice(1).join(' ');
          }
        } else if (typeof sno === 'string') {
          row['S. No.'] = parseInt(sno, 10);
        }
        // Clean Longitude if it has '/'
        if (typeof row['Longitude'] === 'string' && row['Longitude'].includes('/')) {
          row['Longitude'] = parseFloat(row['Longitude'].replace('/', '.'));
        }
        data.push(row);
      }
    }
  });
  return data;
}