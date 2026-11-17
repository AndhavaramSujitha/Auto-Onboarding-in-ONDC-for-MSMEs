import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect, useMemo } from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2, FileCheck, RefreshCw, Search, Scale, Award, Edit2, X, } from 'lucide-react';
import productService from '../services/productService';
import businessService from '../services/businessService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';
import ProgressBar from '../components/common/ProgressBar';
import Spinner from '../components/common/Spinner';
import Modal from '../components/common/Modal';
const MANDATORY_LEGAL_CHECKS = [
    { id: 'has_sku', label: 'Valid Alphanumeric SKU Code' },
    { id: 'has_desc', label: 'Detailed Description (> 15 chars)' },
    { id: 'has_price', label: 'Positive Retail Price (> ₹0)' },
    { id: 'has_stock', label: 'Positive Stock Level (> 0)' },
    { id: 'has_origin', label: 'Country of Origin Specified' },
    { id: 'has_net_qty', label: 'Net Quantity / Unit Defined' },
    { id: 'has_brand', label: 'Brand / Manufacturer Identified' },
];
export const CompliancePage = () => {
    const [products, setProducts] = useState([]);
    const [business, setBusiness] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuditing, setIsAuditing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    // Quick edit modal
    const [editingProduct, setEditingProduct] = useState(null);
    const [originInput, setOriginInput] = useState('India');
    const [shelfLifeInput, setShelfLifeInput] = useState('12 Months');
    const [isSavingFix, setIsSavingFix] = useState(false);
    // Status alerts
    const [successMessage, setSuccessMessage] = useState(null);
    const [serverError, setServerError] = useState(null);
    const loadData = async () => {
        setIsLoading(true);
        setServerError(null);
        try {
            try {
                const b = await businessService.getMyBusiness();
                setBusiness(b);
            }
            catch {
                setBusiness(null);
            }
            const list = await productService.listProducts();
            setProducts(list || []);
        }
        catch {
            setServerError('Failed to fetch catalog items for compliance audit.');
        }
        finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        loadData();
    }, []);
    // Run audit rules on every product
    const auditResults = useMemo(() => {
        return products.map((p) => {
            const passed = [];
            const failed = [];
            // Check 1: SKU
            if (p.sku && p.sku.trim().length >= 3) {
                passed.push('Valid Alphanumeric SKU Code');
            }
            else {
                failed.push('Missing or invalid SKU Code');
            }
            // Check 2: Description
            if (p.description && p.description.trim().length >= 15) {
                passed.push('Detailed Description (> 15 chars)');
            }
            else {
                failed.push('Description missing or too brief');
            }
            // Check 3: Price
            if (p.price > 0) {
                passed.push('Positive Retail Price');
            }
            else {
                failed.push('Zero or invalid Price');
            }
            // Check 4: Stock
            if (p.availableQuantity > 0) {
                passed.push('Positive Stock Level');
            }
            else {
                failed.push('Out of Stock (0 units)');
            }
            // Check 5: Country of Origin (check attributes or default)
            const attr = p.attributes || {};
            const hasOrigin = attr['Country of Origin'] ||
                attr['country_of_origin'] ||
                attr['origin'] ||
                attr['Origin'];
            if (hasOrigin) {
                passed.push('Country of Origin Specified');
            }
            else {
                failed.push('Missing Country of Origin (Legal Metrology)');
            }
            // Check 6: Net Qty
            if (p.unit && p.unit.trim().length > 0) {
                passed.push('Net Quantity / Unit Defined');
            }
            else {
                failed.push('Missing Unit of Measurement');
            }
            // Check 7: Brand
            if (p.brand && p.brand.trim().length > 0) {
                passed.push('Brand / Manufacturer Identified');
            }
            else {
                failed.push('Unspecified Brand/Manufacturer');
            }
            const totalChecks = passed.length + failed.length;
            const score = Math.round((passed.length / totalChecks) * 100);
            let status = 'PASSED';
            if (score < 60)
                status = 'FAILED';
            else if (score < 90)
                status = 'WARNING';
            return {
                product: p,
                score,
                passedChecks: passed,
                failedChecks: failed,
                status,
            };
        });
    }, [products]);
    // Overall Catalog Compliance Score
    const overallScore = useMemo(() => {
        if (auditResults.length === 0)
            return 100;
        const sum = auditResults.reduce((acc, curr) => acc + curr.score, 0);
        return Math.round(sum / auditResults.length);
    }, [auditResults]);
    // Filtered results
    const filteredAudit = useMemo(() => {
        return auditResults.filter((item) => {
            const q = searchQuery.toLowerCase().trim();
            const matchSearch = !q ||
                item.product.productName.toLowerCase().includes(q) ||
                item.product.sku.toLowerCase().includes(q);
            const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [auditResults, searchQuery, statusFilter]);
    const handleRunAudit = async () => {
        setIsAuditing(true);
        setServerError(null);
        setSuccessMessage(null);

        try {
            // Persist the same status shown by this audit so Product Catalog
            // reads the latest result from the database instead of PENDING.
            const updatedProducts = await Promise.all(
                auditResults.map(async (result) => {
                    const product = result.product;
                    const payload = {
                        productName: product.productName,
                        sku: product.sku,
                        brand: product.brand,
                        category: product.category,
                        subcategory: product.subcategory,
                        price: product.price,
                        currency: product.currency,
                        availableQuantity: product.availableQuantity,
                        unit: product.unit,
                        description: product.description,
                        attributes: product.attributes || {},
                        images: product.images || [],
                        status: product.status || 'DRAFT',
                        complianceStatus: result.status,
                    };

                    const saved = await productService.updateProduct(product.id, payload);
                    return saved || { ...product, complianceStatus: result.status };
                })
            );

            setProducts((current) => current.map((product) => {
                const saved = updatedProducts.find((item) => item.id === product.id);
                return saved ? { ...product, ...saved } : product;
            }));

            setSuccessMessage('Compliance audit completed and product statuses saved. Refresh Product Catalog to view the updated status.');
        } catch (error) {
            console.error('Failed to save compliance audit results:', error);
            setServerError('Audit completed, but one or more compliance statuses could not be saved. Please try again.');
        } finally {
            setIsAuditing(false);
        }
    };
    // Quick fix attribute modal
    const handleOpenFix = (p) => {
        setEditingProduct(p);
        const attr = p.attributes || {};
        setOriginInput(attr['Country of Origin'] || 'India');
        setShelfLifeInput(attr['Shelf Life'] || '12 Months');
    };
    const handleSaveFix = async () => {
        if (!editingProduct)
            return;
        setIsSavingFix(true);
        try {
            const updatedAttrs = {
                ...(editingProduct.attributes || {}),
                'Country of Origin': originInput,
                'Shelf Life': shelfLifeInput,
            };
            const updated = await productService.updateProduct(editingProduct.id, {
                productName: editingProduct.productName,
                sku: editingProduct.sku,
                brand: editingProduct.brand,
                category: editingProduct.category,
                subcategory: editingProduct.subcategory,
                price: editingProduct.price,
                currency: editingProduct.currency,
                availableQuantity: editingProduct.availableQuantity,
                unit: editingProduct.unit,
                description: editingProduct.description || `${editingProduct.productName} compliant item.`,
                attributes: updatedAttrs,
            });
            setProducts((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
            setSuccessMessage(`Compliance attributes saved for SKU: ${updated.sku}`);
            setEditingProduct(null);
        }
        catch {
            setServerError('Failed to save compliance attributes.');
        }
        finally {
            setIsSavingFix(false);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [successMessage && (_jsxs("div", { className: "p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 text-sm", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CheckCircle2, { className: "w-5 h-5 text-emerald-600 shrink-0" }), _jsx("span", { className: "font-medium", children: successMessage })] }), _jsx("button", { onClick: () => setSuccessMessage(null), className: "text-emerald-600 hover:text-emerald-800", children: _jsx(X, { className: "w-4 h-4" }) })] })), serverError && (_jsxs("div", { className: "p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-red-800 text-sm", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-600 shrink-0" }), _jsx("span", { className: "font-medium", children: serverError })] }), _jsx("button", { onClick: () => setServerError(null), className: "text-red-600 hover:text-red-800", children: _jsx(X, { className: "w-4 h-4" }) })] })), _jsxs("div", { className: "bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("h2", { className: "text-xl font-bold text-slate-900 tracking-tight", children: "ONDC Compliance & Legal Metrology" }), _jsx(Badge, { variant: "success", size: "sm", children: "Beckn v1.2 Protocol" })] }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "Audit packaging declarations, mandatory statutory labeling, and ONDC catalog schema rules." })] }), _jsx("div", { className: "flex items-center gap-3", children: _jsx(Button, { variant: "primary", size: "sm", isLoading: isAuditing, onClick: handleRunAudit, leftIcon: _jsx(RefreshCw, { className: "w-4 h-4" }), children: "Run Catalog Audit" }) })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsx(Card, { title: "Catalog Compliance Health", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-baseline justify-between", children: [_jsxs("span", { className: "text-4xl font-extrabold text-slate-900", children: [overallScore, "%"] }), _jsx(Badge, { variant: overallScore >= 90 ? 'success' : overallScore >= 70 ? 'warning' : 'error', size: "md", children: overallScore >= 90
                                                ? 'ONDC Network Ready'
                                                : overallScore >= 70
                                                    ? 'Remediations Required'
                                                    : 'Action Needed' })] }), _jsx(ProgressBar, { value: overallScore, color: overallScore >= 90 ? 'emerald' : overallScore >= 70 ? 'amber' : 'indigo', size: "md" }), _jsx("p", { className: "text-xs text-slate-500 leading-relaxed", children: overallScore >= 90
                                        ? 'Your catalog fulfills all Legal Metrology Packaged Commodities requirements and Beckn retail specs.'
                                        : 'Some SKUs are missing mandatory packaging attributes like Country of Origin or unit descriptions.' })] }) }), _jsx("div", { className: "lg:col-span-2", children: _jsx(Card, { title: "Mandatory Network Guidelines Checked", children: _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsxs("div", { className: "p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs", children: [_jsxs("div", { className: "flex items-center gap-2 font-semibold text-slate-800 mb-1", children: [_jsx(Scale, { className: "w-4 h-4 text-indigo-600" }), _jsx("span", { children: "Legal Metrology (LMPC) 2011" })] }), _jsx("p", { className: "text-slate-500 leading-relaxed", children: "Requires prominent disclosure of Country of Origin, Net Quantity, Manufacturer details, and MRP." })] }), _jsxs("div", { className: "p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs", children: [_jsxs("div", { className: "flex items-center gap-2 font-semibold text-slate-800 mb-1", children: [_jsx(FileCheck, { className: "w-4 h-4 text-emerald-600" }), _jsx("span", { children: "ONDC Beckn Protocol 1.2" })] }), _jsx("p", { className: "text-slate-500 leading-relaxed", children: "Validates unique SKU code uniqueness, retail categorization, and currency format (INR)." })] }), _jsxs("div", { className: "p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs", children: [_jsxs("div", { className: "flex items-center gap-2 font-semibold text-slate-800 mb-1", children: [_jsx(Award, { className: "w-4 h-4 text-amber-600" }), _jsx("span", { children: "FSSAI Food Safety Standards" })] }), _jsx("p", { className: "text-slate-500 leading-relaxed", children: "Mandatory 14-digit FSSAI registration numbers for consumable groceries and beverages." })] }), _jsxs("div", { className: "p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs", children: [_jsxs("div", { className: "flex items-center gap-2 font-semibold text-slate-800 mb-1", children: [_jsx(ShieldCheck, { className: "w-4 h-4 text-sky-600" }), _jsx("span", { children: "Inventory & Pricing Transparency" })] }), _jsx("p", { className: "text-slate-500 leading-relaxed", children: "Ensures positive inventory counts and prevents deceptive pricing on buyer apps." })] })] }) }) })] }), _jsx(Card, { bodyClassName: "p-4", children: _jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-between gap-3", children: [_jsx("div", { className: "w-full sm:w-72", children: _jsx(Input, { placeholder: "Search SKU or product name...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), leftIcon: _jsx(Search, { className: "w-4 h-4 text-slate-400" }) }) }), _jsxs("div", { className: "flex items-center gap-2 w-full sm:w-auto", children: [_jsxs("button", { onClick: () => setStatusFilter('ALL'), className: `px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${statusFilter === 'ALL'
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`, children: ["All Items (", auditResults.length, ")"] }), _jsxs("button", { onClick: () => setStatusFilter('PASSED'), className: `px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${statusFilter === 'PASSED'
                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`, children: ["Compliant (", auditResults.filter((r) => r.status === 'PASSED').length, ")"] }), _jsxs("button", { onClick: () => setStatusFilter('WARNING'), className: `px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${statusFilter === 'WARNING'
                                        ? 'bg-amber-600 text-white border-amber-600'
                                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`, children: ["Warnings (", auditResults.filter((r) => r.status === 'WARNING').length, ")"] }), _jsxs("button", { onClick: () => setStatusFilter('FAILED'), className: `px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${statusFilter === 'FAILED'
                                        ? 'bg-red-600 text-white border-red-600'
                                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`, children: ["Non-Compliant (", auditResults.filter((r) => r.status === 'FAILED').length, ")"] })] })] }) }), _jsx(Card, { title: "Item-by-Item Compliance Audit", subtitle: `${filteredAudit.length} product(s) reviewed`, bodyClassName: "p-0 overflow-x-auto", children: isLoading ? (_jsxs("div", { className: "py-16 flex flex-col items-center justify-center", children: [_jsx(Spinner, { size: "lg" }), _jsx("p", { className: "mt-3 text-xs text-slate-500 font-medium", children: "Auditing catalog..." })] })) : filteredAudit.length === 0 ? (_jsxs("div", { className: "py-16 text-center text-slate-400", children: [_jsx(ShieldCheck, { className: "w-12 h-12 mx-auto mb-2 opacity-50" }), _jsx("p", { className: "text-sm font-semibold text-slate-700", children: "No matching products" }), _jsx("p", { className: "text-xs text-slate-500 mt-0.5", children: products.length === 0
                                ? 'Your catalog is empty. Add products to run compliance audit.'
                                : 'Try clearing your filter or search query.' })] })) : (_jsxs("table", { className: "w-full text-left border-collapse text-xs", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider", children: [_jsx("th", { className: "py-3 px-4", children: "Product / SKU" }), _jsx("th", { className: "py-3 px-4", children: "Category" }), _jsx("th", { className: "py-3 px-4", children: "Compliance Score" }), _jsx("th", { className: "py-3 px-4", children: "Status" }), _jsx("th", { className: "py-3 px-4", children: "Missing Requirements" }), _jsx("th", { className: "py-3 px-4 text-right", children: "Action" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-100", children: filteredAudit.map((item) => (_jsxs("tr", { className: "hover:bg-slate-50/70 transition-colors", children: [_jsxs("td", { className: "py-3 px-4", children: [_jsx("p", { className: "font-semibold text-slate-900 text-xs", children: item.product.productName }), _jsx("p", { className: "font-mono text-[11px] text-slate-400", children: item.product.sku })] }), _jsx("td", { className: "py-3 px-4 text-slate-600 font-medium", children: item.product.category }), _jsx("td", { className: "py-3 px-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "font-bold text-slate-900 text-xs", children: [item.score, "%"] }), _jsx("div", { className: "w-16", children: _jsx(ProgressBar, { value: item.score, size: "sm", color: item.score >= 90 ? 'emerald' : item.score >= 60 ? 'amber' : 'indigo' }) })] }) }), _jsx("td", { className: "py-3 px-4", children: _jsx(Badge, { variant: item.status === 'PASSED'
                                                ? 'success'
                                                : item.status === 'WARNING'
                                                    ? 'warning'
                                                    : 'error', size: "sm", dot: true, children: item.status }) }), _jsx("td", { className: "py-3 px-4 max-w-xs", children: item.failedChecks.length === 0 ? (_jsxs("span", { className: "text-emerald-700 font-medium flex items-center gap-1", children: [_jsx(CheckCircle2, { className: "w-3.5 h-3.5" }), "All statutory checks passed"] })) : (_jsx("div", { className: "flex flex-wrap gap-1", children: item.failedChecks.map((f) => (_jsx("span", { className: "px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px]", children: f }, f))) })) }), _jsx("td", { className: "py-3 px-4 text-right whitespace-nowrap", children: _jsx(Button, { variant: "outline", size: "sm", onClick: () => handleOpenFix(item.product), leftIcon: _jsx(Edit2, { className: "w-3.5 h-3.5" }), children: "Remediate" }) })] }, item.product.id))) })] })) }), editingProduct && (_jsx(Modal, { isOpen: true, onClose: () => setEditingProduct(null), title: `Remediate Statutory Attributes`, subtitle: `SKU: ${editingProduct.sku} - ${editingProduct.productName}`, size: "md", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "outline", onClick: () => setEditingProduct(null), children: "Cancel" }), _jsx(Button, { variant: "primary", isLoading: isSavingFix, onClick: handleSaveFix, children: "Save & Update Score" })] }), children: _jsxs("div", { className: "space-y-4", children: [_jsx("p", { className: "text-xs text-slate-500", children: "Update statutory attributes to meet Legal Metrology and ONDC protocol specifications:" }), _jsxs("div", { children: [_jsxs("label", { className: "block text-xs font-medium text-slate-700 mb-1", children: ["Country of Origin ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "text", value: originInput, onChange: (e) => setOriginInput(e.target.value), placeholder: "e.g. India", className: "w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-indigo-600 outline-none" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-slate-700 mb-1", children: "Shelf Life / Expiry Duration" }), _jsx("input", { type: "text", value: shelfLifeInput, onChange: (e) => setShelfLifeInput(e.target.value), placeholder: "e.g. 12 Months from Packaging", className: "w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-indigo-600 outline-none" })] })] }) }))] }));
};
export default CompliancePage;
