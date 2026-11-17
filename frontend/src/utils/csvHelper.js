export const SAMPLE_CSV_CONTENT = `productName,sku,brand,category,subcategory,price,currency,availableQuantity,unit,description
Organic Mustard Oil 1L,OIL-MST-1000,PureFarm,Grocery & Staples,Cooking Oils,220.00,INR,45,L,Cold-pressed organic mustard oil
Basmati Rice 5kg,RICE-BSM-5000,RoyalGrains,Grocery & Staples,Rice & Grains,550.00,INR,30,KG,Premium aged long-grain basmati rice
Green Tea 100g,TEA-GRN-100,HimalayanHerb,Beverages,Tea & Coffee,180.00,INR,60,GM,Antioxidant rich whole leaf green tea
Almond Crunch Cookies,CK-ALM-200,BakeWell,Packaged Foods,Biscuits & Cookies,120.00,INR,100,PACK,Handcrafted cookies with roasted almonds
Turmeric Powder 200g,SP-TRM-200,NatureSpices,Grocery & Staples,Spices,75.00,INR,80,GM,Pure ground turmeric with natural curcumin`;
export function downloadCsv(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
export function parseCsv(text) {
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length < 2)
        return [];
    // Parse header
    const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
    const results = [];
    for (let i = 1; i < lines.length; i++) {
        // Basic comma splitter handling quotes
        const rawCols = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const cols = rawCols.map((c) => c.trim().replace(/^["']|["']$/g, ''));
        const rowObj = {};
        headers.forEach((h, idx) => {
            rowObj[h] = cols[idx] !== undefined ? cols[idx] : '';
        });
        const parsedRow = {
            productName: rowObj.productName || '',
            sku: rowObj.sku || '',
            brand: rowObj.brand || '',
            category: rowObj.category || 'Grocery & Staples',
            subcategory: rowObj.subcategory || '',
            price: rowObj.price || '0',
            currency: rowObj.currency || 'INR',
            availableQuantity: rowObj.availableQuantity || '0',
            unit: rowObj.unit || 'PCS',
            description: rowObj.description || '',
        };
        // Validation
        const errors = [];
        if (!parsedRow.productName)
            errors.push('Missing productName');
        if (!parsedRow.sku)
            errors.push('Missing SKU');
        const priceNum = parseFloat(parsedRow.price);
        if (isNaN(priceNum) || priceNum < 0)
            errors.push('Invalid price (must be >= 0)');
        const qtyNum = parseInt(parsedRow.availableQuantity, 10);
        if (isNaN(qtyNum) || qtyNum < 0)
            errors.push('Invalid quantity (must be >= 0)');
        if (!parsedRow.category)
            errors.push('Missing category');
        results.push({
            rowIndex: i + 1,
            data: parsedRow,
            isValid: errors.length === 0,
            errors,
        });
    }
    return results;
}
