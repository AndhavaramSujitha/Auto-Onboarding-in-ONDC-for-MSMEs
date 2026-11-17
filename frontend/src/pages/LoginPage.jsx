
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Network,
  Mail,
  Lock,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import Input from '../components/common/Input';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs = {};

    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      await login({
        email: email.trim(),
        password,
      });

      navigate('/dashboard');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (err.response?.status === 401
          ? 'Invalid email or password. Please check your credentials.'
          : err.message ||
            'Failed to sign in. Please verify the backend is running at http://localhost:8081');

      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-[#20242B] px-4 py-10 sm:px-6 lg:px-8">

      {/* Background Decoration */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full border-[45px] border-[#D8BC7A]/[0.05]" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full border-[45px] border-[#D8BC7A]/[0.04]" />

      {/* Brand and Heading */}
      <div className="relative z-10 mx-auto w-full max-w-md text-center">

        <Link
          to="/"
          className="mb-7 inline-flex items-center gap-3"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D8BC7A] text-[#20242B] shadow-lg">
            <Network className="h-6 w-6" />
          </div>

          <div className="text-left">
            <span className="block text-lg font-bold tracking-tight text-white">
              ONDC Auto Onboarder
            </span>

            <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D8BC7A]">
              Seller Portal
            </span>
          </div>
        </Link>

        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Welcome back
        </h2>

        <p className="mt-2 text-sm leading-6 text-[#B9BEC6]">
          Sign in to access your ONDC onboarding and catalog dashboard
        </p>
      </div>

      {/* Login Card */}
      <div className="relative z-10 mx-auto mt-8 w-full max-w-md">
        <div className="rounded-2xl border border-[#E6E3DC] bg-white px-6 py-8 shadow-2xl sm:px-10">

          {/* Server Error */}
          {serverError && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

              <div className="flex-1 font-medium">
                {serverError}
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5 [&_input:focus]:!border-[#C6A66B] [&_input:focus]:!ring-[#C6A66B]/20"
            noValidate
          >
            {/* Email */}
            <Input
              label="Email Address"
              type="email"
              autoComplete="email"
              placeholder="seller@business.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);

                if (errors.email) {
                  setErrors((prev) => ({
                    ...prev,
                    email: undefined,
                  }));
                }
              }}
              error={errors.email}
              leftIcon={<Mail className="h-4 w-4" />}
              required
            />

            {/* Password */}
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);

                if (errors.password) {
                  setErrors((prev) => ({
                    ...prev,
                    password: undefined,
                  }));
                }
              }}
              error={errors.password}
              leftIcon={<Lock className="h-4 w-4" />}
              required
            />

            {/* Remember Me */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer select-none items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#C6A66B' }}
                  className="h-4 w-4 rounded border-slate-300"
                />

                <span className="text-xs text-slate-600">
                  Remember this device
                </span>
              </label>

              <span className="text-xs text-slate-400">
                JWT Stateless Auth
              </span>
            </div>

            {/* Sign In */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#C6A66B] bg-[#C6A66B] px-5 py-3 text-sm font-bold text-[#20242B] shadow-sm transition-all hover:border-[#D8BC7A] hover:bg-[#D8BC7A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}

              {!isSubmitting && (
                <ArrowRight className="h-4 w-4" />
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-7 border-t border-slate-100 pt-6 text-center">
            <p className="text-sm text-slate-600">
              Don't have a seller account yet?{' '}

              <Link
                to="/register"
                className="font-bold text-[#987B43] transition-colors hover:text-[#745B2E] hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Backend Endpoint */}
        <div className="mt-6 text-center text-xs text-[#AEB5BF]">
          <span>Backend Endpoint: </span>

          <code className="rounded bg-[#30353D] px-2 py-1 font-mono text-[11px] text-[#E2C994]">
            POST http://localhost:8081/api/auth/login
          </code>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
