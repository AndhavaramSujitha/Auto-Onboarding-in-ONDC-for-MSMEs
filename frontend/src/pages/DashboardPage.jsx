
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Package,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  PlusCircle,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import businessService from '../services/businessService';
import productService from '../services/productService';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import ProgressBar from '../components/common/ProgressBar';
import Spinner from '../components/common/Spinner';

const DashboardPage = () => {
  const { user } = useAuth();

  const [business, setBusiness] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      try {
        const b = await businessService.getMyBusiness();
        setBusiness(b);
      } catch (err) {
        if (err.response?.status === 404 || err.response?.status === 400) {
          setBusiness(null);
        } else {
          console.warn('Could not fetch business:', err);
        }
      }

      try {
        const prods = await productService.listProducts();
        setProducts(prods || []);
      } catch (err) {
        console.warn('Could not fetch products:', err);
      }
    } catch (err) {
      setError(
        'Unable to synchronize data with backend server. Make sure Spring Boot is running on port 8081.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const calculateReadiness = () => {
    let score = 25;

    if (business?.businessName && business?.gstin) {
      score += 25;
    } else if (business?.businessName) {
      score += 15;
    }

    if (products.length >= 5) {
      score += 25;
    } else if (products.length > 0) {
      score += 15;
    }

    if (business?.pan && business?.udyamRegistration) {
      score += 25;
    } else if (business?.pan || business?.udyamRegistration) {
      score += 15;
    }

    return Math.min(100, score);
  };

  const readinessScore = calculateReadiness();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner size="lg" />
        <p className="mt-4 text-sm font-medium text-slate-500">
          Loading your ONDC seller dashboard...
        </p>
      </div>
    );
  }

  const stats = [
    {
      title: 'Network Readiness',
      value: `${readinessScore}%`,
      description: `Stage ${readinessScore >= 75 ? '3/4' : '2/4'}`,
      icon: ShieldCheck,
      badge: readinessScore >= 80 ? 'Ready' : 'In Progress',
      badgeVariant: readinessScore >= 80 ? 'success' : 'warning',
      type: 'readiness',
    },
    {
      title: 'Catalog Products',
      value: products.length,
      description:
        products.length === 0
          ? 'No products registered yet'
          : `${products.length} ready for ONDC sync`,
      icon: Package,
      badge: 'SKUs active',
    },
    {
      title: 'Business Profile',
      value: business?.businessName || 'Unregistered',
      description: business?.gstin
        ? `GST: ${business.gstin}`
        : 'GST Pending',
      icon: Building2,
      badge: business?.gstin ? 'Configured' : 'Pending',
    },
    {
      title: 'AI Vision Pipeline',
      value: 'Groq Vision',
      description: 'Auto-tagging and nutrition extraction ready',
      icon: Sparkles,
      badge: 'AI Tools',
    },
  ];

  const milestones = [
    {
      title: 'Seller Account Registration',
      description: (
        <>
          Authenticated with email{' '}
          <span className="font-medium text-[#343A40]">{user?.email}</span> via JWT token.
        </>
      ),
      completed: true,
      status: 'Completed',
    },
    {
      title: 'Business Entity Information & KYC',
      description: business
        ? `Verified: ${business.businessName} (GSTIN: ${business.gstin || 'Not provided'})`
        : 'Provide your business details, address, state, and tax identifiers.',
      completed: !!business,
      status: business ? 'Configured' : 'Action Required',
      link: !business ? '/business' : null,
      linkText: 'Complete business profile',
    },
    {
      title: 'Product Catalog Creation',
      description:
        'Add products manually or use AI image analysis to auto-extract attributes and titles.',
      completed: products.length > 0,
      status: products.length > 0 ? `${products.length} Products` : 'Pending',
      links: [
        { path: '/products', label: 'Manage Products', icon: ArrowRight },
        { path: '/ai-analysis', label: 'AI Image Analysis', icon: Sparkles },
      ],
    },
    {
      title: 'Network Gateway Publishing',
      description:
        'Once catalog and compliance checks pass, your inventory broadcasts to buyer network apps.',
      completed: false,
      status: 'Staging Sandbox',
      finalStep: true,
    },
  ];

  const quickActions = [
    {
      title: 'Add New Product',
      description: 'Create SKU and set pricing',
      path: '/products',
      icon: PlusCircle,
    },
    {
      title: 'AI Product Scanner',
      description: 'Extract SKU details from image',
      path: '/ai-analysis',
      icon: Sparkles,
    },
    {
      title: 'Upload KYC Documents',
      description: 'GST, PAN & Udyam OCR',
      path: '/documents',
      icon: UploadCloud,
    },
    {
      title: 'Business Profile',
      description: 'Edit business details & address',
      path: '/business',
      icon: Building2,
    },
  ];

  return (
    <div className="space-y-6">

      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-[#20242B] px-6 py-7 text-white shadow-sm sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full border-[45px] border-[#C6A66B]/[0.06]" />
        <div className="pointer-events-none absolute bottom-0 right-24 h-40 w-40 rounded-full bg-[#C6A66B]/[0.05] blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-[#C6A66B]/30 bg-[#C6A66B]/10 px-3 py-1.5 text-xs font-medium text-[#E2C994]">
              <span className="h-2 w-2 rounded-full bg-[#C6A66B]" />
              ONDC Network Status: Active Gateway
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Welcome,{' '}
              {business?.businessName ||
                user?.fullName ||
                user?.email?.split('@')[0] ||
                'Seller'}
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[#C3C7CD]">
              {business
                ? `Managing catalog & ONDC onboarding for ${business.businessName} (${business.businessCategory || 'General Retail'})`
                : 'Complete your business profile to activate your automated ONDC seller listing.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
  type="button"
  onClick={fetchData}
  disabled={isLoading}
  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#C6A66B] bg-[#30353D] px-4 py-2.5 text-sm font-semibold text-[#E2C994] transition-all hover:bg-[#C6A66B] hover:text-[#20242B] disabled:cursor-not-allowed disabled:opacity-60"
>
  <RefreshCw
    className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
  />
  Refresh Data
</button>

            <Link
  to="/products"
  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#C6A66B] bg-[#C6A66B] px-4 py-2.5 text-sm font-semibold text-[#20242B] transition-all hover:border-[#D8BC7A] hover:bg-[#D8BC7A]"
>
  <PlusCircle className="h-4 w-4" />
  Add Product
</Link>
          </div>
        </div>

        <div className="relative z-10 mt-8 flex items-center gap-2 border-t border-white/10 pt-4 text-xs">
          <span className="text-[#AEB4BD]">Seller Dashboard</span>
          <ArrowRight className="h-3 w-3 text-[#C6A66B]" />
          <span className="font-medium text-[#E2C994]">Overview</span>
        </div>
      </section>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Business Warning */}
      {!business && (
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-900">
                Business Profile Not Configured
              </h4>
              <p className="mt-1 text-xs text-amber-700">
                Set up your business name, GSTIN, PAN, and address to proceed with ONDC catalog integration.
              </p>
            </div>
          </div>

          <Link to="/business" className="shrink-0">
            <Button size="sm" variant="primary">
              Configure Profile Now
            </Button>
          </Link>
        </div>
      )}

      {/* Statistics Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <Card
              key={item.title}
              className="border border-[#E6E8EB] bg-white transition-all duration-200 hover:-translate-y-1 hover:border-[#C6A66B]/60 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#858B94]">
                  {item.title}
                </p>

                <div className="rounded-lg bg-[#F4F1E9] p-2.5 text-[#A88A50]">
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <h3
                  className={`min-w-0 truncate font-bold text-[#20242B] ${
                    item.type === 'readiness' ? 'text-3xl' : 'text-xl'
                  }`}
                  title={String(item.value)}
                >
                  {item.value}
                </h3>

                {item.type === 'readiness' ? (
                  <Badge variant={item.badgeVariant} size="sm">
                    {item.badge}
                  </Badge>
                ) : (
                  <span className="shrink-0 rounded-md bg-[#F4F1E9] px-2 py-1 text-[10px] font-semibold text-[#8E7442]">
                    {item.badge}
                  </span>
                )}
              </div>

              <p className="mt-2 truncate text-xs text-[#858B94]" title={item.description}>
                {item.description}
              </p>

              {item.type === 'readiness' && (
                <div className="mt-4">
                  <ProgressBar
                    value={readinessScore}
                    size="sm"
                    color={readinessScore >= 75 ? 'emerald' : 'indigo'}
                  />
                </div>
              )}
            </Card>
          );
        })}
      </section>

      {/* Main Content */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* Onboarding Milestones */}
        <div className="xl:col-span-2">
          <Card
            title="ONDC Auto Onboarding Milestones"
            subtitle="Step-by-step automated workflow to publish your catalog to buyer apps"
          >
            <div className="space-y-3">
              {milestones.map((milestone, index) => (
                <div
                  key={milestone.title}
                  className="flex items-start gap-3.5 rounded-xl border border-[#E8EAED] bg-[#FAFBFC] p-4 transition-colors hover:border-[#C6A66B]/60 hover:bg-white"
                >
                  <div
                    className={`mt-0.5 shrink-0 rounded-full p-1.5 ${
                      milestone.completed
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-[#F4F1E9] text-[#A88A50]'
                    }`}
                  >
                    {milestone.completed ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : milestone.finalStep ? (
                      <ShieldCheck className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-[#343A40]">
                        {index + 1}. {milestone.title}
                      </h4>

                      <Badge
                        variant={
                          milestone.completed
                            ? 'success'
                            : milestone.finalStep
                              ? 'neutral'
                              : 'warning'
                        }
                        size="sm"
                      >
                        {milestone.status}
                      </Badge>
                    </div>

                    <p className="mt-1.5 text-xs leading-5 text-[#858B94]">
                      {milestone.description}
                    </p>

                    {milestone.link && (
                      <Link
                        to={milestone.link}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#A4874F] hover:text-[#806633]"
                      >
                        {milestone.linkText}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}

                    {milestone.links && (
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                        {milestone.links.map((link) => {
                          const LinkIcon = link.icon;

                          return (
                            <Link
                              key={link.path}
                              to={link.path}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-[#A4874F] hover:text-[#806633]"
                            >
                              {link.label}
                              <LinkIcon className="h-3 w-3" />
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">

          {/* Quick Actions */}
          <Card title="Quick Actions">
            <div className="space-y-2.5">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.path}
                    to={action.path}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-[#E8EAED] bg-white p-3 transition-all hover:border-[#C6A66B]/70 hover:bg-[#FAF9F6]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="shrink-0 rounded-lg bg-[#F4F1E9] p-2.5 text-[#A88A50] transition-colors group-hover:bg-[#C6A66B] group-hover:text-white">
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#343A40]">
                          {action.title}
                        </p>
                        <p className="mt-1 text-[11px] text-[#9298A0]">
                          {action.description}
                        </p>
                      </div>
                    </div>

                    <ArrowRight className="h-4 w-4 shrink-0 text-[#AEB4BD] transition-all group-hover:translate-x-1 group-hover:text-[#A4874F]" />
                  </Link>
                );
              })}
            </div>
          </Card>

          {/* System Environment */}
          <Card title="System Environment">
            <div className="space-y-3 text-xs">
              {[
                ['Backend Server', 'Spring Boot 3.2.2'],
                ['Database Engine', 'MongoDB 27017'],
                ['API Endpoint', ':8081/api'],
                ['Security Model', 'Stateless JWT'],
              ].map(([label, value], index) => (
                <div
                  key={label}
                  className={`flex items-center justify-between gap-3 ${
                    index !== 3 ? 'border-b border-[#ECEEF0] pb-3' : ''
                  }`}
                >
                  <span className="text-[#858B94]">{label}</span>

                  <span
                    className={`text-right font-mono font-medium ${
                      index === 2 ? 'text-[#A4874F]' : 'text-[#343A40]'
                    }`}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
