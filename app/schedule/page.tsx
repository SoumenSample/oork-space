// // 'use client';

// // import React from 'react';
// // import { useTheme } from 'next-themes';
// // import AppShell from '@/components/AppShell';
// // import {
// //     Calendar,
// //     ChevronLeft,
// //     ChevronRight,
// //     Plus,
// //     Clock,
// //     User,
// //     MapPin,
// //     ListChecks,
// //     X
// // } from 'lucide-react';

// // // --- Mock Data ---
// // const mockEvents = [
// //     { time: '09:00', title: 'Daily Standup', location: 'Zoom', color: 'bg-teal-500' },
// //     { time: '11:00', title: 'Design Review: V3 Mockups', location: 'Office Room 101', color: 'bg-rose-500' },
// //     { time: '14:30', title: 'Client Sync-Up (High Priority)', location: 'Google Meet', color: 'bg-indigo-500' },
// //     { time: '16:00', title: 'Focus Time (No interruptions)', location: 'Home', color: 'bg-gray-500' },
// // ];

// // const mockDays = [
// //     { day: 'Mon', date: 2, isCurrent: false },
// //     { day: 'Tue', date: 3, isCurrent: false },
// //     { day: 'Wed', date: 4, isCurrent: false },
// //     { day: 'Thu', date: 5, isCurrent: true }, // Today
// //     { day: 'Fri', date: 6, isCurrent: false },
// //     { day: 'Sat', date: 7, isCurrent: false },
// //     { day: 'Sun', date: 8, isCurrent: false },
// // ];

// // // --- Event Card Component ---
// // const EventCard: React.FC<any> = ({ event, isDark }) => {
// //     const cardBg = isDark ? 'bg-[#1F2125] border-gray-800' : 'bg-white border-rose-100';
// //     const textMuted = isDark ? 'text-gray-400' : 'text-gray-600';

// //     return (
// //         <div className={`p-4 rounded-xl border-l-4 ${event.color} ${cardBg} transition-shadow hover:shadow-lg`}>
// //             <div className="flex justify-between items-start">
// //                 <h4 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{event.title}</h4>
// //                 <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white`} style={{ backgroundColor: event.color.replace('bg-', '') }}>
// //                     {event.time}
// //                 </span>
// //             </div>
            
// //             <div className={`flex items-center gap-3 mt-2 text-xs ${textMuted}`}>
// //                 <div className="flex items-center gap-1">
// //                     <MapPin size={14} />
// //                     <span>{event.location}</span>
// //                 </div>
// //             </div>
// //         </div>
// //     );
// // };

// // // --- Calendar Sidebar Component (Upcoming Events) ---
// // const CalendarSidebar: React.FC<any> = ({ isDark }) => {
// //     const cardBg = isDark ? 'bg-[#1F2125] border-gray-800' : 'bg-white border-rose-100';
// //     const textPrimary = isDark ? 'text-white' : 'text-gray-900';
// //     const textMuted = isDark ? 'text-gray-400' : 'text-gray-600';

// //     return (
// //         <div className={`w-[300px] shrink-0 p-6 rounded-3xl border ${cardBg} h-full sticky top-8 space-y-6`}>
// //             <h3 className={`text-xl font-bold ${textPrimary}`}>Today's Agenda</h3>

// //             {/* Events List */}
// //             <div className="space-y-4">
// //                 {mockEvents.map((event, index) => (
// //                     <div key={index} className="flex gap-3 items-start">
// //                         <span className={`text-sm font-semibold mt-1 ${textMuted}`}>{event.time}</span>
// //                         <div className="flex-1">
// //                             <h4 className={`text-sm font-semibold ${textPrimary}`}>{event.title}</h4>
// //                             <p className={`text-xs ${textMuted}`}>{event.location}</p>
// //                         </div>
// //                     </div>
// //                 ))}
// //             </div>

// //             {/* Quick Actions */}
// //             <div className="pt-4 border-t border-dashed">
// //                 <h4 className={`font-semibold mb-3 ${textPrimary}`}>Quick Actions</h4>
// //                 <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-xl text-white font-semibold bg-rose-600 hover:bg-rose-500 transition-colors shadow-md">
// //                     <Plus size={16} /> New Event
// //                 </button>
// //             </div>
// //         </div>
// //     );
// // };

// // // --- Main Schedule View Component ---
// // export function ScheduleView() {
// //     const { resolvedTheme } = useTheme();
// //     const isDark = resolvedTheme === 'dark';
// //     const containerBg = isDark ? 'bg-slate-950' : 'bg-teal-50';
// //     const weekDayBg = isDark ? 'bg-[#1F2125]' : 'bg-white';
// //     const timeLineColor = isDark ? 'border-gray-800' : 'border-rose-100';
// //     const hourLineColor = isDark ? 'border-gray-700' : 'border-gray-200';

