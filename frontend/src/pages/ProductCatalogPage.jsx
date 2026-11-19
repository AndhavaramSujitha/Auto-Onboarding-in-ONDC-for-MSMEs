
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  AlertCircle,
  X,
} from 'lucide-react';

import productService from '../services/productService';
import businessService from '../services/businessService';

import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';

const CATEGORIES = [
  'Grocery & Staples',
  'Packaged Foods',
  'Beverages',
  'Dairy & Bakery',
  'Personal Care',
  'Home Care',
  'Electronics',
  'Fashion & Apparel',
];

const UNITS = ['PCS', 'KG', 'GM', 'L', 'ML', 'PACK', 'BOX', 'BOTTLE'];

const initialFormState = {
  productName: '',
  brand: '',
  sku: '',
  category: 'Grocery & Staples',
  subcategory: '',
  price: 0,
  currency: 'INR',
  availableQuantity: 10,
  unit: 'PCS',
  description: '',
  attributes: {},
};

const ProductCatalogPage = () => {
  const [products, setProducts] = useState([]);
  const [business, setBusiness] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [serverError, setServerError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedCompliance, setSelectedCompliance] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);

  // Product form
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});

  // Custom attributes
  const [attributeKey, setAttributeKey] = useState('');
  const [attributeValue, setAttributeValue] = useState('');

  // Load business and products
  const loadData = async () => {
    setIsLoading(true);
    setServerError(null);

    try {
      try {
        const businessData = await businessService.getMyBusiness();
        setBusiness(businessData);
      } catch (error) {
        console.error('Business profile loading error:', error);
        setBusiness(null);
      }

      const productList = await productService.listProducts();
      setProducts(productList || []);
    } catch (error) {
      console.error('Product loading error:', error);
      setServerError(
        'Failed to fetch product catalog. Verify backend is running.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Dashboard calculations
  const totalItems = products.length;

  const lowStockItems = products.filter(
    (product) => Number(product.availableQuantity) < 5
  ).length;

  const draftProducts = products.filter(
    (product) => product.status === 'DRAFT'
  ).length;

  const publishedProducts = products.filter(
    (product) => product.status === 'PUBLISHED'
  ).length;

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const query = searchQuery.toLowerCase().trim();

      const productName = (product.productName || '').toLowerCase();
      const brand = (product.brand || '').toLowerCase();
      const category = (product.category || '').toLowerCase();
      const sku = (product.sku || '').toLowerCase();

      const matchesSearch =
        !query ||
        productName.includes(query) ||
        brand.includes(query) ||
        category.includes(query) ||
        sku.includes(query);

      const matchesCategory =
        selectedCategory === 'ALL' ||
        product.category === selectedCategory;

      const matchesCompliance =
        selectedCompliance === 'ALL' ||
        product.complianceStatus === selectedCompliance;

      const quantity = Number(product.availableQuantity || 0);

      let matchesStock = true;

      if (stockFilter === 'IN_STOCK') {
        matchesStock = quantity >= 5;
      } else if (stockFilter === 'LOW_STOCK') {
        matchesStock = quantity > 0 && quantity < 5;
      } else if (stockFilter === 'OUT_OF_STOCK') {
        matchesStock = quantity <= 0;
      }

      return (
        matchesSearch &&
        matchesCategory &&
        matchesCompliance &&
        matchesStock
      );
    });
  }, [
    products,
    searchQuery,
    selectedCategory,
    selectedCompliance,
    stockFilter,
  ]);

  // Open create modal
  const handleOpenCreate = () => {
    setFormData({ ...initialFormState });
    setSelectedProduct(null);
    setFormErrors({});
    setAttributeKey('');
    setAttributeValue('');
    setIsFormModalOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (product) => {
    setSelectedProduct(product);

    setFormData({
      productName: product.productName || '',
      brand: product.brand || '',
      sku: product.sku || '',
      category: product.category || 'Grocery & Staples',
      subcategory: product.subcategory || '',
      price: product.price ?? 0,
      currency: product.currency || 'INR',
      availableQuantity: product.availableQuantity ?? 0,
      unit: product.unit || 'PCS',
      description: product.description || '',
      attributes: product.attributes || {},
    });

    setFormErrors({});
    setAttributeKey('');
    setAttributeValue('');
    setIsFormModalOpen(true);
  };

  // Open details modal
  const handleOpenDetails = (product) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };

  // Open delete modal
  const handleOpenDelete = (product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  // Validate product form
  const validateForm = () => {
    const errors = {};

    if (!formData.productName.trim()) {
      errors.productName = 'Product name is required';
    }

    if (!formData.category.trim()) {
      errors.category = 'Category is required';
    }

    if (!formData.sku.trim()) {
      errors.sku = 'SKU is required';
    } else {
      const normalizedSku = formData.sku.trim().toLowerCase();
      const duplicateSku = products.some((product) =>
        (product.sku || '').trim().toLowerCase() === normalizedSku &&
        product.id !== selectedProduct?.id
      );

      if (duplicateSku) {
        errors.sku = 'This SKU already exists. Enter a unique SKU.';
      }
    }

    if (Number(formData.price) < 0) {
      errors.price = 'Price must be 0 or greater';
    }

    if (Number(formData.availableQuantity) < 0) {
      errors.availableQuantity =
        'Available quantity cannot be negative';
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  // Save product
  const handleSaveProduct = async (event) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      if (selectedProduct) {
        const updatedProduct = await productService.updateProduct(
          selectedProduct.id,
          formData
        );

        setProducts((previousProducts) =>
          previousProducts.map((product) =>
            product.id === updatedProduct.id
              ? updatedProduct
              : product
          )
        );

        setSuccessMessage(
          `Product "${updatedProduct.productName}" updated successfully!`
        );
      } else {
        const createdProduct =
          await productService.createProduct(formData);

        setProducts((previousProducts) => [
          createdProduct,
          ...previousProducts,
        ]);

        setSuccessMessage(
          `Product "${createdProduct.productName}" added to catalog!`
        );
      }

      setIsFormModalOpen(false);
    } catch (error) {
      console.error('Save product error:', error);

      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to save product. Ensure your business profile is registered.';

      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Publish a draft product
  const handlePublishProduct = async (product) => {
    if (!product || product.status === 'PUBLISHED') {
      return;
    }

    setServerError(null);
    setSuccessMessage(null);

    try {
      const updatedProduct = await productService.publishProduct(product.id);

      setProducts((previousProducts) =>
    previousProducts.map((item) =>
        item.id === product.id
            ? updatedProduct
            : item
    )
      );

      setSuccessMessage(`Product "${product.productName}" published successfully!`);
    } catch (error) {
      console.error('Publish product error:', error);
      setServerError(
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to publish product. Please check the backend product update API.'
      );
    }
  };

  // Delete product
  const handleConfirmDelete = async () => {
    if (!productToDelete) {
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      await productService.deleteProduct(productToDelete.id);

      setProducts((previousProducts) =>
        previousProducts.filter(
          (product) => product.id !== productToDelete.id
        )
      );

      setSuccessMessage(
        `Product "${productToDelete.productName}" removed.`
      );

      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Delete product error:', error);
      setServerError('Failed to delete product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add custom attribute
  const handleAddAttribute = () => {
    if (!attributeKey.trim() || !attributeValue.trim()) {
      return;
    }

    setFormData((previousData) => ({
      ...previousData,
      attributes: {
        ...(previousData.attributes || {}),
        [attributeKey.trim()]: attributeValue.trim(),
      },
    }));

    setAttributeKey('');
    setAttributeValue('');
  };

  // Remove custom attribute
  const handleRemoveAttribute = (key) => {
    setFormData((previousData) => {
      const updatedAttributes = {
        ...(previousData.attributes || {}),
      };

      delete updatedAttributes[key];

      return {
        ...previousData,
        attributes: updatedAttributes,
      };
    });
  };

  return (
    <div className="space-y-6">

      {/* Business profile warning */}
      {!business && !isLoading && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-900">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />

            <div>
              <h4 className="text-sm font-semibold">
                Business Profile Required
              </h4>

              <p className="text-xs text-amber-700 mt-0.5">
                The ONDC catalog requires a registered business entity
                before creating products.
              </p>
            </div>
          </div>

          <Link to="/business" className="shrink-0">
            <Button
              size="sm"
              variant="primary"
              className="bg-amber-600 hover:bg-amber-700"
            >
              Set Up Business Profile
            </Button>
          </Link>
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
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
            <span className="font-medium">{serverError}</span>
          </div>

          <button
            onClick={() => setServerError(null)}
            className="text-red-600 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Product Catalog
            </h2>

            <Badge variant="indigo" size="sm">
              {totalItems} Items Listed
            </Badge>
          </div>

          <p className="text-xs text-slate-500 mt-1">
            Manage your retail inventory, ONDC category classifications,
            and pricing.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadData}
            title="Refresh list"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>

          <Link to="/ai-analysis">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Sparkles className="w-4 h-4 text-purple-600" />}
              className="border-purple-200 hover:bg-purple-50 text-purple-700"
            >
              AI Catalog Generator
            </Button>
          </Link>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* Dashboard cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

        {/* Total Items */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">
              Total Items
            </p>

            <p className="text-2xl font-bold text-slate-900 mt-1">
              {totalItems}
            </p>
          </div>

          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">
              Low Stock Items
            </p>

            <p className="text-2xl font-bold text-amber-600 mt-1">
              {lowStockItems}
            </p>
          </div>

          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Draft Products */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">
              Draft Products
            </p>

            <p className="text-2xl font-bold text-slate-600 mt-1">
              {draftProducts}
            </p>
          </div>

          <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
            <Edit2 className="w-5 h-5" />
          </div>
        </div>

        {/* Published Products */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">
              Published Products
            </p>

            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {publishedProducts}
            </p>
          </div>

          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Search and filters */}
      <Card bodyClassName="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

          <Input
            placeholder="Search by product name, brand..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />

          <div>
            <select
              value={selectedCategory}
              onChange={(event) =>
                setSelectedCategory(event.target.value)
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            >
              <option value="ALL">All Categories</option>

              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedCompliance}
              onChange={(event) =>
                setSelectedCompliance(event.target.value)
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            >
              <option value="ALL">All Compliance</option>
              <option value="PASSED">Compliant (Passed)</option>
              <option value="PENDING">Pending Review</option>
              <option value="FAILED">Non-Compliant (Failed)</option>
            </select>
          </div>

          <div>
            <select
              value={stockFilter}
              onChange={(event) => setStockFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            >
              <option value="ALL">All Stock Levels</option>
              <option value="IN_STOCK">In Stock (5 or more)</option>
              <option value="LOW_STOCK">Low Stock (1–4)</option>
              <option value="OUT_OF_STOCK">Out of Stock (0)</option>
            </select>
          </div>

        </div>
      </Card>

      {/* Product table */}
      <Card bodyClassName="p-0 overflow-x-auto">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Spinner size="lg" />

            <p className="mt-3 text-xs text-slate-500 font-medium">
              Loading catalog...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center max-w-sm mx-auto px-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6" />
            </div>

            <h3 className="text-base font-semibold text-slate-800">
              No products found
            </h3>

            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {searchQuery || selectedCategory !== 'ALL'
                ? 'Try adjusting your search terms or filters.'
                : 'Get started by adding your first product or use the AI Catalog Generator.'}
            </p>

            <div className="mt-5 flex items-center justify-center gap-3">
              <Button
                size="sm"
                variant="primary"
                onClick={handleOpenCreate}
              >
                Add First Product
              </Button>
            </div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Product / Brand</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Inventory</th>
                <th className="py-3 px-4">Compliance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => {
                const quantity = Number(
                  product.availableQuantity || 0
                );

                const stockTextColor =
                  quantity >= 5
                    ? 'text-emerald-700'
                    : quantity > 0
                      ? 'text-amber-700'
                      : 'text-red-700';

                const stockDotColor =
                  quantity >= 5
                    ? 'bg-emerald-500'
                    : quantity > 0
                      ? 'bg-amber-500'
                      : 'bg-red-500';

                return (
                  <tr
                    key={product.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Product and brand */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {(product.productName || '?').charAt(0)}
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate max-w-[200px]">
                            {product.productName}
                          </p>

                          <p className="text-xs text-slate-400 truncate">
                            {product.brand || 'Generic / Unbranded'}
                          </p>
                          <p className="text-[11px] text-indigo-600 font-medium truncate">
                            SKU: {product.sku || 'Not assigned'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 text-xs text-slate-600">
                      <span className="font-medium text-slate-800">
                        {product.category}
                      </span>

                      {product.subcategory && (
                        <span className="block text-slate-400 text-[11px]">
                          {product.subcategory}
                        </span>
                      )}
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                      ₹{Number(product.price || 0).toFixed(2)}
                    </td>

                    {/* Inventory */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${stockTextColor}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${stockDotColor}`}
                        />

                        {quantity} {product.unit || 'units'}
                      </span>
                    </td>

                    {/* Compliance */}
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          product.complianceStatus === 'PASSED'
                            ? 'success'
                            : product.complianceStatus === 'FAILED'
                              ? 'error'
                              : 'warning'
                        }
                        size="sm"
                        dot
                      >
                        {product.complianceStatus || 'PENDING'}
                      </Badge>
                    </td>

                    {/* Product status / Publish action */}
                    <td className="py-3 px-4">
                      {product.status === 'PUBLISHED' ? (
                        <Badge variant="success" size="sm">
                          PUBLISHED
                        </Badge>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePublishProduct(product)}
                          className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                          title="Click to publish this draft product"
                        >
                          DRAFT · Click to Publish
                        </button>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetails(product)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="View Full Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(product)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenDelete(product)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedProduct ? 'Edit Catalog Product' : 'Add New Product'}
        subtitle="Specify product attributes, pricing, and ONDC retail parameters"
        size="xl"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFormModalOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="primary"
              isLoading={isSubmitting}
              onClick={() => handleSaveProduct()}
            >
              {selectedProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Product name */}
            <div className="sm:col-span-2">
              <Input
                label="Product Name"
                placeholder="e.g. Organic Cold-Pressed Groundnut Oil 1L"
                value={formData.productName}
                onChange={(event) => {
                  setFormData({
                    ...formData,
                    productName: event.target.value,
                  });

                  if (formErrors.productName) {
                    setFormErrors({
                      ...formErrors,
                      productName: '',
                    });
                  }
                }}
                error={formErrors.productName}
                required
              />
            </div>

            {/* SKU */}
            <div className="sm:col-span-2">
              <Input
                label="SKU (Stock Keeping Unit)"
                placeholder="e.g. VEG-COMBO-001"
                value={formData.sku}
                onChange={(event) => {
                  setFormData({
                    ...formData,
                    sku: event.target.value.toUpperCase(),
                  });

                  if (formErrors.sku) {
                    setFormErrors({ ...formErrors, sku: '' });
                  }
                }}
                error={formErrors.sku}
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                Enter a unique code to identify this product in your catalog.
              </p>
            </div>

            {/* Brand */}
            <Input
              label="Brand Name"
              placeholder="e.g. PureFarm"
              value={formData.brand}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  brand: event.target.value,
                })
              }
            />

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>

              <select
                value={formData.category}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    category: event.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory */}
            <Input
              label="Subcategory"
              placeholder="e.g. Cooking Oils"
              value={formData.subcategory}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  subcategory: event.target.value,
                })
              }
            />

            {/* Price */}
            <Input
              label="Retail Price (₹ INR)"
              type="number"
              step="0.01"
              min="0"
              placeholder="349.00"
              value={formData.price}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  price: parseFloat(event.target.value) || 0,
                })
              }
              error={formErrors.price}
              required
            />

            {/* Quantity and unit */}
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Available Stock"
                type="number"
                min="0"
                placeholder="50"
                value={formData.availableQuantity}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    availableQuantity:
                      parseInt(event.target.value, 10) || 0,
                  })
                }
                error={formErrors.availableQuantity}
                required
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Unit
                </label>

                <select
                  value={formData.unit || 'PCS'}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      unit: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
                >
                  {UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Product Description
              </label>

              <textarea
                rows={3}
                placeholder="Provide accurate statutory product details, ingredients, or usage instructions..."
                value={formData.description}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    description: event.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>
          </div>

          {/* Custom attributes */}
          <div className="pt-3 border-t border-slate-200">
            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2">
              Specifications & Custom Attributes
            </h4>

            {formData.attributes &&
              Object.keys(formData.attributes).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {Object.entries(formData.attributes).map(
                    ([key, value]) => (
                      <span
                        key={key}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs border border-slate-200"
                      >
                        <span className="font-semibold">
                          {key}:
                        </span>

                        {String(value)}

                        <button
                          type="button"
                          onClick={() => handleRemoveAttribute(key)}
                          className="text-slate-400 hover:text-red-600 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    )
                  )}
                </div>
              )}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Attribute (e.g. Net Weight)"
                value={attributeKey}
                onChange={(event) =>
                  setAttributeKey(event.target.value)
                }
                className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-600"
              />

              <input
                type="text"
                placeholder="Value (e.g. 500g)"
                value={attributeValue}
                onChange={(event) =>
                  setAttributeValue(event.target.value)
                }
                className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-600"
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddAttribute}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Product"
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>

            <Button
              variant="danger"
              isLoading={isSubmitting}
              onClick={handleConfirmDelete}
            >
              Delete Product
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-slate-900">
              {productToDelete?.productName}
            </span>
            ? This action cannot be undone.
          </p>
        </div>
      </Modal>

      {/* Product details modal */}
      {selectedProduct && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={selectedProduct.productName}
          subtitle={`Product ID: ${selectedProduct.id}`}
          size="lg"
          footer={
            <Button
              variant="outline"
              onClick={() => setIsDetailModalOpen(false)}
            >
              Close
            </Button>
          }
        >
          <div className="space-y-4 text-sm">

            <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100">

              <div>
                <span className="text-xs text-slate-500 block">
                  SKU
                </span>

                <span className="font-medium text-slate-900">
                  {selectedProduct.sku || 'Not assigned'}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">
                  Brand
                </span>

                <span className="font-medium text-slate-900">
                  {selectedProduct.brand || 'Unbranded'}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">
                  Retail Price
                </span>

                <span className="font-bold text-slate-900">
                  ₹{Number(selectedProduct.price || 0).toFixed(2)} (
                  {selectedProduct.currency || 'INR'})
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">
                  Category
                </span>

                <span className="font-medium text-slate-900">
                  {selectedProduct.category}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">
                  Subcategory
                </span>

                <span className="font-medium text-slate-900">
                  {selectedProduct.subcategory || 'General'}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">
                  Available Quantity
                </span>

                <span className="font-medium text-slate-900">
                  {selectedProduct.availableQuantity}{' '}
                  {selectedProduct.unit || 'units'}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">
                  Compliance Status
                </span>

                <Badge
                  variant={
                    selectedProduct.complianceStatus === 'PASSED'
                      ? 'success'
                      : selectedProduct.complianceStatus === 'FAILED'
                        ? 'error'
                        : 'warning'
                  }
                  size="sm"
                  dot
                >
                  {selectedProduct.complianceStatus || 'PENDING'}
                </Badge>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">
                  Product Status
                </span>

                <Badge
                  variant={
                    selectedProduct.status === 'PUBLISHED'
                      ? 'success'
                      : 'neutral'
                  }
                  size="sm"
                >
                  {selectedProduct.status || 'DRAFT'}
                </Badge>
              </div>
            </div>

            {/* Description */}
            <div>
              <span className="text-xs text-slate-500 block">
                Description
              </span>

              <p className="mt-1 text-slate-700 text-xs leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                {selectedProduct.description ||
                  'No description provided.'}
              </p>
            </div>

            {/* Specifications */}
            {selectedProduct.attributes &&
              Object.keys(selectedProduct.attributes).length > 0 && (
                <div>
                  <span className="text-xs text-slate-500 block mb-2">
                    Specifications
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(selectedProduct.attributes).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="p-2 rounded bg-slate-50 border border-slate-100"
                        >
                          <span className="text-slate-500 block">
                            {key}
                          </span>

                          <span className="font-medium text-slate-800">
                            {String(value)}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ProductCatalogPage;
