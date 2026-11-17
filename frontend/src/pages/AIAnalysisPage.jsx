
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Eye,
  EyeOff,
  Package,
} from 'lucide-react';
import productService from '../services/productService';

export const AIAnalysisPage = () => {
  const navigate = useNavigate();

  const [descriptionInput, setDescriptionInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [generated, setGenerated] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    productName: '',
    description: '',
    category: '',
    subcategory: '',
    brand: '',
    unit: '',
    price: '',
    currency: 'INR',
    availableQuantity: '',
    sku: '',
    attributes: {},
  });

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();

    setErrorMessage('');
    setSuccessMessage('');

    if (!descriptionInput.trim()) {
      setErrorMessage('Please enter a product description.');
      return;
    }

    setIsGenerating(true);
    setGenerated(false);

    try {
      const response = await productService.generateCatalog(
        descriptionInput.trim()
      );

      let aiData =
        typeof response === 'string'
          ? JSON.parse(response)
          : response;

      if (aiData?.choices?.[0]?.message?.content) {
        let content = aiData.choices[0].message.content;
        content = content
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/\s*```$/, '');

        aiData = JSON.parse(content);
      }

      if (!aiData || typeof aiData !== 'object') {
        throw new Error('AI returned invalid product details.');
      }

      setFormData({
        productName: aiData.productName || '',
        description: aiData.description || '',
        category: aiData.category || '',
        subcategory: aiData.subcategory || '',
        brand: aiData.brand || '',
        unit: aiData.unit || '',
        price: '',
        currency: 'INR',
        availableQuantity: '',
        sku: '',
        attributes: aiData.attributes || {},
      });

      setGenerated(true);
      setSuccessMessage(
        'Product details generated successfully! Review and edit before saving.'
      );
    } catch (error) {
      console.error('Catalog generation error:', error);

      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          'Unable to generate product catalog. Please try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAttributeChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [key]: value,
      },
    }));
  };

  const handleAddAttribute = () => {
    const name = window.prompt('Enter attribute name:');

    if (!name || !name.trim()) return;

    if (
      Object.prototype.hasOwnProperty.call(
        formData.attributes,
        name.trim()
      )
    ) {
      setErrorMessage('That attribute already exists.');
      return;
    }

    handleAttributeChange(name.trim(), '');
  };

  const handleRemoveAttribute = (key) => {
    setFormData((prev) => {
      const updatedAttributes = { ...prev.attributes };
      delete updatedAttributes[key];

      return {
        ...prev,
        attributes: updatedAttributes,
      };
    });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();

    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.productName.trim()) {
      setErrorMessage('Product name is required.');
      return;
    }

    if (!formData.description.trim()) {
      setErrorMessage('Product description is required.');
      return;
    }

    if (!formData.category.trim()) {
      setErrorMessage('Product category is required.');
      return;
    }

    if (formData.price === '' || Number(formData.price) <= 0) {
      setErrorMessage('Please enter a valid product price.');
      return;
    }

    if (
      formData.availableQuantity === '' ||
      !Number.isInteger(Number(formData.availableQuantity)) ||
      Number(formData.availableQuantity) < 0
    ) {
      setErrorMessage('Please enter a valid stock quantity.');
      return;
    }

    setIsSaving(true);

    try {
      const productPayload = {
        productName: formData.productName.trim(),
        description: formData.description.trim(),
        category: formData.category.trim(),
        subcategory: formData.subcategory.trim(),
        brand: formData.brand.trim(),
        sku: formData.sku.trim(),
        price: Number(formData.price),
        currency: 'INR',
        availableQuantity: Number(formData.availableQuantity),
        unit: formData.unit.trim(),
        attributes: formData.attributes,
      };

      await productService.createProduct(productPayload);

      setSuccessMessage('Product saved successfully!');
      navigate('/products');
    } catch (error) {
      console.error('Product save error:', error);

      setErrorMessage(
        error.response?.data?.message ||
          'Unable to save product. Please check your details and try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-[#D9DDE2] bg-white p-3 text-sm text-[#20242B] outline-none transition-all placeholder:text-[#A0A5AD] focus:border-[#C6A66B] focus:ring-2 focus:ring-[#C6A66B]/20';

  const labelClass =
    'mb-2 block text-sm font-semibold text-[#343A40]';

  return (
    <div className="space-y-6">

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#20242B] p-6 text-white shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border-[35px] border-[#C6A66B]/[0.07]" />

        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#C6A66B]/30 bg-[#C6A66B]/10 px-3 py-1 text-xs font-semibold text-[#E2C994]">
              <Sparkles className="h-3.5 w-3.5" />
              AI POWERED CATALOG
            </span>

            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              AI Product Catalog Generator
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#C3C7CD]">
              Generate structured product details using AI.
              Enter your product description to get started.
            </p>
          </div>

          <Link
            to="/products"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#C6A66B] bg-transparent px-4 py-2.5 text-sm font-semibold text-[#E2C994] transition-all hover:bg-[#C6A66B] hover:text-[#20242B]"
          >
            <Package className="h-4 w-4" />
            View Catalog
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <span className="font-medium">{successMessage}</span>
          </div>

          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="text-emerald-600 hover:text-emerald-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
            <span className="font-medium">{errorMessage}</span>
          </div>

          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-red-600 hover:text-red-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Product Description */}
      <div className="rounded-2xl border border-[#E3E6E9] bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-[#20242B]">
            Describe Your Product
          </h2>

          <p className="mt-1 text-sm text-[#858B94]">
            Provide product information so AI can generate a structured catalog entry.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-5">
          <div>
            <label className={labelClass}>
              Product Description
              <span className="text-red-500"> *</span>
            </label>

            <textarea
              value={descriptionInput}
              onChange={(e) => setDescriptionInput(e.target.value)}
              rows={5}
              maxLength={3000}
              placeholder="Example: Premium cotton men's casual shirt, blue color, full sleeves, comfortable fabric, suitable for daily wear..."
              className={`${inputClass} resize-y rounded-xl p-4`}
              required
            />

            <p className="mt-1 text-right text-xs text-[#9298A0]">
              {descriptionInput.length}/3000 characters
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#858B94]">
              Enter a product description to generate its catalog.
            </p>

            <button
              type="submit"
              disabled={isGenerating || !descriptionInput.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#C6A66B] bg-[#C6A66B] px-6 py-3 text-sm font-semibold text-[#20242B] transition-all hover:border-[#D8BC7A] hover:bg-[#D8BC7A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              {isGenerating
                ? 'Generating Catalog...'
                : 'Generate Product Catalog'}
            </button>
          </div>
        </form>
      </div>

      {/* AI Generated Review Section */}
      {generated && (
        <form
          onSubmit={handleSaveProduct}
          className="space-y-6 rounded-2xl border border-[#E3E6E9] bg-white p-5 shadow-sm sm:p-7"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#20242B]">
                Review Generated Product
              </h2>

              <p className="mt-1 text-sm text-[#858B94]">
                Check and edit the AI-generated information before saving.
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#C6A66B]/40 bg-[#F4F1E9] px-3 py-2 text-xs font-semibold text-[#8E7442]">
              <Sparkles className="h-3.5 w-3.5" />
              AI Generated · Review Required
            </span>
          </div>

          {/* Basic Details */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>Product Name *</label>
              <input
                value={formData.productName}
                onChange={(e) => updateField('productName', e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Brand</label>
              <input
                value={formData.brand}
                onChange={(e) => updateField('brand', e.target.value)}
                placeholder="Enter brand if known"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Category *</label>
              <input
                value={formData.category}
                onChange={(e) => updateField('category', e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Subcategory</label>
              <input
                value={formData.subcategory}
                onChange={(e) => updateField('subcategory', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Unit</label>
              <input
                value={formData.unit}
                onChange={(e) => updateField('unit', e.target.value)}
                placeholder="Example: PCS, KG, LTR"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>SKU (Optional)</label>
              <input
                value={formData.sku}
                onChange={(e) => updateField('sku', e.target.value)}
                placeholder="Enter SKU if available"
                className={inputClass}
              />
            </div>
          </div>

          {/* Product Description */}
          <div>
            <label className={labelClass}>Product Description *</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              required
              className={`${inputClass} resize-y`}
            />
          </div>

          {/* Seller Information */}
          <div className="space-y-4 rounded-xl border border-[#E6D9BB] bg-[#FAF8F2] p-5">
            <div>
              <h3 className="font-bold text-[#20242B]">
                Seller Information
              </h3>

              <p className="mt-1 text-xs text-[#858B94]">
                AI does not generate these values. Please enter them yourself.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className={labelClass}>Price (₹ INR) *</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => updateField('price', e.target.value)}
                  placeholder="Enter selling price"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Available Stock Quantity *
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.availableQuantity}
                  onChange={(e) =>
                    updateField('availableQuantity', e.target.value)
                  }
                  placeholder="Enter available quantity"
                  required
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Dynamic Attributes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-[#20242B]">
                  Product Attributes
                </h3>

                <p className="mt-1 text-xs text-[#858B94]">
                  Review or edit the suggested product attributes.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddAttribute}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#C6A66B]/50 px-3 py-2 text-sm font-semibold text-[#8E7442] transition-colors hover:bg-[#F4F1E9]"
              >
                <Plus className="h-4 w-4" />
                Add Attribute
              </button>
            </div>

            {Object.keys(formData.attributes).length === 0 ? (
              <p className="rounded-lg border border-dashed border-[#D9DDE2] p-4 text-center text-sm text-[#9298A0]">
                No additional attributes generated.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {Object.entries(formData.attributes).map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-lg border border-[#E3E6E9] p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-xs font-semibold capitalize text-[#5E646C]">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </label>

                      <button
                        type="button"
                        onClick={() => handleRemoveAttribute(key)}
                        className="text-xs font-medium text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>

                    <input
                      value={
                        typeof value === 'object'
                          ? JSON.stringify(value)
                          : String(value ?? '')
                      }
                      onChange={(e) =>
                        handleAttributeChange(key, e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save Actions */}
          <div className="flex flex-col justify-end gap-3 border-t border-[#E6E8EB] pt-5 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setGenerated(false);
                setSuccessMessage('');
                setErrorMessage('');
              }}
              className="rounded-lg border border-[#D9DDE2] px-5 py-3 text-sm font-semibold text-[#555B64] transition-colors hover:bg-[#F5F6F8]"
            >
              Discard
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-600 bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSaving ? 'Saving Product...' : 'Approve & Save Product'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AIAnalysisPage;