// //     // Generate time slots (8 AM to 6 PM)
// //     const timeSlots = [];
// //     for (let i = 8; i <= 18; i++) {
// //         timeSlots.push(`${i.toString().padStart(2, '0')}:00`);
// //     }

// //     return (
// //         <div className={`flex-1 p-8 transition-colors ${containerBg} flex gap-8`}>
// //             {/* Main Calendar Content (Day/Week View Simulation) */}
// //             <div className="grow">
// //                 {/* Header */}
// //                 <div className="flex items-center justify-between mb-8">
// //                     <h1 className={`text-3xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
// //                         <Calendar size={32} className="text-teal-500" /> My Schedule
// //                     </h1>
                    
// //                     {/* Navigation */}
// //                     <div className={`flex items-center border rounded-xl p-1 shadow-sm ${isDark ? 'border-gray-800' : 'border-rose-100'}`}>
// //                         <button className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
// //                             <ChevronLeft size={20} />
// //                         </button>
// //                         <span className={`px-4 text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
// //                             December 2025
// //                         </span>
// //                         <button className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
// //                             <ChevronRight size={20} />
// //                         </button>
// //                     </div>
// //                 </div>

// //                 {/* Weekday Headers */}
// //                 <div className={`grid grid-cols-8 sticky top-0 z-10 ${weekDayBg} border-b ${timeLineColor} rounded-t-xl shadow-md`}>
// //                     {/* Empty corner for Time Column */}
// //                     <div className={`h-12 border-r ${timeLineColor}`}></div> 
// //                     {/* Days of the Week */}
// //                     {mockDays.map((d, index) => (
// //                         <div key={index} className={`flex flex-col items-center justify-center p-2 h-12 border-r ${timeLineColor} last:border-r-0`}>
// //                             <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{d.day}</span>
// //                             <span className={`text-sm font-bold ${d.isCurrent ? 'text-rose-600 bg-rose-100 dark:bg-rose-800/50 p-1 rounded-full' : (isDark ? 'text-white' : 'text-gray-900')}`}>{d.date}</span>
// //                         </div>
// //                     ))}
// //                 </div>

// //                 {/* Calendar Grid - Time & Events */}
// //                 <div className="relative border-x border-b rounded-b-xl overflow-hidden" style={{ height: 'calc(100vh - 250px)' }}>
// //                     {timeSlots.map((time, index) => (
// //                         <div key={index} className={`grid grid-cols-8 h-20 border-b ${hourLineColor} last:border-b-0`}>
// //                             {/* Time Column */}
// //                             <div className={`flex justify-end pr-3 pt-1 text-xs font-semibold ${isDark ? 'text-gray-500' : 'text-gray-700'} border-r ${timeLineColor}`}>
// //                                 {time.slice(0, 5)}
// //                             </div>
// //                             {/* Daily Columns */}
// //                             <div className={`col-span-7 grid grid-cols-7`}>
// //                                 {mockDays.map((d, dayIndex) => (
// //                                     <div key={dayIndex} className={`h-full border-r ${timeLineColor} transition-colors ${d.isCurrent ? (isDark ? 'bg-gray-900/10' : 'bg-rose-50') : ''}`}>
// //                                         {/* Placeholder for events. A more complex system would absolutely position events here. */}
// //                                     </div>
// //                                 ))}
// //                             </div>
// //                         </div>
// //                     ))}

// //                     {/* Simulation of a Today Marker Line */}
// //                     <div className="absolute left-0 right-0 h-0.5 bg-red-500 z-20" style={{ top: 'calc(100% * 0.25)' }}>
// //                         <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-red-500"></div>
// //                     </div>
// //                 </div>
// //             </div>

// //             {/* Sidebar for Today's Events and Quick Actions */}
// //             <CalendarSidebar isDark={isDark} />
// //         </div>
// //     );
// // }

// // // Default export for the /schedule route
// // export default function Page() {
// //     return (
// //         <AppShell defaultView="Schedule" activeMenu="schedule">
// //             <ScheduleView />
// //         </AppShell>
// //     );
// // }
// "use client";

// import React, { useEffect, useState } from "react";
// import { useTheme } from "next-themes";
// import { Calendar, ChevronLeft, ChevronRight, Clock, Plus, X } from "lucide-react";
// import AppShell from "@/components/AppShell";

// interface ScheduleEvent {
//   _id?: string;
//   title?: string;
//   description?: string;
//   assignedTo?: string;
//   fromDate?: string;
//   toDate?: string;
// }

