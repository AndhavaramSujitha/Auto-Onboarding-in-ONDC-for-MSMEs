
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Network,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  FileCheck2,
} from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#20242B] text-slate-100 flex flex-col selection:bg-[#D8BC7A] selection:text-[#20242B]">

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#20242B]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D8BC7A] flex items-center justify-center text-[#20242B] shadow-lg">
              <Network className="w-5 h-5" />
            </div>

            <div>
              <span className="font-bold text-white text-base tracking-tight block">
                ONDC Auto
              </span>
              <span className="text-[11px] text-[#D8BC7A] font-semibold tracking-wide uppercase">
                Enterprise Onboarder
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-[#E2C994] transition-colors"
            >
              Sign In
            </Link>

            <Link
              to="/register"
              className="rounded-lg bg-[#C6A66B] px-5 py-2.5 text-sm font-bold text-[#20242B] hover:bg-[#D8BC7A] transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden">

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(198,166,107,0.13),rgba(32,36,43,0))]" />

        <div className="absolute -right-24 top-10 w-80 h-80 rounded-full border-[40px] border-[#D8BC7A]/[0.04]" />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">

          {/* AI Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C6A66B]/10 border border-[#C6A66B]/30 text-[#E2C994] text-xs font-semibold mb-7">
            <Sparkles className="w-4 h-4" />
            AI-Driven Autonomous ONDC Seller Gateway
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight sm:leading-[1.1] mb-6">
            Instant Seller Onboarding to{' '}
            <span className="text-[#D8BC7A]">
              Open Network (ONDC)
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl text-[#C4C8CE] max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            Automate your business registration, document OCR extraction,
            AI catalog image enrichment, and compliance validation in one
            unified, enterprise-grade portal.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">

            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#C6A66B] px-7 py-3.5 text-sm font-bold text-[#20242B] transition-all hover:bg-[#D8BC7A] hover:shadow-lg hover:shadow-[#C6A66B]/10"
            >
              Start Auto Onboarding
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-[#C6A66B]/50 bg-[#30353D] px-7 py-3.5 text-sm font-semibold text-[#E2C994] transition-all hover:bg-[#C6A66B] hover:text-[#20242B]"
            >
              Sign In to Dashboard
            </Link>
          </div>

          {/* Statistics */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 border-t border-white/10 text-left">

            <div>
              <p className="text-3xl font-extrabold text-[#E2C994]">
                99.8%
              </p>
              <p className="text-xs text-slate-400 mt-1">
                OCR & AI Extraction Accuracy
              </p>
            </div>

            <div>
              <p className="text-3xl font-extrabold text-[#E2C994]">
                &lt; 5 mins
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Average Onboarding Duration
              </p>
            </div>

            <div>
              <p className="text-3xl font-extrabold text-[#E2C994]">
                100%
              </p>
              <p className="text-xs text-slate-400 mt-1">
                ONDC Schema Compliance
              </p>
            </div>

            <div>
              <p className="text-3xl font-extrabold text-[#E2C994]">
                24/7
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Automated Gateway Validation
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Enterprise Features */}
      <section className="py-20 bg-[#191D23] border-t border-white/10">

        <div className="max-w-6xl mx-auto px-6">

          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Enterprise Features Built for Scale
            </h2>

            <p className="text-slate-400 text-sm mt-3 max-w-xl mx-auto">
              Engineered with Spring Boot 3.2 backend services,
              MongoDB persistence, and modern React 18 interface.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">

            {/* Automated Document OCR */}
            <div className="p-6 rounded-2xl bg-[#242930] border border-white/10 hover:border-[#C6A66B]/50 hover:-translate-y-1 transition-all duration-300">

              <div className="w-11 h-11 rounded-xl bg-[#C6A66B]/15 text-[#D8BC7A] flex items-center justify-center mb-5">
                <FileCheck2 className="w-5 h-5" />
              </div>

              <h3 className="text-base font-semibold text-white mb-2">
                Automated Document OCR
              </h3>

              <p className="text-sm text-slate-400 leading-relaxed">
                Upload GST certificates, PAN cards, and Udyam registrations.
                Our OCR pipeline extracts and verifies credentials instantly.
              </p>
            </div>

            {/* AI Image Analysis */}
            <div className="p-6 rounded-2xl bg-[#242930] border border-white/10 hover:border-[#C6A66B]/50 hover:-translate-y-1 transition-all duration-300">

              <div className="w-11 h-11 rounded-xl bg-[#C6A66B]/15 text-[#D8BC7A] flex items-center justify-center mb-5">
                <Sparkles className="w-5 h-5" />
              </div>

              <h3 className="text-base font-semibold text-white mb-2">
                AI Image Analysis
              </h3>

              <p className="text-sm text-slate-400 leading-relaxed">
                Groq-powered vision models analyze product packaging to
                generate accurate titles, tax rates, nutrition info, and attributes.
              </p>
            </div>

            {/* ONDC Schema Compliance */}
            <div className="p-6 rounded-2xl bg-[#242930] border border-white/10 hover:border-[#C6A66B]/50 hover:-translate-y-1 transition-all duration-300">

              <div className="w-11 h-11 rounded-xl bg-[#C6A66B]/15 text-[#D8BC7A] flex items-center justify-center mb-5">
                <ShieldCheck className="w-5 h-5" />
              </div>

              <h3 className="text-base font-semibold text-white mb-2">
                ONDC Schema Compliance
              </h3>

              <p className="text-sm text-slate-400 leading-relaxed">
                Validates item categories, pricing, currency, barcodes,
                and inventory levels against official ONDC protocol standards.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 py-8 bg-[#20242B] text-xs text-slate-500">

        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">

          <p>
            © 2026 ONDC Auto Onboarder. Connected to Spring Boot 3.2 Backend on port 8081.
          </p>

          <div className="flex gap-5">
            <Link
              to="/login"
              className="hover:text-[#E2C994] transition-colors"
            >
              Sign In
            </Link>

            <Link
              to="/register"
              className="hover:text-[#E2C994] transition-colors"
            >
              Register
            </Link>
          </div>

        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
