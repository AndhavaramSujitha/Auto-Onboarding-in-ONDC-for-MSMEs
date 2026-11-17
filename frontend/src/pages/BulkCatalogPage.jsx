import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { UploadCloud, Download, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle, ArrowRight, RefreshCw, AlertCircle, Boxes, X, } from 'lucide-react';
import productService from '../services/productService';
import businessService from '../services/businessService';
import { SAMPLE_CSV_CONTENT, downloadCsv, parseCsv, } from '../utils/csvHelper';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import ProgressBar from '../components/common/ProgressBar';
export const BulkCatalogPage = () => {
    const [business, setBusiness] = useState(null);
    const [isLoadingBusiness, setIsLoadingBusiness] = useState(true);
    // File & Parsing state
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [parsedRows, setParsedRows] = useState([]);
    const [isParsing, setIsParsing] = useState(false);
    // Batch Ingestion state
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [currentItemName, setCurrentItemName] = useState('');
    const [importedCount, setImportedCount] = useState(0);
    const [failedCount, setFailedCount] = useState(0);
    const [isImportComplete, setIsImportComplete] = useState(false);
    // Status Alerts
    const [serverError, setServerError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const fileInputRef = useRef(null);
    useEffect(() => {
        const checkBusiness = async () => {
            try {
                const b = await businessService.getMyBusiness();
                setBusiness(b);
            }
            catch {
                setBusiness(null);
            }
            finally {
                setIsLoadingBusiness(false);
            }
        };
        checkBusiness();
    }, []);
    const handleDownloadSample = () => {
        downloadCsv(SAMPLE_CSV_CONTENT, 'ondc_catalog_sample_template.csv');
    };
    const handleExportCurrentCatalog = async () => {
        try {
            const products = await productService.listProducts();
            if (!products || products.length === 0) {
                setServerError('Your catalog has no products to export yet.');
                return;
            }
            const headers = [
                'productName',
                'sku',
                'brand',
                'category',
                'subcategory',
                'price',
                'currency',
                'availableQuantity',
                'unit',
                'description',
            ];
            const csvLines = [headers.join(',')];
            products.forEach((p) => {
                const row = [
                    `"${p.productName.replace(/"/g, '""')}"`,
                    `"${p.sku}"`,
                    `"${(p.brand || '').replace(/"/g, '""')}"`,
                    `"${p.category}"`,
                    `"${(p.subcategory || '').replace(/"/g, '""')}"`,
                    p.price,
                    p.currency || 'INR',
                    p.availableQuantity,
                    p.unit || 'PCS',
                    `"${(p.description || '').replace(/"/g, '""')}"`,
                ];
                csvLines.push(row.join(','));
            });
            downloadCsv(csvLines.join('\n'), 'ondc_my_products_export.csv');
            setSuccessMessage(`Exported ${products.length} products to ondc_my_products_export.csv`);
        }
        catch {
            setServerError('Failed to export catalog. Verify backend connectivity.');
        }
    };
    const handleFile = (file) => {
        if (!file.name.endsWith('.csv')) {
            setServerError('Please upload a valid CSV file (.csv).');
            return;
        }
        setSelectedFile(file);
        setIsParsing(true);
        setServerError(null);
        setSuccessMessage(null);
        setIsImportComplete(false);
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result;
            const rows = parseCsv(text);
            setParsedRows(rows);
            setIsParsing(false);
            if (rows.length === 0) {
                setServerError('No valid data rows found in the CSV. Please check formatting.');
            }
        };
        reader.onerror = () => {
            setIsParsing(false);
            setServerError('Failed to read CSV file.');
        };
        reader.readAsText(file);
    };
    const validRows = parsedRows.filter((r) => r.isValid);
    const invalidRows = parsedRows.filter((r) => !r.isValid);
    // Execute batch ingestion into backend
    const handleStartImport = async () => {
        if (validRows.length === 0)
            return;
        setIsImporting(true);
        setImportProgress(0);
        setImportedCount(0);
        setFailedCount(0);
        setIsImportComplete(false);
        setServerError(null);
        let success = 0;
        let fail = 0;
        for (let i = 0; i < validRows.length; i++) {
            const row = validRows[i].data;
            setCurrentItemName(row.productName);
            try {
                await productService.createProduct({
                    productName: row.productName,
                    sku: row.sku,
                    brand: row.brand,
                    category: row.category,
                    subcategory: row.subcategory,
                    price: parseFloat(row.price),
                    currency: row.currency || 'INR',
                    availableQuantity: parseInt(row.availableQuantity, 10),
                    unit: row.unit || 'PCS',
                    description: row.description || '',
                    attributes: {},
                });
                success++;
                setImportedCount(success);
            }
            catch (e) {
                fail++;
                setFailedCount(fail);
            }
            setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
        }
        setIsImporting(false);
        setIsImportComplete(true);
        setSuccessMessage(`Batch ingestion complete! Successfully created ${success} products (${fail} failed).`);
    };
    return (_jsxs("div", { className: "space-y-6", children: [!business && !isLoadingBusiness && (_jsxs("div", { className: "p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-900", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(AlertTriangle, { className: "w-5 h-5 text-amber-600 shrink-0" }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-semibold", children: "Business Profile Required" }), _jsx("p", { className: "text-xs text-amber-700 mt-0.5", children: "Bulk catalog ingestion requires a registered seller business entity." })] })] }), _jsx(Link, { to: "/business", className: "shrink-0", children: _jsx(Button, { size: "sm", variant: "primary", className: "bg-amber-600 hover:bg-amber-700", children: "Set Up Business" }) })] })), successMessage && (_jsxs("div", { className: "p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 text-sm", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CheckCircle2, { className: "w-5 h-5 text-emerald-600 shrink-0" }), _jsx("span", { className: "font-medium", children: successMessage })] }), _jsx("button", { onClick: () => setSuccessMessage(null), className: "text-emerald-600 hover:text-emerald-800", children: _jsx(X, { className: "w-4 h-4" }) })] })), serverError && (_jsxs("div", { className: "p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-red-800 text-sm", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-600 shrink-0" }), _jsx("span", { className: "font-medium", children: serverError })] }), _jsx("button", { onClick: () => setServerError(null), className: "text-red-600 hover:text-red-800", children: _jsx(X, { className: "w-4 h-4" }) })] })), _jsxs("div", { className: "bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("h2", { className: "text-xl font-bold text-slate-900 tracking-tight", children: "Bulk Catalog Import & Export" }), _jsx(Badge, { variant: "indigo", size: "sm", children: "CSV Ingestion Engine" })] }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "Import hundreds of retail SKUs at once with automated schema validation and live error checking." })] }), _jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: handleDownloadSample, leftIcon: _jsx(Download, { className: "w-4 h-4" }), children: "Download CSV Template" }), _jsx(Button, { variant: "outline", size: "sm", onClick: handleExportCurrentCatalog, leftIcon: _jsx(FileSpreadsheet, { className: "w-4 h-4" }), children: "Export Catalog" })] })] }), _jsx(Card, { title: "Upload Catalog Spreadsheet", subtitle: "Upload a .csv file matching the ONDC product attributes schema", children: _jsx("div", { className: "space-y-4", children: _jsxs("div", { onDragOver: (e) => {
                            e.preventDefault();
                            setIsDragging(true);
                        }, onDragLeave: () => setIsDragging(false), onDrop: (e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                handleFile(e.dataTransfer.files[0]);
                            }
                        }, onClick: () => fileInputRef.current?.click(), className: `border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragging
                            ? 'border-indigo-600 bg-indigo-50/50 scale-[1.01]'
                            : selectedFile
                                ? 'border-emerald-400 bg-emerald-50/20'
                                : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'}`, children: [_jsx("input", { ref: fileInputRef, type: "file", accept: ".csv", className: "hidden", onChange: (e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        handleFile(e.target.files[0]);
                                    }
                                } }), _jsx("div", { className: "w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3", children: _jsx(FileSpreadsheet, { className: "w-6 h-6" }) }), selectedFile ? (_jsxs("div", { children: [_jsx("p", { className: "text-sm font-bold text-slate-900", children: selectedFile.name }), _jsxs("p", { className: "text-xs text-slate-500 mt-1", children: [(selectedFile.size / 1024).toFixed(1), " KB \u2022 Click or drop another file to replace"] })] })) : (_jsxs("div", { children: [_jsxs("p", { className: "text-sm font-semibold text-slate-800", children: ["Drag and drop your catalog CSV here, or ", _jsx("span", { className: "text-indigo-600", children: "Browse" })] }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "CSV format with UTF-8 encoding. Maximum 500 SKUs per upload recommended." })] }))] }) }) }), parsedRows.length > 0 && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [_jsxs(Card, { bodyClassName: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs font-semibold text-slate-500 uppercase", children: "Total Parsed Rows" }), _jsx(Boxes, { className: "w-4 h-4 text-slate-400" })] }), _jsx("p", { className: "text-2xl font-bold text-slate-900 mt-1", children: parsedRows.length })] }), _jsxs(Card, { bodyClassName: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs font-semibold text-slate-500 uppercase", children: "Valid Schema Rows" }), _jsx(CheckCircle2, { className: "w-4 h-4 text-emerald-500" })] }), _jsx("p", { className: "text-2xl font-bold text-emerald-600 mt-1", children: validRows.length })] }), _jsxs(Card, { bodyClassName: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs font-semibold text-slate-500 uppercase", children: "Errors / Invalid Rows" }), _jsx(XCircle, { className: "w-4 h-4 text-red-500" })] }), _jsx("p", { className: "text-2xl font-bold text-red-600 mt-1", children: invalidRows.length })] })] }), isImporting && (_jsxs(Card, { bodyClassName: "p-6 space-y-3", children: [_jsxs("div", { className: "flex justify-between items-center text-sm font-medium", children: [_jsxs("span", { className: "text-indigo-700 flex items-center gap-2", children: [_jsx(RefreshCw, { className: "w-4 h-4 animate-spin" }), "Importing: ", currentItemName] }), _jsxs("span", { className: "text-slate-600", children: [importProgress, "%"] })] }), _jsx(ProgressBar, { value: importProgress, color: "indigo", size: "md" }), _jsxs("div", { className: "flex justify-between text-xs text-slate-500 pt-1", children: [_jsxs("span", { children: ["Created: ", importedCount] }), _jsxs("span", { children: ["Failed: ", failedCount] }), _jsxs("span", { children: ["Total: ", validRows.length] })] })] })), isImportComplete && (_jsxs("div", { className: "p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(CheckCircle2, { className: "w-6 h-6 text-emerald-600 shrink-0" }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-bold text-emerald-900", children: "Catalog Ingestion Completed" }), _jsxs("p", { className: "text-xs text-emerald-700 mt-0.5", children: [importedCount, " new items were added to your active inventory."] })] })] }), _jsx(Link, { to: "/products", children: _jsx(Button, { size: "sm", variant: "primary", rightIcon: _jsx(ArrowRight, { className: "w-4 h-4" }), children: "View in Catalog" }) })] })), !isImporting && !isImportComplete && (_jsxs("div", { className: "flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200", children: [_jsxs("div", { className: "text-xs text-slate-600", children: ["Ready to import ", _jsx("strong", { className: "text-slate-900", children: validRows.length }), " valid products. ", invalidRows.length > 0 && `${invalidRows.length} invalid rows will be skipped.`] }), _jsxs(Button, { variant: "primary", size: "md", disabled: validRows.length === 0, onClick: handleStartImport, leftIcon: _jsx(UploadCloud, { className: "w-4 h-4" }), children: ["Import ", validRows.length, " Valid Products"] })] })), _jsx(Card, { title: "Pre-Upload Data Validation Review", subtitle: "Review parsed columns and schema check outcomes", bodyClassName: "p-0 overflow-x-auto", children: _jsxs("table", { className: "w-full text-left border-collapse text-xs", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider", children: [_jsx("th", { className: "py-2.5 px-3", children: "Row" }), _jsx("th", { className: "py-2.5 px-3", children: "Status" }), _jsx("th", { className: "py-2.5 px-3", children: "Product Name" }), _jsx("th", { className: "py-2.5 px-3", children: "SKU" }), _jsx("th", { className: "py-2.5 px-3", children: "Category" }), _jsx("th", { className: "py-2.5 px-3", children: "Price" }), _jsx("th", { className: "py-2.5 px-3", children: "Stock" }), _jsx("th", { className: "py-2.5 px-3", children: "Validation Details" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-100", children: parsedRows.map((r) => (_jsxs("tr", { className: r.isValid ? 'hover:bg-slate-50/70' : 'bg-red-50/40', children: [_jsx("td", { className: "py-2.5 px-3 font-mono text-slate-500", children: r.rowIndex }), _jsx("td", { className: "py-2.5 px-3", children: _jsx(Badge, { variant: r.isValid ? 'success' : 'error', size: "sm", dot: true, children: r.isValid ? 'Valid' : 'Invalid' }) }), _jsx("td", { className: "py-2.5 px-3 font-medium text-slate-800", children: r.data.productName || _jsx("span", { className: "text-red-500 italic", children: "Empty" }) }), _jsx("td", { className: "py-2.5 px-3 font-mono text-slate-700", children: r.data.sku || _jsx("span", { className: "text-red-500 italic", children: "Empty" }) }), _jsx("td", { className: "py-2.5 px-3 text-slate-600", children: r.data.category }), _jsxs("td", { className: "py-2.5 px-3 font-medium", children: ["\u20B9", r.data.price] }), _jsxs("td", { className: "py-2.5 px-3", children: [r.data.availableQuantity, " ", r.data.unit] }), _jsx("td", { className: "py-2.5 px-3", children: r.isValid ? (_jsx("span", { className: "text-emerald-700 text-[11px]", children: "Ready for import" })) : (_jsx("span", { className: "text-red-600 text-[11px] font-medium", children: r.errors.join(', ') })) })] }, r.rowIndex))) })] }) })] }))] }));
};
export default BulkCatalogPage;