// interface FormData {
//   title: string;
//   description: string;
//   assignedTo: string;
//   fromDate: string;
//   toDate: string;
// }

// const EventSidebar = ({
//   isDark,
//   selectedDate,
//   events,
//   onNewEvent,
// }: {
//   isDark: boolean;
//   selectedDate: Date | null;
//   events: ScheduleEvent[];
//   onNewEvent: () => void;
// }) => {
//   const cardBg = isDark ? "bg-[#1F2125] border-gray-800" : "bg-white border-rose-100";
//   const textPrimary = isDark ? "text-white" : "text-gray-900";
//   const textMuted = isDark ? "text-gray-400" : "text-gray-600";

//   const selectedDateEvents = selectedDate
//     ? events.filter((event) => {
//         if (!event.fromDate) return false;
//         const eventDate = new Date(event.fromDate);
//         return eventDate.toDateString() === selectedDate.toDateString();
//       })
//     : [];

//   return (
//     <div
//       className={`w-full lg:w-80 shrink-0 p-4 sm:p-6 rounded-2xl border ${cardBg} space-y-6 h-fit sticky top-8`}
//     >
//       {/* Date Display */}
//       <div>
//         <h3 className={`text-xl font-bold ${textPrimary}`}>
//           {selectedDate
//             ? selectedDate.toLocaleDateString("en-US", {
//                 weekday: "long",
//                 month: "long",
//                 day: "numeric",
//               })
//             : "No date selected"}
//         </h3>
//         <p className={`text-xs sm:text-sm ${textMuted} mt-1`}>
//           {selectedDateEvents.length}{" "}
//           {selectedDateEvents.length === 1 ? "event" : "events"}
//         </p>
//       </div>

//       {/* Events List */}
//       <div className="space-y-3 max-h-[400px] overflow-y-auto">
//         {selectedDateEvents.length > 0 ? (
//           selectedDateEvents.map((event) => {
//             const from = event.fromDate ? new Date(event.fromDate) : null;
//             const to = event.toDate ? new Date(event.toDate) : null;
//             return (
//               <div
//                 key={event._id}
//                 className={`p-3 rounded-lg border-l-4 border-rose-500 ${
//                   isDark ? "bg-gray-800" : "bg-gray-50"
//                 }`}
//               >
//                 <div className="flex justify-between items-start gap-2">
//                   <div className="flex-1">
//                     <h4 className={`font-semibold text-sm ${textPrimary}`}>
//                       {event.title || "Untitled"}
//                     </h4>
//                     {from && to ? (
//                       <div className={`text-xs ${textMuted} mt-1`}>
//                         {from.toLocaleTimeString("en-US", {
//                           hour: "2-digit",
//                           minute: "2-digit",
//                         })}{" "}
//                         -{" "}
//                         {to.toLocaleTimeString("en-US", {
//                           hour: "2-digit",
//                           minute: "2-digit",
//                         })}
//                       </div>
//                     ) : null}
//                     {event.assignedTo ? (
//                       <div className={`text-xs ${textMuted} mt-1`}>
//                         👤 {event.assignedTo}
//                       </div>
//                     ) : null}
//                     {event.description ? (
//                       <div className={`text-xs ${textMuted} mt-2 line-clamp-2`}>
//                         {event.description}
//                       </div>
//                     ) : null}
//                   </div>
//                 </div>
//               </div>
//             );
//           })
//         ) : (
//           <p className={`text-center py-8 text-sm ${textMuted}`}>
//             No events for this day
//           </p>
//         )}
//       </div>

//       {/* Create Event Button */}
//       <button
//         onClick={onNewEvent}
//         className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-md"
//       >
//         <Plus size={16} /> New Event
//       </button>
//     </div>
//   );
// };

// const EventModal = ({
//   isDark,
//   isOpen,
//   selectedDate,
//   onClose,
//   onSubmit,
// }: {
//   isDark: boolean;
//   isOpen: boolean;
//   selectedDate: Date | null;
//   onClose: () => void;
//   onSubmit: (data: FormData) => Promise<void>;
// }) => {
//   const [formData, setFormData] = useState<FormData>({
//     title: "",
//     description: "",
//     assignedTo: "",
//     fromDate: "",
//     toDate: "",
//   });
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState("");

//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
//   ) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//     setError("");
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");

//     // Validate times
//     if (formData.fromDate && formData.toDate) {
//       if (new Date(formData.fromDate) >= new Date(formData.toDate)) {
//         setError("End time must be after start time");
//         return;
//       }
//     }

//     setIsLoading(true);
//     try {
//       await onSubmit(formData);
//       setFormData({
//         title: "",
//         description: "",
//         assignedTo: "",
//         fromDate: "",
//         toDate: "",
//       });
//       setError("");
//       onClose();
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Failed to create event");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   if (!isOpen) return null;

