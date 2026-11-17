import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FileText, UploadCloud, Clock, AlertTriangle, CheckCircle2, Eye, File, Sparkles, AlertCircle, Check, } from 'lucide-react';
import documentService from '../services/documentService';
import businessService from '../services/businessService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
const DOCUMENT_TYPES = [
    {
        type: 'GST_CERTIFICATE',
        label: 'GSTIN Registration Certificate',
        description: 'Form GST REG-06 showing legal entity name and 15-digit GSTIN',
        required: true,
    },
    {
        type: 'PAN_CARD',
        label: 'Permanent Account Number (PAN)',
        description: 'Company PAN or Proprietor PAN card copy',
        required: true,
    },
    {
        type: 'UDYAM_REGISTRATION',
        label: 'Udyam MSME Certificate',
        description: 'Ministry of MSME registration certificate for priority onboarding',
        required: false,
    },
    {
        type: 'FSSAI_LICENSE',
        label: 'FSSAI Food License / Registration',
        description: 'Mandatory for food, beverages, and consumable retail categories',
        required: false,
    },
    // {
    //     type: 'BANK_CANCELLED_CHEQUE',
    //     label: 'Cancelled Cheque / Bank Statement',
    //     description: 'Verification of settlement account and IFSC code for buyer payouts',
    //     required: false,
    // },
];
const hasDisplayValue = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (Array.isArray(value)) return value.some(hasDisplayValue);
    if (typeof value === 'object') return Object.values(value).some(hasDisplayValue);
    return true;
};

