const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const folder = 'C:\\Users\\user\\Desktop\\dre\\Leads';
const files = fs.readdirSync(folder).filter(f => f.endsWith('.xlsx'));

files.forEach(file => {
  console.log('\n' + '='.repeat(60));
  console.log('FILE:', file);
  console.log('='.repeat(60));
  
  const wb = XLSX.readFile(path.join(folder, file));
  
  wb.SheetNames.forEach(sheetName => {
    const sheet = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    console.log('\n--- Sheet:', sheetName, '---');
    console.log('Rows:', data.length);
    if (data[0]) console.log('Headers:', JSON.stringify(data[0]));
    if (data[1]) console.log('Sample Row 1:', JSON.stringify(data[1]));
    if (data[2]) console.log('Sample Row 2:', JSON.stringify(data[2]));
  });
});
