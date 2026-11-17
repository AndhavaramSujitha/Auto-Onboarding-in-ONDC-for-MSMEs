import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { Building2, Mail, Phone, MapPin, FileCheck2, CheckCircle2, AlertCircle, Edit3, Save, X, RefreshCw, } from 'lucide-react';
import businessService from '../services/businessService';
import documentService from '../services/documentService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';
import Spinner from '../components/common/Spinner';
const BUSINESS_TYPES = [
    'Sole Proprietorship',
    'Partnership Firm',
    'Private Limited Company',
    'Public Limited Company',
    'Limited Liability Partnership (LLP)',
    'One Person Company (OPC)',
    'Trust / Society',
];
const BUSINESS_CATEGORIES = [
    'Grocery & Staples',
    'Food & Beverage (F&B)',
    'Electronics & Appliances',
    'Beauty & Personal Care',
    'Home & Kitchen',
    'Fashion & Apparel',
    'Health & Wellness',
    'Agriculture & Farming',
    'Stationery & Office Supplies',
];
const AVAILABLE_SELLING_CATEGORIES = [
    'Packaged Foods',
    'Fresh Fruits & Vegetables',
    'Dairy & Bakery',
    'Personal Hygiene & Care',
    'Organic & Gourmet',
    'Beverages & Juices',
    'Household Cleaning & Essentials',
    'Snacks, Biscuits & Sweets',
    'Spices, Oils & Condiments',
    'Cereals, Flours & Grains',
];
const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu & Kashmir', 'Ladakh'
];
export const BusinessProfilePage = () => {
    const [business, setBusiness] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);
    const [serverError, setServerError] = useState(null);
    const [gstFile, setGstFile] = useState(null);
    const [panFile, setPanFile] = useState(null);
    const [gstStatus, setGstStatus] = useState('');
    const [panStatus, setPanStatus] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    // Form State
    const [formData, setFormData] = useState({
        businessName: '',
        ownerName: '',
        businessEmail: '',
        contactNumber: '',
        address: '',
        state: 'Maharashtra',
        district: '',
        pinCode: '',
        businessCategory: 'Grocery & Staples',
        businessType: 'Private Limited Company',
        gstin: '',
        pan: '',
        udyamRegistration: '',
        preferredSellingCategories: ['Packaged Foods', 'Dairy & Bakery'],
    });
    const [formErrors, setFormErrors] = useState({});
    const fetchProfile = async () => {
        setIsLoading(true);
        setServerError(null);
        try {
            const data = await businessService.getMyBusiness();
            setBusiness(data);
            setFormData({
                businessName: data.businessName || '',
                ownerName: data.ownerName || '',
                businessEmail: data.businessEmail || '',
                contactNumber: data.contactNumber || '',
                address: data.address || '',
                state: data.state || 'Maharashtra',
                district: data.district || '',
                pinCode: data.pinCode || '',
                businessCategory: data.businessCategory || 'Grocery & Staples',
                businessType: data.businessType || 'Private Limited Company',
                gstin: data.gstin || '',
                pan: data.pan || '',
                udyamRegistration: data.udyamRegistration || '',
                preferredSellingCategories: data.preferredSellingCategories || [],
            });
            setIsEditing(false);
        }
        catch (err) {
            // If profile not yet created
            if (err.response?.status === 404 || err.response?.status === 400 || err.message?.includes('not found')) {
                setBusiness(null);
                setIsEditing(true); // Open in create mode
            }
            else {
                setServerError('Failed to load business profile. Please check backend connection.');
            }
        }
        finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        fetchProfile();
    }, []);
    const validate = () => {
        const errs = {};
        if (!formData.businessName.trim()) {
            errs.businessName = 'Business name is required';
        }
        if (!formData.ownerName.trim()) {
            errs.ownerName = 'Owner / Authorized signatory name is required';
        }
        if (!formData.businessEmail.trim()) {
            errs.businessEmail = 'Business email is required';
        }
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.businessEmail.trim())) {
            errs.businessEmail = 'Invalid email address';
        }
        if (!formData.contactNumber.trim()) {
            errs.contactNumber = 'Contact phone number is required';
        }
        else if (!/^\d{10}$/.test(formData.contactNumber.replace(/[-+ ]/g, ''))) {
            errs.contactNumber = 'Enter a valid 10-digit phone number';
        }
        if (!formData.address.trim()) {
            errs.address = 'Registered address is required';
        }
        if (!formData.state.trim()) {
            errs.state = 'State is required';
        }
        if (!formData.district.trim()) {
            errs.district = 'District / City is required';
        }
        if (!formData.pinCode.trim()) {
            errs.pinCode = '6-digit PIN code is required';
        }
        else if (!/^\d{6}$/.test(formData.pinCode.trim())) {
            errs.pinCode = 'PIN code must be exactly 6 digits';
        }
        if (!formData.businessCategory.trim()) {
            errs.businessCategory = 'Business category is required';
        }
        if (!formData.businessType.trim()) {
            errs.businessType = 'Business type is required';
        }
        // Optional format checks
        if (formData.gstin?.trim() && formData.gstin.trim().length !== 15) {
            errs.gstin = 'GSTIN must be 15 alphanumeric characters';
        }
        if (formData.pan?.trim() && formData.pan.trim().length !== 10) {
            errs.pan = 'PAN must be 10 alphanumeric characters';
        }
        setFormErrors(errs);
        return Object.keys(errs).length === 0;
    };
    const uploadAndExtract = async (file, type) => {
        if (!business) {
            setServerError('Please save your basic Business Profile before uploading documents.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setServerError('File size must be 10 MB or less.');
            return;
        }
        if (file.type !== 'application/pdf' && !['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
            setServerError('Please upload a PDF, PNG, or JPG file.');
            return;
        }
        const setStatus = type === 'GST_CERTIFICATE' ? setGstStatus : setPanStatus;
        setIsUploading(true);
        setServerError(null);
        setStatus('Uploading document...');
        try {
            const upload = await documentService.uploadDocument(file, type);
            if (!upload.documentId || upload.status === 'FAILED') {
                throw new Error(upload.message || 'Document upload failed.');
            }
            setStatus('Document uploaded. Extracting details...');
            let extraction = null;
            // Check extraction status for up to 60 seconds.
            for (let attempt = 0; attempt < 30; attempt += 1) {
                await new Promise((resolve) => setTimeout(resolve, 2000));
                extraction = await documentService.getExtraction(upload.documentId);
                if (extraction.status === 'COMPLETED' || extraction.status === 'FAILED')
                    break;
            }
            if (!extraction || extraction.status !== 'COMPLETED') {
                throw new Error(extraction?.status === 'FAILED'
                    ? 'Extraction failed. Please check the document and try again.'
                    : 'Extraction is taking longer than expected. Please try again in a moment.');
            }
            const extracted = extraction.extractedJson ? JSON.parse(extraction.extractedJson) : {};
            const pick = (...values) => {
                const value = values.find((item) => typeof item === 'string' && item.trim());
                return typeof value === 'string' ? value.trim() : '';
            };
            setFormData((previous) => ({
                ...previous,
                ...(type === 'GST_CERTIFICATE' ? {
                    gstin: pick(extracted.gstin, extracted.GSTIN, extracted.registrationNumber) || previous.gstin,
                    businessName: pick(extracted.businessName, extracted.legalName, extracted.tradeName) || previous.businessName,
                    address: pick(extracted.businessAddress, extracted.address) || previous.address,
                } : {
                    pan: pick(extracted.pan, extracted.PAN, extracted.panNumber) || previous.pan,
                    ownerName: pick(extracted.ownerName, extracted.name, extracted.panHolderName) || previous.ownerName,
                }),
            }));
            setStatus('Extraction completed. Please review the populated fields and save your profile.');
            setSuccessMessage(`${type === 'GST_CERTIFICATE' ? 'GST certificate' : 'PAN card'} processed. Review the extracted details before saving.`);
        }
        catch (error) {
            setStatus('');
            setServerError(error.response?.data?.message || error.message || 'Document processing failed.');
        }
        finally {
            setIsUploading(false);
        }
    };
    const handleSave = async (e) => {
        e.preventDefault();
        setSuccessMessage(null);
        setServerError(null);
        if (!validate())
            return;
        setIsSaving(true);
        try {
            let saved;
            if (business) {
                // Update existing
                saved = await businessService.updateBusiness(formData);
                setSuccessMessage('Business profile updated successfully!');
            }
            else {
                // Create new
                saved = await businessService.createBusiness(formData);
                setSuccessMessage('Business profile created and registered successfully!');
            }
            setBusiness(saved);
            setIsEditing(false);
        }
        catch (err) {
            const msg = err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                'Failed to save business profile. Check backend logs.';
            setServerError(msg);
        }
        finally {
            setIsSaving(false);
        }
    };
    const toggleCategory = (cat) => {
        setFormData((prev) => {
            const exists = prev.preferredSellingCategories.includes(cat);
            return {
                ...prev,
                preferredSellingCategories: exists
                    ? prev.preferredSellingCategories.filter((c) => c !== cat)
                    : [...prev.preferredSellingCategories, cat],
            };
        });
    };
    if (isLoading) {
        return (_jsxs("div", { className: "py-20 flex flex-col items-center justify-center", children: [_jsx(Spinner, { size: "lg" }), _jsx("p", { className: "mt-4 text-sm text-slate-500 font-medium", children: "Loading business entity profile..." })] }));
    }
    return (_jsxs("div", { className: "space-y-6 max-w-5xl", children: [_jsxs("div", { className: "bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0", children: _jsx(Building2, { className: "w-6 h-6" }) }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h2", { className: "text-xl font-bold text-slate-900 tracking-tight", children: business?.businessName || (isEditing ? 'Configure Business Profile' : 'Business Profile') }), _jsx(Badge, { variant: business ? 'success' : 'warning', size: "sm", dot: true, children: business ? 'Registered Seller' : 'Profile Incomplete' })] }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: business
                                            ? `ONDC Seller Entity ID: ${business.id} • Last Updated: ${business.updatedAt ? new Date(business.updatedAt).toLocaleDateString() : 'Recent'}`
                                            : 'Complete the required statutory and contact details to onboard to the network.' })] })] }), _jsxs("div", { className: "flex items-center gap-3 w-full sm:w-auto", children: [business && !isEditing && (_jsx(Button, { variant: "outline", size: "sm", onClick: () => setIsEditing(true), leftIcon: _jsx(Edit3, { className: "w-4 h-4" }), children: "Edit Profile" })), _jsx(Button, { variant: "ghost", size: "sm", onClick: fetchProfile, title: "Reload from backend", leftIcon: _jsx(RefreshCw, { className: "w-3.5 h-3.5" }), children: "Refresh" })] })] }), successMessage && (_jsxs("div", { className: "p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 text-sm", children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx(CheckCircle2, { className: "w-5 h-5 text-emerald-600 shrink-0" }), _jsx("span", { className: "font-medium", children: successMessage })] }), _jsx("button", { onClick: () => setSuccessMessage(null), className: "text-emerald-600 hover:text-emerald-800", children: _jsx(X, { className: "w-4 h-4" }) })] })), serverError && (_jsxs("div", { className: "p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-red-800 text-sm", children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-600 shrink-0" }), _jsx("span", { className: "font-medium", children: serverError })] }), _jsx("button", { onClick: () => setServerError(null), className: "text-red-600 hover:text-red-800", children: _jsx(X, { className: "w-4 h-4" }) })] })), !isEditing && business && (_jsx("div", { className: "space-y-6", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsx(Card, { title: "Business Identity", subtitle: "Legal company details registered on ONDC", children: _jsxs("div", { className: "space-y-3.5 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-xs text-slate-500 block", children: "Legal Business Name" }), _jsx("span", { className: "font-semibold text-slate-800 text-base", children: business.businessName })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 pt-2 border-t border-slate-100", children: [_jsxs("div", { children: [_jsx("span", { className: "text-xs text-slate-500 block", children: "Owner / Signatory" }), _jsx("span", { className: "font-medium text-slate-800", children: business.ownerName })] }), _jsxs("div", { children: [_jsx("span", { className: "text-xs text-slate-500 block", children: "Business Structure" }), _jsx("span", { className: "font-medium text-slate-800", children: business.businessType })] })] }), _jsxs("div", { className: "pt-2 border-t border-slate-100", children: [_jsx("span", { className: "text-xs text-slate-500 block", children: "Primary Category" }), _jsx(Badge, { variant: "indigo", size: "sm", className: "mt-1", children: business.businessCategory })] })] }) }), _jsx(Card, { title: "Tax & Statutory Registrations", subtitle: "Official Indian commerce credentials", children: _jsxs("div", { className: "space-y-3.5 text-sm", children: [_jsxs("div", { className: "flex items-center justify-between py-1 border-b border-slate-100", children: [_jsxs("div", { children: [_jsx("span", { className: "text-xs text-slate-500 block", children: "GSTIN Number" }), _jsx("span", { className: "font-mono font-medium text-slate-800", children: business.gstin || 'Not Provided' })] }), _jsx(Badge, { variant: business.gstin ? 'success' : 'neutral', size: "sm", children: business.gstin ? 'Verified' : 'Pending' })] }), _jsxs("div", { className: "flex items-center justify-between py-1 border-b border-slate-100", children: [_jsxs("div", { children: [_jsx("span", { className: "text-xs text-slate-500 block", children: "PAN Number" }), _jsx("span", { className: "font-mono font-medium text-slate-800", children: business.pan || 'Not Provided' })] }), _jsx(Badge, { variant: business.pan ? 'success' : 'neutral', size: "sm", children: business.pan ? 'Recorded' : 'Pending' })] }), _jsxs("div", { className: "flex items-center justify-between py-1", children: [_jsxs("div", { children: [_jsx("span", { className: "text-xs text-slate-500 block", children: "Udyam MSME Registration" }), _jsx("span", { className: "font-mono font-medium text-slate-800", children: business.udyamRegistration || 'Not Registered' })] }), _jsx(Badge, { variant: business.udyamRegistration ? 'success' : 'neutral', size: "sm", children: business.udyamRegistration ? 'MSME Active' : 'N/A' })] })] }) }), _jsx(Card, { title: "Contact & Registered Address", subtitle: "Dispatch pickup hub and communications", children: _jsxs("div", { className: "space-y-3 text-sm", children: [_jsxs("div", { className: "flex items-start gap-2.5", children: [_jsx(Mail, { className: "w-4 h-4 text-slate-400 mt-0.5 shrink-0" }), _jsxs("div", { children: [_jsx("span", { className: "text-xs text-slate-500 block", children: "Business Email" }), _jsx("span", { className: "font-medium text-slate-800", children: business.businessEmail })] })] }), _jsxs("div", { className: "flex items-start gap-2.5 pt-2 border-t border-slate-100", children: [_jsx(Phone, { className: "w-4 h-4 text-slate-400 mt-0.5 shrink-0" }), _jsxs("div", { children: [_jsx("span", { className: "text-xs text-slate-500 block", children: "Contact Phone" }), _jsx("span", { className: "font-medium text-slate-800", children: business.contactNumber })] })] }), _jsxs("div", { className: "flex items-start gap-2.5 pt-2 border-t border-slate-100", children: [_jsx(MapPin, { className: "w-4 h-4 text-slate-400 mt-0.5 shrink-0" }), _jsxs("div", { children: [_jsx("span", { className: "text-xs text-slate-500 block", children: "Physical Address" }), _jsxs("p", { className: "font-medium text-slate-800 mt-0.5", children: [business.address, ", ", business.district, ", ", business.state, " - ", business.pinCode] })] })] })] }) }), _jsx(Card, { title: "ONDC Selling Categories", subtitle: "Product domains published to buyer network", children: _jsxs("div", { className: "space-y-3", children: [_jsx("p", { className: "text-xs text-slate-500", children: "Buyer applications discover your catalog under the following designated network categories:" }), _jsx("div", { className: "flex flex-wrap gap-2 pt-1", children: business.preferredSellingCategories && business.preferredSellingCategories.length > 0 ? (business.preferredSellingCategories.map((cat) => (_jsx(Badge, { variant: "indigo", size: "md", children: cat }, cat)))) : (_jsx("span", { className: "text-xs text-slate-400 italic", children: "No categories selected" })) })] }) })] }) })), isEditing && (_jsxs("form", { onSubmit: handleSave, className: "space-y-6", noValidate: true, children: [_jsx(Card, { title: "1. Business Identity", subtitle: "Legal structure and registered company name", children: _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsx(Input, { label: "Legal Business Name", placeholder: "e.g. Acme Organic Foods Pvt Ltd", value: formData.businessName, onChange: (e) => {
                                        setFormData({ ...formData, businessName: e.target.value });
                                        if (formErrors.businessName)
                                            setFormErrors({ ...formErrors, businessName: '' });
                                    }, error: formErrors.businessName, required: true }), _jsx(Input, { label: "Owner / Authorized Signatory Name", placeholder: "e.g. Ramesh Kumar", value: formData.ownerName, onChange: (e) => {
                                        setFormData({ ...formData, ownerName: e.target.value });
                                        if (formErrors.ownerName)
                                            setFormErrors({ ...formErrors, ownerName: '' });
                                    }, error: formErrors.ownerName, required: true }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-700 mb-1.5", children: ["Business Entity Type ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("select", { value: formData.businessType, onChange: (e) => setFormData({ ...formData, businessType: e.target.value }), className: "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none", children: BUSINESS_TYPES.map((type) => (_jsx("option", { value: type, children: type }, type))) })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-700 mb-1.5", children: ["Primary Business Category ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("select", { value: formData.businessCategory, onChange: (e) => setFormData({ ...formData, businessCategory: e.target.value }), className: "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none", children: BUSINESS_CATEGORIES.map((cat) => (_jsx("option", { value: cat, children: cat }, cat))) })] })] }) }), _jsx(Card, { title: "2. Contact Details & Dispatch Location", subtitle: "Communications and warehouse address for logistics", children: _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsx(Input, { label: "Business Email", type: "email", placeholder: "orders@acme.com", value: formData.businessEmail, onChange: (e) => {
                                        setFormData({ ...formData, businessEmail: e.target.value });
                                        if (formErrors.businessEmail)
                                            setFormErrors({ ...formErrors, businessEmail: '' });
                                    }, error: formErrors.businessEmail, leftIcon: _jsx(Mail, { className: "w-4 h-4" }), required: true }), _jsx(Input, { label: "Contact Phone Number (10 digits)", placeholder: "9876543210", value: formData.contactNumber, onChange: (e) => {
                                        setFormData({ ...formData, contactNumber: e.target.value });
                                        if (formErrors.contactNumber)
                                            setFormErrors({ ...formErrors, contactNumber: '' });
                                    }, error: formErrors.contactNumber, leftIcon: _jsx(Phone, { className: "w-4 h-4" }), required: true }), _jsx("div", { className: "sm:col-span-2", children: _jsx(Input, { label: "Registered Address / Warehouse", placeholder: "Plot No. 12, Industrial Area, Phase 2", value: formData.address, onChange: (e) => {
                                            setFormData({ ...formData, address: e.target.value });
                                            if (formErrors.address)
                                                setFormErrors({ ...formErrors, address: '' });
                                        }, error: formErrors.address, leftIcon: _jsx(MapPin, { className: "w-4 h-4" }), required: true }) }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-700 mb-1.5", children: ["State ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("select", { value: formData.state, onChange: (e) => setFormData({ ...formData, state: e.target.value }), className: "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none", children: INDIAN_STATES.map((st) => (_jsx("option", { value: st, children: st }, st))) })] }), _jsx(Input, { label: "District / City", placeholder: "e.g. Pune", value: formData.district, onChange: (e) => {
                                        setFormData({ ...formData, district: e.target.value });
                                        if (formErrors.district)
                                            setFormErrors({ ...formErrors, district: '' });
                                    }, error: formErrors.district, required: true }), _jsx(Input, { label: "PIN Code (6 digits)", placeholder: "411001", maxLength: 6, value: formData.pinCode, onChange: (e) => {
                                        setFormData({ ...formData, pinCode: e.target.value });
                                        if (formErrors.pinCode)
                                            setFormErrors({ ...formErrors, pinCode: '' });
                                    }, error: formErrors.pinCode, required: true })] }) }), _jsxs(Card, { title: "3. GST & PAN Document Verification", subtitle: "Upload your official documents. We'll extract the available details for your review.", children: [!business ? (_jsx("div", { className: "rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800", children: "Save your basic Business Profile first. Then open Edit Profile to upload the GST certificate and PAN card." })) : (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-5", children: [_jsxs("div", { className: "rounded-xl border border-slate-200 p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2 font-semibold text-slate-800", children: [_jsx(FileCheck2, { className: "w-5 h-5 text-indigo-600" }), " GST Certificate"] }), _jsx("p", { className: "text-xs text-slate-500", children: "Upload GST registration certificate as PDF, PNG, or JPG (max 10 MB)." }), _jsx("input", { type: "file", accept: ".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg", disabled: isUploading, onChange: (e) => setGstFile(e.target.files?.[0] || null), className: "block w-full text-sm" }), _jsx("button", { type: "button", disabled: !gstFile || isUploading, onClick: () => gstFile && uploadAndExtract(gstFile, 'GST_CERTIFICATE'), className: "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50", children: "Upload & Extract GST Details" }), gstStatus && _jsx("p", { className: "text-xs text-indigo-700", children: gstStatus }), formData.gstin && _jsxs("p", { className: "text-xs text-slate-600", children: ["Extracted GSTIN: ", _jsx("strong", { className: "font-mono", children: formData.gstin })] })] }), _jsxs("div", { className: "rounded-xl border border-slate-200 p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2 font-semibold text-slate-800", children: [_jsx(FileCheck2, { className: "w-5 h-5 text-indigo-600" }), " PAN Card"] }), _jsx("p", { className: "text-xs text-slate-500", children: "Upload PAN card as PDF, PNG, or JPG (max 10 MB)." }), _jsx("input", { type: "file", accept: ".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg", disabled: isUploading, onChange: (e) => setPanFile(e.target.files?.[0] || null), className: "block w-full text-sm" }), _jsx("button", { type: "button", disabled: !panFile || isUploading, onClick: () => panFile && uploadAndExtract(panFile, 'PAN_CARD'), className: "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50", children: "Upload & Extract PAN Details" }), panStatus && _jsx("p", { className: "text-xs text-indigo-700", children: panStatus }), formData.pan && _jsxs("p", { className: "text-xs text-slate-600", children: ["Extracted PAN: ", _jsx("strong", { className: "font-mono", children: formData.pan })] })] })] })), _jsx("div", { className: "mt-5 border-t border-slate-100 pt-4", children: _jsx(Input, { label: "Udyam Registration (Optional)", placeholder: "UDYAM-MH-12-0012345", value: formData.udyamRegistration || '', onChange: (e) => setFormData({ ...formData, udyamRegistration: e.target.value.toUpperCase() }), helperText: "Optional MSME registration number." }) }), _jsx("p", { className: "mt-3 text-xs text-slate-500", children: "Extracted values are not independently verified against government databases. Please review them before saving." })] }), _jsxs(Card, { title: "4. Preferred Selling Categories", subtitle: "Select the ONDC retail product classes you intend to list", children: [_jsx("p", { className: "text-xs text-slate-500 mb-3", children: "Click to select all categories applicable to your current or planned inventory:" }), _jsx("div", { className: "flex flex-wrap gap-2.5", children: AVAILABLE_SELLING_CATEGORIES.map((cat) => {
                                    const isSelected = formData.preferredSellingCategories.includes(cat);
                                    return (_jsxs("button", { type: "button", onClick: () => toggleCategory(cat), className: `px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${isSelected
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                            : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/40'}`, children: [isSelected ? '✓ ' : '+ ', cat] }, cat));
                                }) })] }), _jsxs("div", { className: "flex items-center justify-end gap-3 pt-4 border-t border-slate-200", children: [business && (_jsx(Button, { type: "button", variant: "outline", onClick: () => {
                                    setIsEditing(false);
                                    setFormErrors({});
                                }, children: "Cancel" })), _jsx(Button, { type: "submit", variant: "primary", size: "lg", isLoading: isSaving || isUploading, leftIcon: _jsx(Save, { className: "w-4 h-4" }), children: business ? 'Save Profile Changes' : 'Register Business Profile' })] })] }))] }));
};
export default BusinessProfilePage;
