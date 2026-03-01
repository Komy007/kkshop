'use client';

import React from 'react';

export default function Footer() {
    return (
        <footer className="bg-white text-gray-700 py-16 text-sm border-t border-gray-200 relative z-10 w-full">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                <div className="col-span-1 md:col-span-1">
                    <h2 className="text-gray-900 text-3xl font-extrabold tracking-tighter mb-4">
                        <span className="text-brand-primary mr-[1px]">KK</span>shop.cc
                    </h2>
                    <p className="text-gray-600 leading-relaxed mb-6 text-sm font-medium">
                        Cambodia's No.1 Premium Cross-Border E-commerce.<br />
                        Bringing the authentic taste and quality of Korea directly to Phnom Penh.
                    </p>
                </div>

                <div>
                    <h3 className="text-gray-900 font-extrabold mb-4 text-base">Customer Support</h3>
                    <ul className="space-y-2 text-gray-600 font-medium">
                        <li>Email: help@kkshop.cc</li>
                        <li>Tel: +855 (0) 23 123 456</li>
                        <li>KakaoTalk: @kkshop_cc</li>
                        <li>Mon-Fri: 9:00 AM - 6:00 PM</li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-gray-900 font-extrabold mb-4 text-base">Information</h3>
                    <ul className="space-y-2 text-gray-600 font-medium">
                        <li><a href="#" className="hover:text-brand-primary transition-colors">About Us</a></li>
                        <li><a href="#" className="hover:text-brand-primary transition-colors">Delivery Information</a></li>
                        <li><a href="#" className="hover:text-brand-primary transition-colors">Privacy Policy</a></li>
                        <li><a href="#" className="hover:text-brand-primary transition-colors">Terms of Service</a></li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-gray-900 font-extrabold mb-4 text-base">Accepted Payments</h3>
                    <div className="flex flex-wrap gap-2 items-center">
                        {/* Payment Method Placeholders */}
                        <div className="bg-gray-50 rounded-lg p-1 w-12 h-8 flex items-center justify-center font-bold text-[10px] text-blue-900 shadow-sm border border-gray-200">ABA</div>
                        <div className="bg-gray-50 rounded-lg p-1 w-12 h-8 flex items-center justify-center font-bold text-[10px] text-green-700 shadow-sm border border-gray-200">Wing</div>
                        <div className="bg-gray-50 rounded-lg p-1 w-12 h-8 flex items-center justify-center font-bold text-[10px] text-blue-700 shadow-sm border border-gray-200">VISA</div>
                        <div className="bg-gray-50 rounded-lg p-1 w-12 h-8 flex items-center justify-center font-bold text-[10px] text-red-600 shadow-sm border border-gray-200">Master</div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 border-t border-gray-200 text-center text-xs text-gray-500 flex flex-col md:flex-row justify-between items-center font-medium">
                <p>&copy; {new Date().getFullYear()} KKshop.cc. All rights reserved. Operating in Phnom Penh, Cambodia.</p>
                <p className="mt-2 md:mt-0">Built with ❤️ for Global Commerce.</p>
            </div>
        </footer>
    );
}