//   // Pre-fill dates based on selected date
//   const defaultFromDate = selectedDate
//     ? selectedDate.toISOString().slice(0, 16)
//     : "";
//   const defaultToDate = selectedDate
//     ? new Date(selectedDate.getTime() + 3600000).toISOString().slice(0, 16) // +1 hour
//     : "";

//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//       <div
//         className={`w-full max-w-md rounded-2xl p-6 ${
//           isDark ? "bg-[#1F2125]" : "bg-white"
//         } shadow-lg`}
//       >
//         <div className="flex justify-between items-center mb-6">
//           <h2
//             className={`text-2xl font-bold ${
//               isDark ? "text-white" : "text-gray-900"
//             }`}
//           >
//             Create Event
//           </h2>
//           <button
//             onClick={onClose}
//             className={`p-2 rounded-lg ${
//               isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
//             }`}
//             title="Close modal"
//           >
//             <X size={20} />
//           </button>
//         </div>

//         {error && (
//           <div className={`mb-4 p-3 border rounded-lg text-sm ${
//             isDark
//               ? "bg-rose-900/30 border-rose-700 text-rose-300"
//               : "bg-rose-100 border-rose-300 text-rose-900"
//           }`}>
//             ⚠️ {error}
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label
//               htmlFor="title"
//               className={`block text-sm font-medium mb-1 ${
//                 isDark ? "text-gray-300" : "text-gray-700"
//               }`}
//             >
//               Title *
//             </label>
//             <input
//               id="title"
//               type="text"
//               name="title"
//               value={formData.title}
//               onChange={handleChange}
//               placeholder="Event title"
//               required
//               className={`w-full px-3 py-2 rounded-lg border ${
//                 isDark
//                   ? "bg-gray-800 border-gray-700 text-white"
//                   : "bg-white border-gray-300 text-gray-900"
//               } focus:outline-none focus:ring-2 focus:ring-rose-500`}
//             />
//           </div>

//           <div>
//             <label
//               htmlFor="description"
//               className={`block text-sm font-medium mb-1 ${
//                 isDark ? "text-gray-300" : "text-gray-700"
//               }`}
//             >
//               Description
//             </label>
//             <textarea
//               id="description"
//               name="description"
//               value={formData.description}
//               onChange={handleChange}
//               placeholder="Event details"
//               rows={3}
//               className={`w-full px-3 py-2 rounded-lg border ${
//                 isDark
//                   ? "bg-gray-800 border-gray-700 text-white"
//                   : "bg-white border-gray-300 text-gray-900"
//               } focus:outline-none focus:ring-2 focus:ring-rose-500`}
//             />
//           </div>

//           <div>
//             <label
//               htmlFor="assignedTo"
//               className={`block text-sm font-medium mb-1 ${
//                 isDark ? "text-gray-300" : "text-gray-700"
//               }`}
//             >
//               Assigned To
//             </label>
//             <input
//               id="assignedTo"
//               type="text"
//               name="assignedTo"
//               value={formData.assignedTo}
//               onChange={handleChange}
//               placeholder="Person name"
//               className={`w-full px-3 py-2 rounded-lg border ${
//                 isDark
//                   ? "bg-gray-800 border-gray-700 text-white"
//                   : "bg-white border-gray-300 text-gray-900"
//               } focus:outline-none focus:ring-2 focus:ring-rose-500`}
//             />
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label
//                 htmlFor="fromDate"
//                 className={`block text-sm font-medium mb-1 ${
//                   isDark ? "text-gray-300" : "text-gray-700"
//                 }`}
//               >
//                 From *
//               </label>
//               <input
//                 id="fromDate"
//                 type="datetime-local"
//                 name="fromDate"
//                 value={formData.fromDate || defaultFromDate}
//                 onChange={handleChange}
//                 required
//                 className={`w-full px-3 py-2 rounded-lg border ${
//                   isDark
//                     ? "bg-gray-800 border-gray-700 text-white"
//                     : "bg-white border-gray-300 text-gray-900"
//                 } focus:outline-none focus:ring-2 focus:ring-rose-500`}
//               />
//             </div>

//             <div>
//               <label
//                 htmlFor="toDate"
//                 className={`block text-sm font-medium mb-1 ${
//                   isDark ? "text-gray-300" : "text-gray-700"
//                 }`}
//               >
//                 To *
//               </label>
//               <input
//                 id="toDate"
//                 type="datetime-local"
//                 name="toDate"
//                 value={formData.toDate || defaultToDate}
//                 onChange={handleChange}
//                 required
//                 className={`w-full px-3 py-2 rounded-lg border ${
//                   isDark
//                     ? "bg-gray-800 border-gray-700 text-white"
//                     : "bg-white border-gray-300 text-gray-900"
//                 } focus:outline-none focus:ring-2 focus:ring-rose-500`}
//               />
//             </div>
//           </div>

