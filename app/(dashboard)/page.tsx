"use client";

import { useState, useEffect } from "react";
import { SpinnerFullscreen } from "@/components/ui/spinner";
import PresentationView from "@/components/presentation/PresentationView";
import VideoView from "@/components/video/VideoView";
import { useYjsTable } from "@/components/YjsProvider";
import { Whiteboard } from "@/components/whiteboard/Whiteboard";

export default function Page() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'presentation' | 'video' | 'whiteboard'>('dashboard');
  const [showCollabButton, setShowCollabButton] = useState(false);
  
  // Initialize Yjs for collaboration
  const { yjsInitialized } = useYjsTable('dashboard-room');

  useEffect(() => {
    // Simulate loading dashboard data
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Show collaboration button when Yjs is initialized
    setShowCollabButton(yjsInitialized);
  }, [yjsInitialized]);

  if (isLoading) {
    return <SpinnerFullscreen text="Loading dashboard..." />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="text-xl font-bold text-gray-800">OoakSpace</div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
              O
            </div>
            <div className="text-sm text-gray-600">Admin</div>
          </div>
        </div>
        
          <nav className="mt-6 space-y-2 px-4">
           <button
             onClick={() => setActiveTab('dashboard')}
             className={`flex items-center w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h10m-7-4h10" />
             </svg>
             Dashboard
           </button>
           <button
             onClick={() => setActiveTab('presentation')}
             className={`flex items-center w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'presentation' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3M6 6l12 12" />
             </svg>
             Presentation
           </button>
           <button
             onClick={() => setActiveTab('video')}
             className={`flex items-center w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'video' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12l0 8M4 12h16M12 4l0 8" />
             </svg>
             Video
           </button>
           <button
             onClick={() => setActiveTab('whiteboard')}
             className={`flex items-center w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'whiteboard' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2 12l2 2m0 0l2-2m0 0l2-2M2 12l2-2M2 12l2 2" />
             </svg>
             Whiteboard
           </button>
         </nav>
        
        {/* Collaboration Status */}
        <div className="mt-auto px-4 py-4 border-t border-gray-200">
          {yjsInitialized ? (
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-green-600">Connected</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-ping"></div>
              <span className="text-yellow-600">Connecting...</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">
              {activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'presentation' ? 'Presentation' : 'Video'}
            </h1>
            <div className="flex items-center space-x-3">
              {/* Collaboration Button */}
              {showCollabButton && (
                <button
                  onClick={() => alert('Collaboration features enabled! Open this page in another tab to collaborate.')}
                  className="flex items-center space-x-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2zM12 10a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                  <span>Collab</span>
                </button>
              )}
              <div className="relative">
                <button
                  className="flex items-center space-x-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs rounded-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3" />
                  </svg>
                  Settings
                </button>
                <div className="absolute right-0 mt-2 w-56 px-3 py-2 bg-white border border-gray-200 rounded-md shadow-lg z-20 hidden">
                  <div className="space-y-2">
                    <button className="w-full text-left text-sm py-1 hover:bg-gray-100">Appearance</button>
                    <button className="w-full text-left text-sm py-1 hover:bg-gray-100">Notifications</button>
                    <button className="w-full text-left text-sm py-1 hover:bg-gray-100">Account</button>
                    <button className="w-full text-left text-sm py-1 hover:bg-gray-100 text-red-500">Sign Out</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'dashboard' && (
            <div className="p-6">
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Welcome to OoakSpace</h2>
                  <p className="text-gray-600 mb-4">
                    Your collaborative workspace platform. Use the sidebar to navigate between different views.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-medium text-blue-800 mb-2">Real-time Collaboration</h3>
                      <p className="text-sm text-gray-600">
                        Work together with your team in real-time on tables, presentations, and more.
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-medium text-green-800 mb-2">Multiple Views</h3>
                      <p className="text-sm text-gray-600">
                        Switch between dashboard, presentation, and video views seamently.
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="font-medium text-purple-800 mb-2">Secure & Reliable</h3>
                      <p className="text-sm text-gray-600">
                        Built with enterprise-grade security and reliability.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Start</h2>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-500 rounded-flex items-center justify-center text-white text-sm">
                        1
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">Sign in or Sign up</h3>
                        <p className="text-sm text-gray-600">
                          Create your account or sign in with Google
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-500 rounded-flex items-center justify-center text-white text-sm">
                        2
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">Explore Views</h3>
                        <p className="text-sm text-gray-600">
                          Try the dashboard, presentation, and video views
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-yellow-500 rounded-flex items-center justify-center text-white text-sm">
                        3
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">Collaborate</h3>
                        <p className="text-sm text-gray-600">
                          Open the same page in another tab or device to collaborate in real-time
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'presentation' && (
            <PresentationView databaseId="presentation-1" />
          )}
          
          {activeTab === 'video' && (
            <VideoView databaseId="video-1" />
          )}
          
          {activeTab === 'whiteboard' && (
            <div className="p-6">
              <div className="bg-white rounded-lg shadow border border-gray-200">
                <Whiteboard 
                  roomId="dashboard-whiteboard"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
