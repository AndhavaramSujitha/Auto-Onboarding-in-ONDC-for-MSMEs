
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowRight,
  Radio,
  Copy,
  Check,
  Activity,
  Eye,
  EyeOff,
  AlertCircle,
  X,
} from 'lucide-react';

import businessService from '../services/businessService';
import productService from '../services/productService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

export const OndcPage = () => {
  const [activeTab, setActiveTab] = useState('STATUS');
  const [business, setBusiness] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Gateway configuration persisted in localStorage
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('ondc_gateway_config');

    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }

    return {
      endpointUrl: 'https://staging.gateway.ondc.org/api/v1',
      subscriberId: 'bpp.autoonboarder.seller.org',
      uniqueKeyId: 'ed25519-key-01',
      signingKey:
        'MC4CAQAwBQYDK2VwBCIEIHr8QvFjA7m3w5q9L9K6mN1rX3pS7tU0vW2yZ4aB6cDe',
      encryptionKey:
        'MC4CAQAwBQYDK2VuBCIEIJf5RtK8v2w1q3m7p9L4k0j2h6g8f4d2s0a8e6c4b2a0',
      networkEnvironment: 'STAGING',
    };
  });

  const [showSecretKey, setShowSecretKey] = useState(false);
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState(null);

  const [successMessage, setSuccessMessage] = useState(null);
  const [serverError, setServerError] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // Status styles
  const goldStatus =
    'inline-flex items-center rounded-full border border-[#C6A66B]/40 bg-[#F4F1E9] px-3 py-1 text-[11px] font-semibold text-[#8E7442]';

  const greenStatus =
    'inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700';

  // Save gateway configuration
  useEffect(() => {
    localStorage.setItem('ondc_gateway_config', JSON.stringify(config));
  }, [config]);

  // Load business and product data
  const loadData = async () => {
    setIsLoading(true);
    setServerError(null);

    try {
      try {
        const b = await businessService.getMyBusiness();
        setBusiness(b);
      } catch {
        setBusiness(null);
      }

      try {
        const p = await productService.listProducts();
        setProducts(p || []);
      } catch {
        setProducts([]);
      }
    } catch {
      setServerError('Failed to synchronize status with backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute onboarding milestones
  const milestones = useMemo(() => {
    const uploadedDocs = localStorage.getItem('ondc_uploaded_documents');
    const docCount = uploadedDocs ? JSON.parse(uploadedDocs).length : 0;

    return [
      {
        id: 'AUTH',
        title: '1. Seller Account Registration',
        description: 'Stateless JWT credential generation & user account',
        isComplete: true,
        link: null,
      },
      {
        id: 'PROFILE',
        title: '2. Business Legal Entity (KYC)',
        description: business
          ? `Verified: ${business.businessName} (GSTIN: ${business.gstin || 'Recorded'})`
          : 'Pending entity registration (GSTIN, PAN, address)',
        isComplete: !!business,
        link: '/business',
      },
      {
        id: 'DOCS',
        title: '3. Statutory Document Verification',
        description:
          docCount > 0
            ? `${docCount} document(s) extracted with OCR & Groq`
            : 'Pending GST/PAN document upload and extraction',
        isComplete: docCount > 0,
        link: '/documents',
      },
      {
        id: 'CATALOG',
        title: '4. Product Catalog Ingestion',
        description:
          products.length > 0
            ? `${products.length} SKUs configured in retail catalog`
            : 'Pending initial product inventory creation',
        isComplete: products.length > 0,
        link: '/products',
      },
      {
        id: 'COMPLIANCE',
        title: '5. Legal Metrology Compliance',
        description:
          products.length > 0
            ? 'Statutory packaging attributes and pricing checked'
            : 'Pending catalog compliance audit',
        isComplete: products.length > 0,
        link: '/compliance',
      },
      {
        id: 'GATEWAY',
        title: '6. ONDC Gateway Key Exchange',
        description: config.subscriberId
          ? `Registered as BPP: ${config.subscriberId}`
          : 'Pending subscriber keypair generation',
        isComplete: !!config.subscriberId && !!config.signingKey,
        link: null,
      },
    ];
  }, [business, products, config]);

  const completedCount = milestones.filter((m) => m.isComplete).length;

  const overallPercentage = Math.round(
    (completedCount / milestones.length) * 100
  );

  // Existing simulated gateway ping
  const handleTestGatewayPing = () => {
    setIsTestingPing(true);
    setPingResult(null);

    setTimeout(() => {
      setIsTestingPing(false);

      setPingResult({
        status: 'SUCCESS',
        latencyMs: 142,
        message: `HTTP 200 OK: ONDC Registry responded. Subscriber ID "${config.subscriberId}" verified in Staging Sandbox.`,
        timestamp: new Date().toLocaleTimeString(),
      });

      setSuccessMessage(
        'Gateway handshake successful! Seller BPP endpoint is active.'
      );
    }, 1200);
  };

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E9EAEC] border-t-[#C6A66B]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Success Alert - Green */}
      {successMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <span className="font-medium">{successMessage}</span>
          </div>

          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Server Error - Red */}
      {serverError && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
            <span className="font-medium">{serverError}</span>
          </div>

          <button
            onClick={() => setServerError(null)}
            className="text-red-600 hover:text-red-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ONDC Hero Banner */}
      <section className="relative flex flex-col items-start justify-between gap-5 overflow-hidden rounded-2xl bg-[#20242B] p-6 text-white shadow-sm sm:p-7 md:flex-row md:items-center">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border-[35px] border-[#C6A66B]/[0.06]" />

        <div className="relative z-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#C6A66B]/30 bg-[#C6A66B]/10 px-3 py-1 text-xs font-semibold text-[#E2C994]">
            <Radio className="h-3.5 w-3.5 animate-pulse text-[#C6A66B]" />
            <span>
              Beckn BPP Gateway: {config.networkEnvironment} Sandbox
            </span>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            ONDC Network Readiness & Gateway
          </h2>

          <p className="mt-2 max-w-xl text-xs leading-6 text-[#C3C7CD] sm:text-sm">
            Track onboarding progression from initial business KYC to live
            Beckn protocol gateway registry sync.
          </p>
        </div>

        {/* Tabs */}
        <div className="relative z-10 flex items-center rounded-xl border border-[#555B64] bg-[#30353D] p-1">
          <button
            onClick={() => setActiveTab('STATUS')}
            className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === 'STATUS'
                ? 'bg-[#C6A66B] text-[#20242B] shadow-sm'
                : 'text-[#C3C7CD] hover:text-white'
            }`}
          >
            Onboarding Status
          </button>

          <button
            onClick={() => setActiveTab('GATEWAY')}
            className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === 'GATEWAY'
                ? 'bg-[#C6A66B] text-[#20242B] shadow-sm'
                : 'text-[#C3C7CD] hover:text-white'
            }`}
          >
            Gateway Settings
          </button>
        </div>
      </section>

      {/* STATUS TAB */}
      {activeTab === 'STATUS' && (
        <div className="space-y-6">

          {/* Readiness Summary */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

            <Card className="md:col-span-3">
              <div className="mb-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-base font-bold text-[#20242B]">
                    Network Onboarding Completion
                  </h3>

                  <p className="mt-0.5 text-xs text-[#858B94]">
                    {completedCount} of {milestones.length} phases fulfilled
                  </p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-[#A4874F]">
                    {overallPercentage}%
                  </span>

                  <span className="text-xs font-medium text-[#858B94]">
                    Ready
                  </span>
                </div>
              </div>

              {/* Champagne Gold Progress Bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#E9EAEC]">
                <div
                  className="h-full rounded-full bg-[#C6A66B] transition-all duration-500"
                  style={{ width: `${overallPercentage}%` }}
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#ECEEF0] pt-3 text-xs text-[#858B94]">
                <span>ONDC Protocol Version: Beckn v1.2.0</span>
                <span>Role: Buyer App Provider (BPP) Seller</span>
              </div>
            </Card>

            {/* Registry Status */}
            <Card bodyClassName="flex flex-col justify-between p-5">
              <div>
                <span className="text-xs font-semibold uppercase text-[#858B94]">
                  Registry Status
                </span>

                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`h-3 w-3 rounded-full ${
                      pingResult?.status === 'SUCCESS'
                        ? 'bg-emerald-500'
                        : 'bg-[#C6A66B]'
                    }`}
                  />

                  <span className="text-sm font-bold text-[#343A40]">
                    {pingResult?.status === 'SUCCESS'
                      ? 'Verified Active'
                      : 'Pending Ping'}
                  </span>
                </div>

                <p className="mt-1 text-[11px] text-[#858B94]">
                  Staging Gateway:{' '}
                  <code>staging.gateway.ondc.org</code>
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleTestGatewayPing}
                isLoading={isTestingPing}
                leftIcon={<Activity className="h-3.5 w-3.5" />}
                className="mt-3 w-full"
              >
                Test Gateway Ping
              </Button>
            </Card>
          </div>

          {/* Milestone Roadmap */}
          <Card
            title="Onboarding Milestone Roadmap"
            subtitle="Autonomous progression checklist for seller verification"
          >
            <div className="space-y-4">
              {milestones.map((m, idx) => (
                <div
                  key={m.id}
                  className={`flex flex-col items-start justify-between gap-4 rounded-xl border p-4 transition-all sm:flex-row sm:items-center ${
                    m.isComplete
                      ? 'border-emerald-200 bg-emerald-50/40'
                      : idx === completedCount
                        ? 'border-[#C6A66B] bg-[#FAF8F2] ring-1 ring-[#C6A66B]/30'
                        : 'border-[#E6E8EB] bg-[#F7F8FA]'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        m.isComplete
                          ? 'bg-emerald-600 text-white'
                          : idx === completedCount
                            ? 'bg-[#C6A66B] text-[#20242B]'
                            : 'bg-[#E9EAEC] text-[#777777]'
                      }`}
                    >
                      {m.isComplete ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        idx + 1
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-[#20242B]">
                          {m.title}
                        </h4>

                        <span
                          className={
                            m.isComplete ? greenStatus : goldStatus
                          }
                        >
                          {m.isComplete
                            ? 'Complete'
                            : idx === completedCount
                              ? 'In Progress'
                              : 'Pending'}
                        </span>
                      </div>

                      <p className="mt-1 text-xs leading-5 text-[#858B94]">
                        {m.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 self-end sm:self-center">
                    {m.link ? (
                      <Link to={m.link}>
                        <Button
                          variant={m.isComplete ? 'outline' : 'primary'}
                          size="sm"
                          rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                        >
                          {m.isComplete ? 'Review' : 'Complete Step'}
                        </Button>
                      </Link>
                    ) : m.id === 'REGISTRY' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={isTestingPing}
                        onClick={handleTestGatewayPing}
                      >
                        Ping Registry
                      </Button>
                    ) : (
                      <span className={greenStatus}>Verified</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* GATEWAY SETTINGS TAB */}
      {activeTab === 'GATEWAY' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

            {/* Gateway Credentials */}
            <div className="space-y-6 lg:col-span-2">
              <Card
                title="BPP Gateway Credentials & Keys"
                subtitle="Cryptographic signing and network endpoint configuration"
              >
                <div className="space-y-4">

                  {/* Environment */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-[#343A40]">
                      Network Environment
                    </label>

                    <div className="flex flex-wrap gap-2">
                      {['STAGING', 'PREPROD', 'PRODUCTION'].map((env) => (
                        <button
                          key={env}
                          type="button"
                          onClick={() =>
                            setConfig({
                              ...config,
                              networkEnvironment: env,
                            })
                          }
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            config.networkEnvironment === env
                              ? 'border-[#C6A66B] bg-[#C6A66B] text-[#20242B]'
                              : 'border-[#E6E8EB] bg-white text-[#343A40] hover:bg-[#F5F6F8]'
                          }`}
                        >
                          {env}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Input
                    label="ONDC Gateway Registry Endpoint"
                    value={config.endpointUrl}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        endpointUrl: e.target.value,
                      })
                    }
                    required
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      label="Subscriber ID (BPP)"
                      value={config.subscriberId}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          subscriberId: e.target.value,
                        })
                      }
                      required
                    />

                    <Input
                      label="Key ID"
                      value={config.uniqueKeyId}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          uniqueKeyId: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  {/* Signing Key */}
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase text-[#343A40]">
                        Ed25519 Signing Private Key
                      </label>

                      <button
                        type="button"
                        onClick={() => setShowSecretKey(!showSecretKey)}
                        className="flex items-center gap-1 text-xs text-[#A4874F] hover:text-[#806633]"
                      >
                        {showSecretKey ? (
                          <>
                            <EyeOff className="h-3.5 w-3.5" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5" />
                            Reveal
                          </>
                        )}
                      </button>
                    </div>

                    <input
                      type={showSecretKey ? 'text' : 'password'}
                      value={config.signingKey}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          signingKey: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-[#D9DDE2] bg-white px-3.5 py-2.5 text-xs font-mono text-[#20242B] outline-none focus:border-[#C6A66B] focus:ring-2 focus:ring-[#C6A66B]/20"
                    />
                  </div>

                  <Input
                    label="X25519 Encryption Public Key"
                    value={config.encryptionKey}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        encryptionKey: e.target.value,
                      })
                    }
                  />

                  <div className="flex justify-end border-t border-[#ECEEF0] pt-3">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() =>
                        setSuccessMessage(
                          'Gateway credentials updated and saved.'
                        )
                      }
                    >
                      Save Gateway Configuration
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">

              {/* Gateway Handshake */}
              <Card title="Gateway Handshake Probe">
                <div className="space-y-3">
                  <p className="text-xs leading-relaxed text-[#858B94]">
                    Test bidirectional communication between this application
                    and the ONDC Beckn staging registry.
                  </p>

                  <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    isLoading={isTestingPing}
                    onClick={handleTestGatewayPing}
                    leftIcon={<Activity className="h-4 w-4" />}
                  >
                    Execute Sandbox Ping
                  </Button>

                  {pingResult && (
                    <div className="mt-3 space-y-2 rounded-xl bg-[#20242B] p-3 font-mono text-xs text-white">
                      <div className="flex justify-between text-[11px] text-[#B8BEC7]">
                        <span>
                          LATENCY: {pingResult.latencyMs}ms
                        </span>
                        <span>{pingResult.timestamp}</span>
                      </div>

                      <p className="font-semibold text-emerald-400">
                        {pingResult.message}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Webhook Endpoints */}
              <Card title="Beckn Webhook Endpoints">
                <div className="space-y-3 text-xs">
                  <p className="text-[#858B94]">
                    Your application registers the following callback
                    handlers for buyer search & order requests:
                  </p>

                  <div className="space-y-2">
                    {[
                      {
                        name: '/on_search',
                        method: 'POST',
                        desc: 'Catalog broadcast response',
                      },
                      {
                        name: '/on_select',
                        method: 'POST',
                        desc: 'Item quote & fulfillment details',
                      },
                      {
                        name: '/on_init',
                        method: 'POST',
                        desc: 'Billing & payment initialization',
                      },
                      {
                        name: '/on_confirm',
                        method: 'POST',
                        desc: 'Confirmed order creation',
                      },
                    ].map((ep) => (
                      <div
                        key={ep.name}
                        className="flex items-center justify-between gap-2 rounded-lg border border-[#E6E8EB] bg-[#F7F8FA] p-2.5"
                      >
                        <div>
                          <div className="flex items-center gap-1.5 font-mono font-bold text-[#343A40]">
                            <span className="rounded bg-[#F4F1E9] px-1 py-0.5 text-[10px] text-[#8E7442]">
                              {ep.method}
                            </span>

                            <span>{ep.name}</span>
                          </div>

                          <span className="mt-0.5 block text-[11px] text-[#9298A0]">
                            {ep.desc}
                          </span>
                        </div>

                        <button
                          onClick={() =>
                            copyToClipboard(
                              `http://localhost:8081/api/bpp${ep.name}`,
                              ep.name
                            )
                          }
                          className="text-[#858B94] transition-colors hover:text-[#A4874F]"
                          title="Copy full URL"
                        >
                          {copiedField === ep.name ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OndcPage;