//           <div className="flex gap-3 pt-4">
//             <button
//               type="button"
//               onClick={onClose}
//               className={`flex-1 px-4 py-2 rounded-lg border ${
//                 isDark
//                   ? "border-gray-700 text-gray-300 hover:bg-gray-800"
//                   : "border-gray-300 text-gray-700 hover:bg-gray-100"
//               } transition-colors`}
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={isLoading}
//               className="flex-1 px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 transition-colors font-semibold"
//             >
//               {isLoading ? "Saving..." : "Create"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export function ScheduleView() {
//   const { resolvedTheme } = useTheme();
//   const isDark = resolvedTheme === "dark";

//   const containerBg = isDark ? "bg-slate-950" : "bg-teal-50";
//   const weekDayBg = isDark ? "bg-[#1F2125]" : "bg-white";
//   const timeLineColor = isDark ? "border-gray-800" : "border-rose-100";
//   const hourLineColor = isDark ? "border-gray-700" : "border-gray-200";
//   const gridBg = isDark ? "bg-[#0F1014]" : "bg-white";

//   const [events, setEvents] = useState<ScheduleEvent[]>([]);
//   const [currentDate, setCurrentDate] = useState(new Date());
//   const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   // ✅ Fetch events
//   useEffect(() => {
//     void loadEvents();
//   }, []);

//   const loadEvents = async () => {
//     try {
//       const res = await fetch("/api/event");
//       const data = await res.json();
//       console.log("Fetched events from API:", data);
      
//       const eventsList = Array.isArray(data) ? data : data.data ? data.data : [];
//       console.log("Parsed events list:", eventsList);
//       console.log("Total events:", eventsList.length);
      
//       setEvents(eventsList);
//     } catch (error) {
//       console.error("Failed to fetch events:", error);
//       setEvents([]);
//     }
//   };

//   const handleCreateEvent = async (formData: FormData) => {
//     try {
//       console.log("Creating event with data:", formData);
      
//       const res = await fetch("/api/event", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(formData),
//       });

//       if (!res.ok) {
//         const errorData = await res.json().catch(() => ({}));
//         throw new Error(errorData.message || `Failed to create event (${res.status})`);
//       }

//       const createdEvent = await res.json();
//       console.log("Event created successfully:", createdEvent);

//       // Reload events after creation - with a small delay to ensure DB write
//       await new Promise(resolve => setTimeout(resolve, 300));
//       await loadEvents();
//     } catch (error) {
//       console.error("Error creating event:", error);
//       throw error;
//     }
//   };

//   // ✅ Generate time slots (0-23 hours)
//   const timeSlots = [];
//   for (let i = 0; i < 24; i++) {
//     timeSlots.push(`${i.toString().padStart(2, "0")}:00`);
//   }

//   // ✅ Generate week days (Sun-Sat)
//   const getWeekDays = (date: Date): Date[] => {
//     const start = new Date(date);
//     start.setDate(date.getDate() - date.getDay());

//     return Array.from({ length: 7 }).map((_, i) => {
//       const d = new Date(start);
//       d.setDate(start.getDate() + i);
//       return d;
//     });
//   };

//   const days = getWeekDays(currentDate);

//   // ✅ Navigation
//   const prevWeek = () => {
//     const d = new Date(currentDate);
//     d.setDate(d.getDate() - 7);
//     setCurrentDate(d);
//   };

//   const nextWeek = () => {
//     const d = new Date(currentDate);
//     d.setDate(d.getDate() + 7);
//     setCurrentDate(d);
//   };

//   // ✅ Check event placement - improved to show multiple events per slot
//   const getEventsForSlot = (day: Date, timeStr: string): ScheduleEvent[] => {
//     const hour = parseInt(timeStr.split(":")[0], 10);
    
//     const eventsInSlot = events.filter((event) => {
//       if (!event.fromDate || !event.toDate) return false;
      
//       const from = new Date(event.fromDate);
//       const to = new Date(event.toDate);
      
//       // Check if event's date matches this day
//       if (day.toDateString() !== from.toDateString()) return false;
      
//       // Check if this hour is within the event's time range
//       const eventStartHour = from.getHours();
//       const eventEndHour = to.getHours();
      
//       // Show event in its duration hours
//       return hour >= eventStartHour && hour < eventEndHour;
//     });
    
//     return eventsInSlot;
//   };

//   const getWeekRange = () => {
//     if (days.length === 0) return "";
//     const start = days[0];
//     const end = days[6];
//     return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
//   };

