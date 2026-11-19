
import React, { useState, useEffect, useMemo } from 'react';
import {
    ShieldCheck,
    AlertCircle,
    CheckCircle2,
    FileCheck,
    RefreshCw,
    Search,
    Scale,
    Award,
    Edit2,
    X,
} from 'lucide-react';

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

    // Quick remediation modal
    const [editingProduct, setEditingProduct] = useState(null);
    const [originInput, setOriginInput] = useState('India');
    const [shelfLifeInput, setShelfLifeInput] = useState('12 Months');
    const [isSavingFix, setIsSavingFix] = useState(false);

    // Alerts
    const [successMessage, setSuccessMessage] = useState(null);
    const [serverError, setServerError] = useState(null);

    // Load products and business
    const loadData = async () => {
        setIsLoading(true);
        setServerError(null);

        try {
            try {
                const businessData = await businessService.getMyBusiness();
                setBusiness(businessData);
            } catch (error) {
                console.error('Business loading error:', error);
                setBusiness(null);
            }

            const list = await productService.listProducts();
            setProducts(list || []);
        } catch (error) {
            console.error('Product loading error:', error);
            setServerError(
                'Failed to fetch catalog items for compliance audit.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Calculate basic product checks
    const auditResults = useMemo(() => {
        return products.map((product) => {
            const passed = [];
            const failed = [];

            const sku = product.sku || '';
            const description = product.description || '';
            const brand = product.brand || '';
            const unit = product.unit || '';
            const attributes = product.attributes || {};

            // Check 1: SKU
            if (sku.trim().length >= 3) {
                passed.push('Valid Alphanumeric SKU Code');
            } else {
                failed.push('Missing or invalid SKU Code');
            }

            // Check 2: Description
            if (description.trim().length >= 15) {
                passed.push('Detailed Description (> 15 chars)');
            } else {
                failed.push('Description missing or too brief');
            }

            // Check 3: Price
            if (Number(product.price) > 0) {
                passed.push('Positive Retail Price');
            } else {
                failed.push('Zero or invalid Price');
            }

            // Check 4: Stock
            if (Number(product.availableQuantity) > 0) {
                passed.push('Positive Stock Level');
            } else {
                failed.push('Out of Stock (0 units)');
            }

            // Check 5: Country of Origin
            const hasOrigin =
                attributes['Country of Origin'] ||
                attributes['country_of_origin'] ||
                attributes['origin'] ||
                attributes['Origin'];

            if (hasOrigin) {
                passed.push('Country of Origin Specified');
            } else {
                failed.push('Missing Country of Origin');
            }

            // Check 6: Unit
            if (unit.trim().length > 0) {
                passed.push('Net Quantity / Unit Defined');
            } else {
                failed.push('Missing Unit of Measurement');
            }

            // Check 7: Brand
            if (brand.trim().length > 0) {
                passed.push('Brand / Manufacturer Identified');
            } else {
                failed.push('Unspecified Brand/Manufacturer');
            }

            const totalChecks = passed.length + failed.length;
            const score = Math.round(
                (passed.length / totalChecks) * 100
            );

            let status = 'PASSED';

            if (score < 60) {
                status = 'FAILED';
            } else if (score < 90) {
                status = 'WARNING';
            }

            return {
                product,
                score,
                passedChecks: passed,
                failedChecks: failed,
                status,
            };
        });
    }, [products]);

    // Overall catalog score
    const overallScore = useMemo(() => {
        if (auditResults.length === 0) return 100;

        const total = auditResults.reduce(
            (sum, item) => sum + item.score,
            0
        );

        return Math.round(total / auditResults.length);
    }, [auditResults]);

    // Filter products
    const filteredAudit = useMemo(() => {
        return auditResults.filter((item) => {
            const query = searchQuery.toLowerCase().trim();

            const productName = (
                item.product.productName || ''
            ).toLowerCase();

            const sku = (
                item.product.sku || ''
            ).toLowerCase();

            const matchSearch =
                !query ||
                productName.includes(query) ||
                sku.includes(query);

            const matchStatus =
                statusFilter === 'ALL' ||
                item.status === statusFilter;

            return matchSearch && matchStatus;
        });
    }, [auditResults, searchQuery, statusFilter]);

    // IMPORTANT: Run the actual backend compliance audit
    const handleRunAudit = async () => {
        setIsAuditing(true);
        setServerError(null);
        setSuccessMessage(null);

        try {
            const updatedProducts = await Promise.all(
                products.map((product) =>
                    productService.runComplianceAudit(product.id)
                )
            );

            setProducts((currentProducts) =>
                currentProducts.map((product) => {
                    const updated = updatedProducts.find(
                        (item) => item.id === product.id
                    );

                    return updated
                        ? { ...product, ...updated }
                        : product;
                })
            );

            setSuccessMessage(
                'Catalog audit completed. Compliance results saved successfully!'
            );
        } catch (error) {
            console.error('Compliance audit failed:', error);

            setServerError(
                error.response?.data?.message ||
                'Failed to complete compliance audit. Please try again.'
            );
        } finally {
            setIsAuditing(false);
        }
    };

    // Open remediation modal
    const handleOpenFix = (product) => {
        setEditingProduct(product);

        const attributes = product.attributes || {};

        setOriginInput(
            attributes['Country of Origin'] || 'India'
        );

        setShelfLifeInput(
            attributes['Shelf Life'] || '12 Months'
        );
    };

    // Save remediation attributes
    const handleSaveFix = async () => {
        if (!editingProduct) return;

        if (!originInput.trim()) {
            setServerError('Please enter the Country of Origin.');
            return;
        }

        setIsSavingFix(true);
        setServerError(null);
        setSuccessMessage(null);

        try {
            const updatedAttributes = {
                ...(editingProduct.attributes || {}),
                'Country of Origin': originInput.trim(),
                'Shelf Life': shelfLifeInput.trim(),
            };

            const updated = await productService.updateProduct(
                editingProduct.id,
                {
                    productName: editingProduct.productName,
                    sku: editingProduct.sku,
                    brand: editingProduct.brand,
                    category: editingProduct.category,
                    subcategory: editingProduct.subcategory,
                    price: editingProduct.price,
                    currency: editingProduct.currency,
                    availableQuantity: editingProduct.availableQuantity,
                    unit: editingProduct.unit,
                    description: editingProduct.description,
                    attributes: updatedAttributes,
                    images: editingProduct.images || [],
                }
            );

            setProducts((previous) =>
                previous.map((item) =>
                    item.id === updated.id
                        ? { ...item, ...updated }
                        : item
                )
            );

            setSuccessMessage(
                'Product attributes updated. Run the audit again to calculate the latest score.'
            );

            setEditingProduct(null);
        } catch (error) {
            console.error('Remediation error:', error);

            setServerError(
                error.response?.data?.message ||
                'Failed to save compliance attributes.'
            );
        } finally {
            setIsSavingFix(false);
        }
    };

    return (
        <div className="space-y-6">

            {/* Success message */}
            {successMessage && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 text-sm">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="font-medium">
                            {successMessage}
                        </span>
                    </div>

                    <button
                        onClick={() => setSuccessMessage(null)}
                        className="text-emerald-600 hover:text-emerald-800"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Error message */}
            {serverError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-red-800 text-sm">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                        <span className="font-medium">
                            {serverError}
                        </span>
                    </div>

                    <button
                        onClick={() => setServerError(null)}
                        className="text-red-600 hover:text-red-800"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                            ONDC Compliance & Legal Metrology
                        </h2>

                        <Badge variant="success" size="sm">
                            Catalog Checks
                        </Badge>
                    </div>

                    <p className="text-xs text-slate-500 mt-1">
                        Review basic product information and identify missing catalog attributes.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="primary"
                        size="sm"
                        isLoading={isAuditing}
                        onClick={handleRunAudit}
                        leftIcon={<RefreshCw className="w-4 h-4" />}
                    >
                        Run Catalog Audit
                    </Button>
                </div>
            </div>

            {/* Score and guidelines */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <Card title="Catalog Compliance Health">
                    <div className="space-y-4">
                        <div className="flex items-baseline justify-between">
                            <span className="text-4xl font-extrabold text-slate-900">
                                {overallScore}%
                            </span>

                            <Badge
                                variant={
                                    overallScore >= 90
                                        ? 'success'
                                        : overallScore >= 70
                                            ? 'warning'
                                            : 'error'
                                }
                                size="md"
                            >
                                {overallScore >= 90
                                    ? 'Basic Checks Passed'
                                    : overallScore >= 70
                                        ? 'Remediations Required'
                                        : 'Action Needed'}
                            </Badge>
                        </div>

                        <ProgressBar
                            value={overallScore}
                            color={
                                overallScore >= 90
                                    ? 'emerald'
                                    : overallScore >= 70
                                        ? 'amber'
                                        : 'indigo'
                            }
                            size="md"
                        />

                        <p className="text-xs text-slate-500 leading-relaxed">
                            {overallScore >= 90
                                ? 'Your products passed the basic catalog data checks. Official ONDC and regulatory compliance must be verified separately.'
                                : 'Some products are missing basic attributes such as SKU, Country of Origin, brand or unit.'}
                        </p>
                    </div>
                </Card>

                <div className="lg:col-span-2">
                    <Card title="Catalog Guidelines to Review">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                                <div className="flex items-center gap-2 font-semibold text-slate-800 mb-1">
                                    <Scale className="w-4 h-4 text-indigo-600" />
                                    Legal Metrology
                                </div>

                                <p className="text-slate-500 leading-relaxed">
                                    Review applicable packaging declarations, quantity, manufacturer details and MRP requirements.
                                </p>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                                <div className="flex items-center gap-2 font-semibold text-slate-800 mb-1">
                                    <FileCheck className="w-4 h-4 text-emerald-600" />
                                    ONDC Catalog
                                </div>

                                <p className="text-slate-500 leading-relaxed">
                                    Check product information and required catalog fields before network submission.
                                </p>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                                <div className="flex items-center gap-2 font-semibold text-slate-800 mb-1">
                                    <Award className="w-4 h-4 text-amber-600" />
                                    Food Safety
                                </div>

                                <p className="text-slate-500 leading-relaxed">
                                    Food businesses should separately verify applicable FSSAI registration and labeling requirements.
                                </p>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                                <div className="flex items-center gap-2 font-semibold text-slate-800 mb-1">
                                    <ShieldCheck className="w-4 h-4 text-sky-600" />
                                    Inventory & Pricing
                                </div>

                                <p className="text-slate-500 leading-relaxed">
                                    Review positive inventory levels and accurate product pricing.
                                </p>
                            </div>

                        </div>
                    </Card>
                </div>
            </div>

            {/* Search and filters */}
            <Card bodyClassName="p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">

                    <div className="w-full sm:w-72">
                        <Input
                            placeholder="Search SKU or product name..."
                            value={searchQuery}
                            onChange={(value) =>
                                setSearchQuery(
                                    typeof value === 'string'
                                        ? value
                                        : value.target.value
                                )
                            }
                            leftIcon={
                                <Search className="w-4 h-4 text-slate-400" />
                            }
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">

                        {[
                            { id: 'ALL', label: `All Items (${auditResults.length})` },
                            {
                                id: 'PASSED',
                                label: `Compliant (${auditResults.filter((r) => r.status === 'PASSED').length})`,
                            },
                            {
                                id: 'WARNING',
                                label: `Warnings (${auditResults.filter((r) => r.status === 'WARNING').length})`,
                            },
                            {
                                id: 'FAILED',
                                label: `Non-Compliant (${auditResults.filter((r) => r.status === 'FAILED').length})`,
                            },
                        ].map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setStatusFilter(filter.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                    statusFilter === filter.id
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                {filter.label}
                            </button>
                        ))}

                    </div>
                </div>
            </Card>

            {/* Product audit table */}
            <Card
                title="Item-by-Item Compliance Audit"
                subtitle={`${filteredAudit.length} product(s) reviewed`}
                bodyClassName="p-0 overflow-x-auto"
            >
                {isLoading ? (
                    <div className="py-16 flex flex-col items-center justify-center">
                        <Spinner size="lg" />
                        <p className="mt-3 text-xs text-slate-500 font-medium">
                            Loading catalog...
                        </p>
                    </div>
                ) : filteredAudit.length === 0 ? (
                    <div className="py-16 text-center text-slate-400">
                        <ShieldCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />

                        <p className="text-sm font-semibold text-slate-700">
                            No matching products
                        </p>

                        <p className="text-xs text-slate-500 mt-0.5">
                            {products.length === 0
                                ? 'Your catalog is empty. Add products to run compliance audit.'
                                : 'Try clearing your filter or search query.'}
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                <th className="py-3 px-4">Product / SKU</th>
                                <th className="py-3 px-4">Category</th>
                                <th className="py-3 px-4">Compliance Score</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4">Missing Requirements</th>
                                <th className="py-3 px-4 text-right">Action</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {filteredAudit.map((item) => (
                                <tr
                                    key={item.product.id}
                                    className="hover:bg-slate-50/70 transition-colors"
                                >
                                    <td className="py-3 px-4">
                                        <p className="font-semibold text-slate-900 text-xs">
                                            {item.product.productName}
                                        </p>

                                        <p className="font-mono text-[11px] text-slate-400">
                                            {item.product.sku || 'No SKU'}
                                        </p>
                                    </td>

                                    <td className="py-3 px-4 text-slate-600 font-medium">
                                        {item.product.category || 'Uncategorized'}
                                    </td>

                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900 text-xs">
                                                {item.score}%
                                            </span>

                                            <div className="w-16">
                                                <ProgressBar
                                                    value={item.score}
                                                    size="sm"
                                                    color={
                                                        item.score >= 90
                                                            ? 'emerald'
                                                            : item.score >= 60
                                                                ? 'amber'
                                                                : 'indigo'
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </td>

                                    <td className="py-3 px-4">
                                        <Badge
                                            variant={
                                                item.status === 'PASSED'
                                                    ? 'success'
                                                    : item.status === 'WARNING'
                                                        ? 'warning'
                                                        : 'error'
                                            }
                                            size="sm"
                                            dot
                                        >
                                            {item.status}
                                        </Badge>
                                    </td>

                                    <td className="py-3 px-4 max-w-xs">
                                        {item.failedChecks.length === 0 ? (
                                            <span className="text-emerald-700 font-medium flex items-center gap-1">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Basic checks passed
                                            </span>
                                        ) : (
                                            <div className="flex flex-wrap gap-1">
                                                {item.failedChecks.map((failure) => (
                                                    <span
                                                        key={failure}
                                                        className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px]"
                                                    >
                                                        {failure}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </td>

                                    <td className="py-3 px-4 text-right whitespace-nowrap">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handleOpenFix(item.product)
                                            }
                                            leftIcon={
                                                <Edit2 className="w-3.5 h-3.5" />
                                            }
                                        >
                                            Remediate
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>

            {/* Remediation modal */}
            {editingProduct && (
                <Modal
                    isOpen={true}
                    onClose={() => setEditingProduct(null)}
                    title="Remediate Product Attributes"
                    subtitle={`SKU: ${editingProduct.sku || 'Not specified'} - ${editingProduct.productName}`}
                    size="md"
                    footer={
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setEditingProduct(null)}
                            >
                                Cancel
                            </Button>

                            <Button
                                variant="primary"
                                isLoading={isSavingFix}
                                onClick={handleSaveFix}
                            >
                                Save Attributes
                            </Button>
                        </>
                    }
                >
                    <div className="space-y-4">

                        <p className="text-xs text-slate-500">
                            Update missing product attributes. Run the audit again after saving to calculate the latest score.
                        </p>

                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                Country of Origin
                                <span className="text-red-500"> *</span>
                            </label>

                            <input
                                type="text"
                                value={originInput}
                                onChange={(e) =>
                                    setOriginInput(e.target.value)
                                }
                                placeholder="e.g. India"
                                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-indigo-600 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                Shelf Life / Expiry Duration
                            </label>

                            <input
                                type="text"
                                value={shelfLifeInput}
                                onChange={(e) =>
                                    setShelfLifeInput(e.target.value)
                                }
                                placeholder="e.g. 12 Months from Packaging"
                                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-indigo-600 outline-none"
                            />
                        </div>

                    </div>
                </Modal>
            )}

        </div>
    );
};

export default CompliancePage;
