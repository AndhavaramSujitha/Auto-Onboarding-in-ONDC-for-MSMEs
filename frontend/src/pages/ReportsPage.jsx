
import React, { useState, useEffect, useMemo } from 'react';
import { Printer } from 'lucide-react';

import businessService from '../services/businessService';
import productService from '../services/productService';
import { useAuth } from '../contexts/AuthContext';

import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

export const ReportsPage = () => {
    const { user } = useAuth();

    const [business, setBusiness] = useState(null);
    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');

    const loadData = async () => {
        try {
            const [businessResult, productsResult] = await Promise.allSettled([
                businessService.getMyBusiness(),
                productService.listProducts(),
            ]);

            if (businessResult.status === 'fulfilled') {
                setBusiness(businessResult.value);
            } else {
                setBusiness(null);
            }

            if (productsResult.status === 'fulfilled') {
                setProducts(productsResult.value || []);
            } else {
                setProducts([]);
            }
        } catch (error) {
            console.error('Error loading report data:', error);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Generate business, document and catalog records
    const auditLogs = useMemo(() => {
        const logs = [];

        if (business) {
            logs.push({
                id: 'BUS-001',
                category: 'BUSINESS',
                action: 'Business Profile Details',
                details: `Business: ${business.businessName || 'Not available'}, GSTIN: ${business.gstin || 'Not added'}, State: ${business.state || 'Not available'}.`,
                timestamp: 'Current profile',
                status: 'INFO',
            });
        }

        const uploadedDocs = localStorage.getItem('ondc_uploaded_documents');

        if (uploadedDocs) {
            try {
                const docs = JSON.parse(uploadedDocs);

                docs.forEach((d, idx) => {
                    logs.push({
                        id: `DOC-${idx + 1}`,
                        category: 'DOCUMENT',
                        action: `Document OCR Record: ${d.type || 'Document'}`,
                        details: `File: "${d.fileName || 'Unknown file'}". Processing status: ${d.status || 'Unknown'}.`,
                        timestamp: d.uploadedAt
                            ? new Date(d.uploadedAt).toLocaleString()
                            : 'Not available',
                        status:
                            d.status === 'COMPLETED'
                                ? 'SUCCESS'
                                : 'INFO',
                    });
                });
            } catch (error) {
                console.error('Unable to read document records:', error);
            }
        }

        if (products.length > 0) {
            logs.push({
                id: 'CAT-001',
                category: 'CATALOG',
                action: 'Catalog Inventory Summary',
                details: `${products.length} products currently available in the catalog.`,
                timestamp: 'Current inventory',
                status: 'INFO',
            });
        }

        return logs;
    }, [business, products]);

    // Search and category filtering
    const filteredLogs = useMemo(() => {
        return auditLogs.filter((log) => {
            const matchSearch =
                !searchQuery ||
                log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.id.toLowerCase().includes(searchQuery.toLowerCase());

            const matchCategory =
                selectedCategory === 'ALL' ||
                log.category === selectedCategory;

            return matchSearch && matchCategory;
        });
    }, [auditLogs, searchQuery, selectedCategory]);

    // Print report
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-5">

            {/* Page Header */}
            <div className="bg-white rounded-2xl border border-slate-200/80 px-5 py-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

                <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                            Reports & Activity Records
                        </h2>

                        <Badge variant="indigo" size="sm">
                            Seller Records
                        </Badge>
                    </div>

                    <p className="text-sm text-slate-500 mt-1">
                        Overview of business profile details, document processing records, and catalog inventory.
                    </p>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    leftIcon={<Printer className="w-4 h-4" />}
                >
                    Print Summary
                </Button>
            </div>

            {/* Compact Business & Catalog Summary */}
            <div className="bg-[#20242B] rounded-2xl px-5 py-5 sm:px-6 shadow-md">

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">

                    {/* Business Information */}
                    <div className="min-w-0">
                        <span className="text-[10px] font-bold tracking-widest text-[#E2C994] uppercase">
                            Business Overview
                        </span>

                        <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                            {business?.businessName || 'Seller Enterprise'}
                        </h3>

                        <p className="text-xs sm:text-sm text-slate-300 mt-1">
                            {business?.ownerName || user?.email || 'Not available'}
                            <span className="mx-2 text-slate-500">•</span>
                            {business?.businessType || 'Business Type Not Specified'}
                        </p>
                    </div>

                    {/* Summary Details */}
                    <div className="grid grid-cols-2 gap-3 lg:min-w-[380px]">

                        {/* GSTIN */}
                        <div className="bg-[#30353D] border border-white/10 rounded-xl px-4 py-3 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 rounded-lg bg-[#C6A66B]/15 flex items-center justify-center">
                                    <span className="text-[#E2C994] text-xs font-bold">
                                        G
                                    </span>
                                </div>

                                <span className="text-[11px] text-slate-300 font-medium">
                                    GSTIN Identifier
                                </span>
                            </div>

                            <p className="text-sm font-bold text-white font-mono break-all">
                                {business?.gstin || 'Not added'}
                            </p>
                        </div>

                        {/* Catalog Inventory - Green preserved */}
                        <div className="bg-[#30353D] border border-white/10 rounded-xl px-4 py-3">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                    <span className="text-emerald-300 text-sm font-bold">
                                        P
                                    </span>
                                </div>

                                <span className="text-[11px] text-slate-300 font-medium">
                                    Catalog Inventory
                                </span>
                            </div>

                            <p className="text-sm font-bold text-white">
                                {products.length} Products
                            </p>
                        </div>

                    </div>
                </div>
            </div>

            {/* Activity Records */}
            <Card
                title="Business & Document Activity"
                subtitle={`${filteredLogs.length} records displayed`}
            >
                <div className="space-y-4">

                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2">

                        <div className="w-full sm:w-72">
                            <input
                                type="text"
                                placeholder="Search records, actions, or IDs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-600"
                            />
                        </div>

                        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                            {[
                                'ALL',
                                'BUSINESS',
                                'DOCUMENT',
                                'CATALOG',
                            ].map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap ${
                                        selectedCategory === cat
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Activity Table */}
                    <div className="border border-slate-200 rounded-xl overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">

                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                    <th className="py-3 px-3">Record ID</th>
                                    <th className="py-3 px-3">Category</th>
                                    <th className="py-3 px-3">Action</th>
                                    <th className="py-3 px-3">Details</th>
                                    <th className="py-3 px-3">Status</th>
                                    <th className="py-3 px-3 text-right">Timestamp</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">

                                {filteredLogs.length > 0 ? (
                                    filteredLogs.map((log) => (
                                        <tr
                                            key={log.id}
                                            className="hover:bg-slate-50/70 transition-colors"
                                        >
                                            <td className="py-3 px-3 font-mono font-medium text-slate-600">
                                                {log.id}
                                            </td>

                                            <td className="py-3 px-3">
                                                <span className="px-1.5 py-1 rounded bg-slate-100 font-semibold text-[10px] text-slate-700">
                                                    {log.category}
                                                </span>
                                            </td>

                                            <td className="py-3 px-3 font-semibold text-slate-900">
                                                {log.action}
                                            </td>

                                            <td className="py-3 px-3 text-slate-600 max-w-sm">
                                                {log.details}
                                            </td>

                                            <td className="py-3 px-3">
                                                <Badge
                                                    variant={
                                                        log.status === 'SUCCESS'
                                                            ? 'success'
                                                            : log.status === 'WARNING'
                                                                ? 'warning'
                                                                : 'info'
                                                    }
                                                    size="sm"
                                                    dot
                                                >
                                                    {log.status}
                                                </Badge>
                                            </td>

                                            <td className="py-3 px-3 text-right text-slate-400 font-mono text-[11px]">
                                                {log.timestamp}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="py-10 text-center text-slate-500"
                                        >
                                            No activity records found.
                                        </td>
                                    </tr>
                                )}

                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>

        </div>
    );
};

export default ReportsPage;