//   return (
//     <div className={`min-h-screen p-4 sm:p-6 lg:p-8 ${containerBg} flex flex-col lg:flex-row gap-6`}>
//       {/* MAIN CALENDAR */}
//       <div className="flex-1">
//         {/* HEADER */}
//         <div className="flex justify-between items-center mb-6">
//           <div>
//             <h1 className={`text-2xl sm:text-3xl font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-gray-900"}`}>
//               <Calendar size={28} className="text-teal-500" /> Calendar
//             </h1>
//             <p className={`text-xs sm:text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
//               {getWeekRange()}
//             </p>
//           </div>

//           <div className="flex gap-2">
//             <button
//               onClick={prevWeek}
//               className={`p-2 rounded-lg transition-colors ${
//                 isDark
//                   ? "hover:bg-gray-800 text-gray-400"
//                   : "hover:bg-gray-100 text-gray-700"
//               }`}
//               title="Previous week"
//             >
//               <ChevronLeft size={20} />
//             </button>
//             <button
//               onClick={nextWeek}
//               className={`p-2 rounded-lg transition-colors ${
//                 isDark
//                   ? "hover:bg-gray-800 text-gray-400"
//                   : "hover:bg-gray-100 text-gray-700"
//               }`}
//               title="Next week"
//             >
//               <ChevronRight size={20} />
//             </button>
//           </div>
//         </div>

//         {/* WEEK HEADER */}
//         <div className={`grid grid-cols-8 ${weekDayBg} border-b ${timeLineColor} rounded-t-2xl overflow-hidden sticky top-8 z-20 shadow-md`}>
//           <div
//             className={`flex items-center justify-center border-r ${timeLineColor} p-2`}
//           >
//             <Clock size={16} className={isDark ? "text-gray-600" : "text-gray-400"} />
//           </div>

//           {days.map((d, i) => {
//             const isToday = new Date().toDateString() === d.toDateString();
//             const isSelected = selectedDate?.toDateString() === d.toDateString();
//             return (
//               <div
//                 key={i}
//                 onClick={() => setSelectedDate(new Date(d))}
//                 className={`text-center p-2 border-r ${timeLineColor} font-semibold transition-colors cursor-pointer ${
//                   isSelected
//                     ? isDark
//                       ? "bg-rose-900/50 text-rose-300"
//                       : "bg-rose-200 text-rose-900"
//                     : isToday
//                     ? isDark
//                       ? "bg-rose-900/30 text-rose-400"
//                       : "bg-rose-100 text-rose-700"
//                     : isDark
//                     ? "text-gray-300 hover:bg-gray-800"
//                     : "text-gray-900 hover:bg-gray-100"
//                 }`}
//               >
//                 <div className="text-xs sm:text-sm">
//                   {d.toLocaleDateString("en-US", {
//                     weekday: "short",
//                   })}
//                 </div>
//                 <div className={`text-sm sm:text-base font-bold ${isToday ? "text-rose-500" : ""}`}>
//                   {d.getDate()}
//                 </div>
//               </div>
//             );
//           })}
//         </div>

//         {/* GRID */}
//         <div className={`border-x border-b rounded-b-2xl overflow-hidden ${gridBg}`}>
//           <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
//             {timeSlots.map((time, i) => (
//               <div
//                 key={i}
//                 className={`grid grid-cols-8 h-16 sm:h-20 border-b ${hourLineColor} last:border-b-0`}
//               >
//                 {/* TIME */}
//                 <div
//                   className={`text-xs sm:text-sm text-right pr-2 sm:pr-3 pt-1 border-r ${timeLineColor} font-semibold flex items-start justify-end ${
//                     isDark ? "text-gray-500" : "text-gray-700"
//                   }`}
//                 >
//                   {time}
//                 </div>

//                 {/* DAYS */}
//                 {days.map((d, j) => (
//                   <div
//                     key={j}
//                     onClick={() => setSelectedDate(new Date(d))}
//                     className={`border-r ${timeLineColor} last:border-r-0 relative transition-colors hover:bg-opacity-50 cursor-pointer ${
//                       selectedDate?.toDateString() === d.toDateString()
//                         ? isDark
//                           ? "bg-rose-900/20"
//                           : "bg-rose-100"
//                         : new Date().toDateString() === d.toDateString()
//                         ? isDark
//                           ? "bg-gray-900/20"
//                           : "bg-rose-50"
//                         : isDark
//                         ? "hover:bg-gray-900/10"
//                         : "hover:bg-gray-50"
//                     }`}
//                   >
//                     {getEventsForSlot(d, time).map((event, index) => {
//                       const from = new Date(event.fromDate!);
//                       const to = new Date(event.toDate!);

