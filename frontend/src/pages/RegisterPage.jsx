
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Network,
  Mail,
  Lock,
  User,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import Input from '../components/common/Input';
import ProgressBar from '../components/common/ProgressBar';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('SELLER');

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password Strength
  const computePasswordStrength = (pass) => {
    if (!pass) return 0;

    let score = 0;

    if (pass.length >= 6) score += 25;
    if (pass.length >= 10) score += 25;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 25;
    if (/\d/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 25;

    return score;
  };

  const strength = computePasswordStrength(password);

  const getStrengthLabel = (score) => {
    if (score === 0) return '';
    if (score <= 25) return 'Weak';
    if (score <= 50) return 'Fair';
    if (score <= 75) return 'Good';
    return 'Strong';
  };

  // Validation
  const validate = () => {
    const errs = {};

    if (!fullName.trim()) {
      errs.fullName = 'Full name is required';
    }

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

    if (!confirmPassword) {
      errs.confirmPassword = 'Confirmation password is required';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        role,
      });

      navigate('/dashboard');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Registration failed. Please check backend connection at http://localhost:8081';

      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all focus:!border-[#C6A66B] focus:!ring-2 focus:!ring-[#C6A66B]/20';

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
              Enterprise Registration
            </span>
          </div>
        </Link>

        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Create seller account
        </h2>

        <p className="mt-2 text-sm leading-6 text-[#B9BEC6]">
          Get started with automated onboarding to the ONDC Open Network
        </p>
      </div>

      {/* Registration Card */}
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
            className="space-y-4 [&_input:focus]:!border-[#C6A66B] [&_input:focus]:!ring-[#C6A66B]/20"
            noValidate
          >
            {/* Full Name */}
            <Input
              label="Full Name / Authorized Signatory"
              placeholder="e.g. Ramesh Kumar"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);

                if (errors.fullName) {
                  setErrors((prev) => ({
                    ...prev,
                    fullName: '',
                  }));
                }
              }}
              error={errors.fullName}
              leftIcon={<User className="h-4 w-4" />}
              required
            />

            {/* Email */}
            <Input
              label="Business Email Address"
              type="email"
              autoComplete="email"
              placeholder="seller@enterprise.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);

                if (errors.email) {
                  setErrors((prev) => ({
                    ...prev,
                    email: '',
                  }));
                }
              }}
              error={errors.email}
              leftIcon={<Mail className="h-4 w-4" />}
              required
            />

            {/* Password */}
            <div>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);

                  if (errors.password) {
                    setErrors((prev) => ({
                      ...prev,
                      password: '',
                    }));
                  }
                }}
                error={errors.password}
                leftIcon={<Lock className="h-4 w-4" />}
                required
              />

              {/* Password Strength */}
              {password && (
                <div className="mt-2">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      Password Strength:
                    </span>

                    <span
                      className={`font-semibold ${
                        strength <= 25
                          ? 'text-red-500'
                          : strength <= 75
                            ? 'text-[#A4874F]'
                            : 'text-emerald-600'
                      }`}
                    >
                      {getStrengthLabel(strength)}
                    </span>
                  </div>

                  <ProgressBar
                    value={strength}
                    color={strength === 100 ? 'emerald' : 'amber'}
                    size="sm"
                  />
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);

                if (errors.confirmPassword) {
                  setErrors((prev) => ({
                    ...prev,
                    confirmPassword: '',
                  }));
                }
              }}
              error={errors.confirmPassword}
              leftIcon={<Lock className="h-4 w-4" />}
              required
            />

            {/* Account Role */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Account Role
              </label>

              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={inputClass}
              >
                <option value="SELLER">
                  SELLER - Catalog & Onboarding
                </option>

                <option value="ADMIN">
                  ADMIN - Management & Oversight
                </option>
              </select>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#C6A66B] bg-[#C6A66B] px-5 py-3 text-sm font-bold text-[#20242B] shadow-sm transition-all hover:border-[#D8BC7A] hover:bg-[#D8BC7A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? 'Creating Account...'
                : 'Complete Registration'}

              {!isSubmitting && (
                <ArrowRight className="h-4 w-4" />
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-7 border-t border-slate-100 pt-6 text-center">
            <p className="text-sm text-slate-600">
              Already registered?{' '}

              <Link
                to="/login"
                className="font-bold text-[#987B43] transition-colors hover:text-[#745B2E] hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