export const DocumentUploadPage = () => {
    const [business, setBusiness] = useState(null);
    const [isLoadingBusiness, setIsLoadingBusiness] = useState(true);
    // Selected document type for upload
    const [selectedDocType, setSelectedDocType] = useState('GST_CERTIFICATE');
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    // List of uploaded documents stored in state/localStorage
    const [documents, setDocuments] = useState(() => {
        const saved = localStorage.getItem('ondc_uploaded_documents');
        return saved ? JSON.parse(saved) : [];
    });
    // Modal inspection
    const [inspectDoc, setInspectDoc] = useState(null);
    const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
    // Status alerts
    const [successMessage, setSuccessMessage] = useState(null);
    const [serverError, setServerError] = useState(null);
    const fileInputRef = useRef(null);
    // Save documents list to localStorage
    useEffect(() => {
        localStorage.setItem('ondc_uploaded_documents', JSON.stringify(documents));
    }, [documents]);
    // Load business info
    useEffect(() => {
        const checkBusiness = async () => {
            try {
                const b = await businessService.getMyBusiness();
                setBusiness(b);
            }
            catch (err) {
                setBusiness(null);
            }
            finally {
                setIsLoadingBusiness(false);
            }
        };
        checkBusiness();
    }, []);
    // Poll in-flight documents with status PROCESSING or UPLOADED
    useEffect(() => {
        const inFlightDocs = documents.filter((d) => d.status === 'UPLOADED' || d.status === 'PROCESSING');
        if (inFlightDocs.length === 0)
            return;
        const interval = setInterval(async () => {
            for (const doc of inFlightDocs) {
                try {
                    const res = await documentService.getExtraction(doc.id);
                    if (res.status === 'COMPLETED' || res.status === 'FAILED') {
                        let parsedData = {};
                        let parsedConfidence = {};
                        try {
                            if (res.extractedJson)
                                parsedData = JSON.parse(res.extractedJson);
                        }
                        catch (e) {
                            parsedData = { raw: res.extractedJson };
                        }
                        try {
                            if (res.confidenceJson)
                                parsedConfidence = JSON.parse(res.confidenceJson);
                        }
                        catch (e) {
                            parsedConfidence = {};
                        }
                        setDocuments((prev) => prev.map((item) => item.id === doc.id
                            ? {
                                ...item,
                                status: res.status,
                                extractedData: parsedData,
                                confidenceScores: parsedConfidence,
                                requiresReview: res.requiresReview,
                            }
                            : item));
                    }
                }
                catch (err) {
                    // Document may still be processing on server
                }
            }
        }, 4000);
        return () => clearInterval(interval);
    }, [documents]);
    const handleFileSelect = (file) => {
        // Validate file size (< 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setServerError('File size exceeds 10MB limit. Please upload a smaller file.');
            return;
        }
        setSelectedFile(file);
        setServerError(null);
        // Create preview if image
        if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setFilePreview(url);
        }
        else {
            setFilePreview(null);
        }
    };
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const handleDragLeave = () => {
        setIsDragging(false);
    };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };
    const handleUpload = async () => {
        if (!selectedFile)
            return;
        setIsUploading(true);
        setServerError(null);
        setSuccessMessage(null);
        try {
            const response = await documentService.uploadDocument(selectedFile, selectedDocType);
            if (response.status === 'FAILED') {
                throw new Error(response.message || 'Server rejected file upload');
            }
            const newRecord = {
                id: response.documentId,
                type: selectedDocType,
                fileName: selectedFile.name,
                fileSize: selectedFile.size,
                uploadedAt: new Date().toISOString(),
                status: 'PROCESSING',
            };
            setDocuments((prev) => [newRecord, ...prev]);
            setSuccessMessage(`Document "${selectedFile.name}" uploaded successfully! OCR & Groq extraction pipeline started.`);
            setSelectedFile(null);
            setFilePreview(null);
            if (fileInputRef.current)
                fileInputRef.current.value = '';
        }
        catch (err) {
            const msg = err.response?.data?.message ||
                err.message ||
                'Failed to upload document. Verify backend connection on port 8081.';
            setServerError(msg);
        }
        finally {
            setIsUploading(false);
        }
    };
    const handleInspect = async (doc) => {
        setInspectDoc(doc);
        setIsInspectModalOpen(true);
        // If still in progress or completed, fetch fresh extraction
        try {
            const fresh = await documentService.getExtraction(doc.id);
            let parsed = {};
            let conf = {};
            try {
                if (fresh.extractedJson)
                    parsed = JSON.parse(fresh.extractedJson);
            }
            catch {
                parsed = { raw: fresh.extractedJson };
            }
            try {
                if (fresh.confidenceJson)
                    conf = JSON.parse(fresh.confidenceJson);
            }
            catch {
                conf = {};
            }
            setInspectDoc((prev) => prev
                ? {
                    ...prev,
                    status: fresh.status,
                    extractedData: parsed,
                    confidenceScores: conf,
                    requiresReview: fresh.requiresReview,
                }
                : null);
        }
        catch (e) {
            // Keep existing record
        }
    };
    const handleDeleteRecord = (id) => {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
    };
    const formatFileSize = (bytes) => {
        if (bytes < 1024)
            return `${bytes} B`;
        if (bytes < 1024 * 1024)
            return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };
    return (_jsxs("div", { className: "space-y-6", children: [!business && !isLoadingBusiness && (_jsxs("div", { className: "p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-900", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(AlertTriangle, { className: "w-5 h-5 text-amber-600 shrink-0" }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-semibold", children: "Business Registration Required" }), _jsx("p", { className: "text-xs text-amber-700 mt-0.5", children: "KYC documents will be automatically linked to your registered business entity." })] })] }), _jsx(Link, { to: "/business", className: "shrink-0", children: _jsx(Button, { size: "sm", variant: "primary", className: "bg-amber-600 hover:bg-amber-700", children: "Configure Business" }) })] })), successMessage && (_jsxs("div", { className: "p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 text-sm", children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx(CheckCircle2, { className: "w-5 h-5 text-emerald-600 shrink-0" }), _jsx("span", { className: "font-medium", children: successMessage })] }), _jsx("button", { onClick: () => setSuccessMessage(null), className: "text-emerald-600 hover:text-emerald-800", children: "\u00D7" })] })), serverError && (_jsxs("div", { className: "p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-red-800 text-sm", children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-600 shrink-0" }), _jsx("span", { className: "font-medium", children: serverError })] }), _jsx("button", { onClick: () => setServerError(null), className: "text-red-600 hover:text-red-800", children: "\u00D7" })] })), _jsxs("div", { className: "bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("h2", { className: "text-xl font-bold text-slate-900 tracking-tight", children: "Document Center & OCR Extraction" }), _jsx(Badge, { variant: "indigo", size: "sm", children: "AI Pipeline Ready" })] }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "Upload statutory documents to verify entity identity, GSTIN, PAN, and food licenses." })] }), _jsx("div", { className: "flex items-center gap-3", children: _jsxs("span", { className: "text-xs text-slate-500 flex items-center gap-1.5", children: [_jsx(Sparkles, { className: "w-4 h-4 text-purple-600" }), _jsx("span", { children: "Groq OCR Engine Active" })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "lg:col-span-2 space-y-6", children: [_jsx(Card, { title: "Upload Document", subtitle: "Supported formats: PDF, PNG, JPG, JPEG (Max 10MB)", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-700 mb-1.5", children: ["Select Document Category ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("select", { value: selectedDocType, onChange: (e) => setSelectedDocType(e.target.value), className: "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none", children: DOCUMENT_TYPES.map((dt) => (_jsxs("option", { value: dt.type, children: [dt.label, " ", dt.required ? '(Mandatory)' : '(Optional)'] }, dt.type))) })] }), _jsxs("div", { onDragOver: handleDragOver, onDragLeave: handleDragLeave, onDrop: handleDrop, onClick: () => fileInputRef.current?.click(), className: `border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragging
                                                ? 'border-indigo-600 bg-indigo-50/50 scale-[1.01]'
                                                : selectedFile
                                                    ? 'border-emerald-400 bg-emerald-50/30'
                                                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'}`, children: [_jsx("input", { ref: fileInputRef, type: "file", accept: ".pdf,image/png,image/jpeg,image/jpg", className: "hidden", onChange: (e) => {
                                                        if (e.target.files && e.target.files[0]) {
                                                            handleFileSelect(e.target.files[0]);
                                                        }
                                                    } }), selectedFile ? (_jsxs("div", { className: "space-y-3", children: [filePreview ? (_jsx("img", { src: filePreview, alt: "Document preview", className: "w-32 h-32 object-cover rounded-lg mx-auto shadow-sm border border-slate-200" })) : (_jsx("div", { className: "w-16 h-16 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto", children: _jsx(FileText, { className: "w-8 h-8" }) })), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-slate-900", children: selectedFile.name }), _jsxs("p", { className: "text-xs text-slate-500 mt-0.5", children: [formatFileSize(selectedFile.size), " \u2022 Click to choose a different file"] })] })] })) : (_jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto", children: _jsx(UploadCloud, { className: "w-6 h-6" }) }), _jsxs("div", { children: [_jsxs("p", { className: "text-sm font-semibold text-slate-800", children: ["Drag & Drop document here, or ", _jsx("span", { className: "text-indigo-600", children: "Browse" })] }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "High-resolution scans ensure >99% OCR accuracy" })] })] }))] }), _jsxs("div", { className: "flex items-center justify-between pt-2", children: [_jsxs("span", { className: "text-xs text-slate-500", children: ["Target API: ", _jsx("code", { className: "font-mono text-indigo-600", children: "POST /documents/upload" })] }), _jsx(Button, { variant: "primary", size: "md", disabled: !selectedFile, isLoading: isUploading, onClick: handleUpload, leftIcon: _jsx(UploadCloud, { className: "w-4 h-4" }), children: "Upload & Analyze Document" })] })] }) }), _jsx(Card, { title: "Uploaded KYC Documents", subtitle: `${documents.length} document(s) registered in this session`, children: documents.length === 0 ? (_jsxs("div", { className: "py-10 text-center text-slate-400", children: [_jsx(FileText, { className: "w-10 h-10 mx-auto mb-2 opacity-50" }), _jsx("p", { className: "text-sm font-medium text-slate-600", children: "No documents uploaded yet" }), _jsx("p", { className: "text-xs text-slate-400 mt-0.5", children: "Uploaded files will appear here with real-time OCR extraction results." })] })) : (_jsx("div", { className: "divide-y divide-slate-100", children: documents.map((doc) => (_jsxs("div", { className: "py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0", children: _jsx(File, { className: "w-5 h-5" }) }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-sm font-semibold text-slate-900 truncate max-w-[240px]", children: doc.fileName }), _jsxs("p", { className: "text-xs text-slate-400", children: [doc.type, " \u2022 ", formatFileSize(doc.fileSize), " \u2022", ' ', new Date(doc.uploadedAt).toLocaleTimeString()] })] })] }), _jsxs("div", { className: "flex items-center gap-3 self-end sm:self-center", children: [doc.status === 'PROCESSING' && (_jsxs("div", { className: "flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200", children: [_jsx(Spinner, { size: "sm" }), _jsx("span", { children: "Extracting OCR..." })] })), doc.status === 'COMPLETED' && (_jsx(Badge, { variant: "success", size: "sm", dot: true, children: "Extraction Complete" })), doc.status === 'FAILED' && (_jsx(Badge, { variant: "error", size: "sm", dot: true, children: "Extraction Failed" })), _jsx(Button, { variant: "outline", size: "sm", onClick: () => handleInspect(doc), leftIcon: _jsx(Eye, { className: "w-3.5 h-3.5" }), children: "Inspect Result" }), _jsx("button", { onClick: () => handleDeleteRecord(doc.id), className: "text-slate-400 hover:text-red-600 p-1 rounded", title: "Remove from history", children: "\u00D7" })] })] }, doc.id))) })) })] }), _jsxs("div", { className: "space-y-6", children: [_jsx(Card, { title: "ONDC KYC Checklist", subtitle: "Documents required for full network verification", children: _jsx("div", { className: "space-y-3.5", children: DOCUMENT_TYPES.map((item) => {
                                        const uploaded = documents.some((d) => d.type === item.type);
                                        return (_jsxs("div", { className: `p-3 rounded-xl border transition-all ${uploaded
                                                ? 'bg-emerald-50/50 border-emerald-200'
                                                : item.required
                                                    ? 'bg-slate-50 border-slate-200'
                                                    : 'bg-white border-slate-100'}`, children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${uploaded
                                                                        ? 'bg-emerald-500 text-white'
                                                                        : 'bg-slate-200 text-slate-500'}`, children: uploaded ? _jsx(Check, { className: "w-3 h-3" }) : _jsx(Clock, { className: "w-3 h-3" }) }), _jsx("h4", { className: "text-xs font-bold text-slate-800", children: item.label })] }), _jsx(Badge, { variant: uploaded ? 'success' : item.required ? 'warning' : 'neutral', size: "sm", children: uploaded ? 'Uploaded' : item.required ? 'Mandatory' : 'Optional' })] }), _jsx("p", { className: "text-[11px] text-slate-500 mt-1 pl-7 leading-relaxed", children: item.description })] }, item.type));
                                    }) }) }), _jsx(Card, { title: "How OCR Verification Works", children: _jsxs("div", { className: "space-y-2.5 text-xs text-slate-600 leading-relaxed", children: [_jsxs("div", { className: "flex items-start gap-2", children: [_jsx("span", { className: "font-bold text-indigo-600", children: "1." }), _jsx("span", { children: "Tesseract OCR scans text content, registration dates, and serial codes." })] }), _jsxs("div", { className: "flex items-start gap-2", children: [_jsx("span", { className: "font-bold text-indigo-600", children: "2." }), _jsx("span", { children: "Groq LLaMA models parse unstructured certificates into normalized JSON." })] }), _jsxs("div", { className: "flex items-start gap-2", children: [_jsx("span", { className: "font-bold text-indigo-600", children: "3." }), _jsx("span", { children: "Entities are automatically cross-checked against business profile details." })] })] }) })] })] }), inspectDoc && (_jsx(Modal, { isOpen: isInspectModalOpen, onClose: () => setIsInspectModalOpen(false), title: `Extraction Results: ${inspectDoc.fileName}`, subtitle: `Type: ${inspectDoc.type} • Status: ${inspectDoc.status}`, size: "lg", footer: _jsx(Button, { variant: "outline", onClick: () => setIsInspectModalOpen(false), children: "Close" }), children: _jsxs("div", { className: "space-y-4 text-sm", children: [_jsxs("div", { className: "flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs text-slate-500", children: "Processing Status:" }), _jsx(Badge, { variant: inspectDoc.status === 'COMPLETED'
                                                ? 'success'
                                                : inspectDoc.status === 'FAILED'
                                                    ? 'error'
                                                    : 'warning', size: "sm", dot: true, children: inspectDoc.status })] }), inspectDoc.requiresReview !== undefined && (_jsxs("div", { className: "flex items-center gap-1.5 text-xs", children: [_jsx("span", { className: "text-slate-500", children: "Review Flag:" }), _jsx("span", { className: `font-semibold ${inspectDoc.requiresReview ? 'text-amber-600' : 'text-emerald-600'}`, children: inspectDoc.requiresReview ? 'Manual Review Needed' : 'Passed Automated Check' })] }))] }), inspectDoc.extractedData && Object.entries(inspectDoc.extractedData).some(([key, value]) => hasDisplayValue(value)) ? (_jsxs("div", { children: [_jsx("h4", { className: "text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2", children: "Extracted Identity Information" }), _jsx("div", { className: "border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs", children: Object.entries(inspectDoc.extractedData).filter(([key, value]) => hasDisplayValue(value)).map(([k, v]) => (_jsxs("div", { className: "flex justify-between p-3 bg-white hover:bg-slate-50", children: [_jsx("span", { className: "font-medium text-slate-500 capitalize", children: k.replace(/([A-Z])/g, ' $1') }), _jsx("span", { className: "font-semibold text-slate-900 font-mono text-right", children: typeof v === 'object' ? JSON.stringify(v) : String(v) })] }, k))) })] })) : inspectDoc.status === 'PROCESSING' ? (_jsxs("div", { className: "py-8 text-center text-slate-500", children: [_jsx(Spinner, { size: "md" }), _jsx("p", { className: "mt-2 text-xs", children: "AI extraction in progress... Please wait a few seconds." })] })) : (_jsx("div", { className: "p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center", children: "No structured data returned by OCR parser." })), inspectDoc.confidenceScores &&
                            Object.keys(inspectDoc.confidenceScores).length > 0 && (_jsxs("div", { className: "pt-2", children: [_jsx("h4", { className: "text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2", children: "Model Confidence Scores" }), _jsx("div", { className: "grid grid-cols-2 gap-2 text-xs", children: Object.entries(inspectDoc.confidenceScores).map(([k, v]) => (_jsxs("div", { className: "p-2 rounded-lg bg-slate-50 border border-slate-100 flex justify-between", children: [_jsxs("span", { className: "text-slate-600", children: [k, ":"] }), _jsx("span", { className: "font-bold text-indigo-600", children: String(v) })] }, k))) })] }))] }) }))] }));
};
export default DocumentUploadPage;