//                       const duration =
//                         (to.getTime() - from.getTime()) /
//                         (1000 * 60 * 60);

//                       return (
//                         <div
//                           key={event._id || index}
//                           className="absolute left-1 right-1 bg-rose-500 text-white text-xs p-1 rounded shadow-sm hover:shadow-md hover:bg-rose-600 transition-all"
//                           title={`${event.title || 'Untitled'} (${from.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${to.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })})`}
//                           style={{
//                             top: 4,
//                             height: `${Math.max(duration * 64 - 8, 28)}px`,
//                             zIndex: 10,
//                           }}
//                         >
//                           <div className="font-semibold truncate text-[10px] sm:text-xs leading-tight">
//                             {event.title || "Untitled"}
//                           </div>
//                           <div className="text-[8px] sm:text-[9px] opacity-90 leading-tight">
//                             {from.getHours().toString().padStart(2, "0")}:{from.getMinutes().toString().padStart(2, "0")}
//                           </div>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 ))}
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* SIDEBAR */}
//       <EventSidebar
//         isDark={isDark}
//         selectedDate={selectedDate}
//         events={events}
//         onNewEvent={() => setIsModalOpen(true)}
//         onEventModalChange={setIsModalOpen}
//       />

//       {/* MODAL */}
//       <EventModal
//         isDark={isDark}
//         isOpen={isModalOpen}
//         selectedDate={selectedDate}
//         onClose={() => setIsModalOpen(false)}
//         onSubmit={handleCreateEvent}
//       />
//     </div>
//   );
// }

// export default function Page() {
//   return (
//     <AppShell defaultView="Schedule" activeMenu="schedule">
//       <ScheduleView />
//     </AppShell>
//   );
// }


"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";

type EventType = {
  _id?: string;
  title: string;
  description: string;
  time?: string;
  assigned: string[];
  fromDate: string;
  toDate: string;
};

export default function ScheduleView() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<EventType[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [assignInput, setAssignInput] = useState("");
  const [editingEvent, setEditingEvent] = useState<EventType | null>(null);

  const [loading, setLoading] = useState(false);

  // ✅ Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    time: "",
    assigned: [] as string[],
    
  });

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      time: "",
      assigned: [],
    });
    setAssignInput("");
    setEditingEvent(null);
  };

  // ✅ Dummy users (replace with DB later)
  // const users = ["Abhijit", "Rahul", "Priya", "Ankit"];

  // 🔥 Fetch events
  const fetchEvents = async () => {
    const res = await fetch("/api/event");
    const data = await res.json();
    setEvents(data);
  };

  useEffect(() => {
    fetchEvents();
  }, []);
  const handleEventClick = (event: EventType) => {
  setEditingEvent(event);

  const existingTime = event.time || new Date(event.fromDate).toTimeString().slice(0, 5);

  setForm({
    title: event.title,
    description: event.description,
    assigned: event.assigned || [],
    time: existingTime,
  });

  setSelectedDate(new Date(event.fromDate));
  setShowModal(true);
};

  // ➕ Add person
const handleAddPerson = () => {
  if (!assignInput.trim()) return;

  if (!form.assigned.includes(assignInput.trim())) {
    setForm((prev) => ({
      ...prev,
      assigned: [...prev.assigned, assignInput.trim()],
    }));
  }

  setAssignInput("");
};

// ❌ Remove person
const handleRemovePerson = (name: string) => {
  setForm((prev) => ({
    ...prev,
    assigned: prev.assigned.filter((u) => u !== name),
  }));
};
const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleAddPerson();
  }
};
  // 📅 Generate month days
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: (Date | null)[] = [];

    for (let i = 0; i < firstDay; i++) days.push(null);

    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const days = getDaysInMonth(currentDate);

  // ⬅️➡️ Navigation
  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  // 📌 Check event in date
  const isEventInDate = (event: EventType, date: Date) => {
    const from = new Date(event.fromDate);
    const to = new Date(event.toDate);

    from.setHours(0, 0, 0, 0);
    to.setHours(0, 0, 0, 0);

    const current = new Date(date);
    current.setHours(0, 0, 0, 0);

    return current >= from && current <= to;
  };

  // 🟢 Open modal
  const handleDateClick = (date: Date) => {
    resetForm();
    setSelectedDate(date);
    setShowModal(true);
  };

  const combineDateAndTime = (date: Date, time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const merged = new Date(date);
    merged.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
    return merged;
  };

  // 👥 Multi assign toggle
  const handleAssignChange = (user: string) => {
    setForm((prev) => {
      const exists = prev.assigned.includes(user);
      return {
        ...prev,
        assigned: exists
          ? prev.assigned.filter((u) => u !== user)
          : [...prev.assigned, user],
      };
    });
  };

  // 💾 Save event
