import React, { useState, useEffect } from 'react';
import { Store, ShoppingBag } from 'lucide-react';
import { SpinnerFullscreen } from '@/components/ui/spinner';
import { useTheme } from 'next-themes';

export default function MarketPlacesView() {
      const { resolvedTheme } = useTheme();
      const isDark = resolvedTheme === 'dark';
      const [isLoading, setIsLoading] = useState(true);

      useEffect(() => {
            // Simulate loading marketplace items
            const timer = setTimeout(() => setIsLoading(false), 800);
            return () => clearTimeout(timer);
      }, []);

      if (isLoading) {
            return (
                  <div className="p-6">
                        <SpinnerFullscreen text="Loading marketplace..." />
                  </div>
            );
      }
      return (
            <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-orange-100 dark:bg-orange-500/20 rounded-xl">
                              <Store className="text-orange-600 dark:text-orange-400" size={24} />
                        </div>
                        <div>
                              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Market Places</h2>
                              <p className="text-gray-500 dark:text-gray-400">Explore tools and integrations</p>
                        </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                              <div key={i} className="p-6 bg-white dark:bg-[#1F2125] rounded-xl border border-rose-100 dark:border-gray-800 shadow-sm flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                          <ShoppingBag className="text-gray-500 dark:text-gray-400" size={24} />
                                    </div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-200 mb-2">Market Item {i}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                          Enhance your workflow with this amazing tool.
                                    </p>
                                    <button className="mt-auto px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors">
                                          Install
                                    </button>
                              </div>
                        ))}
                  </div>
            </div>
      );
}
