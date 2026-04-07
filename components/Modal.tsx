'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
      isOpen: boolean;
      onClose: () => void;
      title: string;
      children: React.ReactNode;
      isDark: boolean;
}

export default function Modal({ isOpen, onClose, title, children, isDark }: ModalProps) {
      return (
            <AnimatePresence>
                  {isOpen && (
                        <>
                              {/* Backdrop */}
                              <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={onClose}
                                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                              />

                              {/* Modal Content */}
                              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
                                    <motion.div
                                          initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                          animate={{ opacity: 1, scale: 1, y: 0 }}
                                          exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                          className={`pointer-events-auto relative w-full max-w-lg rounded-[32px] overflow-hidden border shadow-2xl
                ${isDark
                                                      ? 'bg-gray-900/95 border-gray-800 text-white'
                                                      : 'bg-white/95 border-rose-100 text-gray-900'}`}
                                          style={{ backdropFilter: 'blur(16px)' }}
                                    >
                                          {/* Header */}
                                          <div className={`flex items-center justify-between px-8 py-6 border-b 
                ${isDark ? 'border-gray-800' : 'border-rose-50'}`}>
                                                <h2 className="text-xl font-bold tracking-tight">{title}</h2>
                                                <button
                                                      onClick={onClose}
                                                      className={`p-2 rounded-full transition-colors
                    ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-rose-50 text-gray-400'}`}
                                                >
                                                      <X size={20} />
                                                </button>
                                          </div>

                                          {/* Body */}
                                          <div className="px-8 py-8 overflow-y-auto max-h-[70vh]">
                                                {children}
                                          </div>
                                    </motion.div>
                              </div>
                        </>
                  )}
            </AnimatePresence>
      );
}
