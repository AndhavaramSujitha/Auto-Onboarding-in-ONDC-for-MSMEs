import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
export const Modal = ({ isOpen, onClose, title, subtitle, children, footer, size = 'md', }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);
    if (!isOpen)
        return null;
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-2xl',
        '2xl': 'max-w-4xl',
    };
    return (_jsxs("div", { className: "fixed inset-0 z-50 overflow-y-auto", children: [_jsx("div", { className: "fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity", onClick: onClose }), _jsx("div", { className: "flex min-h-full items-center justify-center p-4 text-center sm:p-0", children: _jsxs("div", { className: `relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 w-full ${sizeClasses[size]} border border-slate-200/80`, onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-start justify-between p-5 sm:p-6 border-b border-slate-100", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-bold text-slate-900 leading-snug", children: title }), subtitle && (_jsx("p", { className: "text-xs text-slate-500 mt-0.5", children: subtitle }))] }), _jsx("button", { onClick: onClose, className: "rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsx("div", { className: "p-5 sm:p-6 max-h-[75vh] overflow-y-auto scrollbar-thin", children: children }), footer && (_jsx("div", { className: "bg-slate-50/80 px-5 sm:px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3", children: footer }))] }) })] }));
};
export default Modal;
