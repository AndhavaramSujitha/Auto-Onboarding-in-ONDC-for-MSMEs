import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
export const Card = ({ title, subtitle, action, badge, children, footer, className = '', bodyClassName = '', }) => {
    return (_jsxs("div", { className: `bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden ${className}`, children: [(title || subtitle || action || badge) && (_jsxs("div", { className: "px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { children: [title && _jsx("h3", { className: "text-base font-semibold text-slate-900 leading-tight", children: title }), subtitle && _jsx("p", { className: "text-xs text-slate-500 mt-0.5", children: subtitle })] }), badge && _jsx("div", { children: badge })] }), action && _jsx("div", { className: "flex items-center gap-2", children: action })] })), _jsx("div", { className: `p-6 ${bodyClassName}`, children: children }), footer && _jsx("div", { className: "px-6 py-3.5 bg-slate-50/75 border-t border-slate-100", children: footer })] }));
};
export default Card;