const handleSubmit = async () => {
  if (!form.title) return alert("Title required");
  if (!selectedDate) return alert("Date required");

  setLoading(true);

  const fromDate = combineDateAndTime(selectedDate, form.time);

  const isEditing = Boolean(editingEvent?._id);
  const method = isEditing ? "PUT" : "POST";
  const url = isEditing
    ? `/api/event/${editingEvent!._id}`
    : "/api/event";

  await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...form,
      fromDate,
      toDate: fromDate,
    }),
  });

  setLoading(false);
  setShowModal(false);
  resetForm();

  fetchEvents();
};

  // 🗑️ Delete event
  const handleDelete = async (id: string) => {
    await fetch(`/api/event/${id}`, {
      method: "DELETE",
    });
    alert("Event deleted");
    fetchEvents();
  };

  return (
    <div
      className={`min-h-screen rounded-2xl border pb-3 ${
        isDark ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      <SiteHeader/>
      {/* 🔝 Header */}
      <div className="flex justify-between items-center mb-6 mt-6 px-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar /> Calendar
        </h1>

        <div className="flex items-center gap-2">
          <button onClick={handlePrevMonth} className="p-2 border rounded">
            <ChevronLeft />
          </button>

          <span className="font-semibold">
            {currentDate.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </span>

          <button onClick={handleNextMonth} className="p-2 border rounded">
            <ChevronRight />
          </button>
        </div>
      </div>

      {/* 📅 Weekdays */}
      <div className="grid grid-cols-7 text-center font-semibold mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* 📆 Calendar */}
      <div className="grid grid-cols-7 px-3 ">
        {days.map((date, index) => (
          <div
            key={index}
            onClick={() => date && handleDateClick(date)}
            className={`h-28 border rounded p-1  text-xs cursor-pointer hover:bg-cyan-100 dark:hover:bg-slate-800 ${
              isDark ? "border-gray-700 bg-zinc-900" : "border-gray-300 bg-zinc-50"
            }`}
          >
            {date && (
              <>
                <div className="font-bold">{date.getDate()}</div>

                {events
                  .filter((e) => isEventInDate(e, date))
                  .map((event) => (
                    <div
                     key={event._id}
  onClick={(e) => {
    e.stopPropagation(); // prevent date click
    handleEventClick(event);
  }}
                      className="bg-cyan-500 text-white px-1 py-0.5 rounded mt-1 flex justify-between items-center"
                    >
                      <span className="truncate">{event.title}</span>

                      {/* delete */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(event._id!);
                        }}
                        className="ml-1 text-[10px]"
                      >
                        ❌
                      </button>
                    </div>
                  ))}
              </>
            )}
          </div>
        ))}
      </div>

      {/* 🧾 Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg w-96">
            <div className="flex justify-between mb-4">
              <h2 className="font-bold">
                Create Event ({selectedDate?.toDateString()})
              </h2>
              <button
  onClick={() => {
    setShowModal(false);
    resetForm();
  }}
>
  <X />
</button>
            </div>

            {/* title */}
            <input
              type="text"
              placeholder="Title"
              className="w-full border p-2 rounded mb-2"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
            />

            {/* description */}
            <textarea
              placeholder="Description"
              className="w-full border p-2 rounded mb-2"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            <input
              type="time"
              placeholder="Time"
              className="w-full border p-2 rounded mb-2"
              value={form.time}
              onChange={(e) =>
                setForm({ ...form, time: e.target.value })
              }
            />

            {/* assign */}
          {/* ✅ Assign Multiple Input */}
<div className="mb-3">
  <p className="text-sm mb-1">Assign People:</p>

  {/* Selected Users */}
  <div className="flex flex-wrap gap-2 mb-2">
    {form.assigned.map((person) => (
      <div
        key={person}
        className="flex items-center bg-cyan-500 text-white px-2 py-1 rounded text-xs"
      >
        {person}
        <button
          onClick={() => handleRemovePerson(person)}
          className="ml-1 text-[10px]"
        >
          ❌
        </button>
      </div>
    ))}
  </div>

  {/* Input */}
  <div className="flex gap-2">
    <input
      type="text"
      placeholder="Enter name"
      className="flex-1 border p-2 rounded"
      value={assignInput}
      onChange={(e) => setAssignInput(e.target.value)}
      onKeyDown={handleKeyDown}
    />

    <button
      onClick={handleAddPerson}
      className="bg-cyan-500 text-white px-3 rounded"
    >
      Add
    </button>
  </div>
</div>


            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-cyan-500 text-white p-2 rounded"
            >
              {loading ? "Saving..." : "Save Event"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}