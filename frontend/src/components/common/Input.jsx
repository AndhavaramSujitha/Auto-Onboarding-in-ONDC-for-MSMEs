import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
export const Input = forwardRef(({ label, error, helperText, leftIcon, rightAction, type = 'text', className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordType = type === 'password';
    const computedType = isPasswordType ? (showPassword ? 'text' : 'password') : type;
    return (_jsxs("div", { className: "w-full", children: [label && (_jsxs("label", { className: "block text-sm font-medium text-slate-700 mb-1.5", children: [label, props.required && _jsx("span", { className: "text-red-500 ml-1", children: "*" })] })), _jsxs("div", { className: "relative rounded-lg shadow-sm", children: [leftIcon && (_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400", children: leftIcon })), _jsx("input", { ref: ref, type: computedType, className: `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-slate-50 disabled:text-slate-500 ${leftIcon ? 'pl-10' : ''} ${isPasswordType || rightAction ? 'pr-10' : ''} ${error
                            ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-200'
                            : 'border-slate-300 hover:border-slate-400 focus:border-indigo-600 focus:ring-indigo-100'} ${className}`, ...props }), isPasswordType && (_jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none", tabIndex: -1, children: showPassword ? _jsx(EyeOff, { className: "w-4 h-4" }) : _jsx(Eye, { className: "w-4 h-4" }) })), !isPasswordType && rightAction && (_jsx("div", { className: "absolute inset-y-0 right-0 pr-3 flex items-center", children: rightAction }))] }), error && _jsx("p", { className: "mt-1.5 text-xs text-red-600", children: error }), !error && helperText && _jsx("p", { className: "mt-1.5 text-xs text-slate-500", children: helperText })] }));
});
Input.displayName = 'Input';
export default Input;
