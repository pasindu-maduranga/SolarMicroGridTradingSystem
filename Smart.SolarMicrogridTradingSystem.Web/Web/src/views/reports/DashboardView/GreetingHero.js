import React, { useState, useEffect } from 'react';
import tokenService from '../../../utils/tokenDecoder';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  if (hour < 22) return 'Good evening';
  return 'Good night';
};

const getTimeOfDayBackground = () => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return 'linear-gradient(90deg, rgba(41, 128, 185, 0.8) 0%, rgba(241, 196, 15, 0.6) 100%), url("/static/images/morning_bg.png")';
  }
  if (hour >= 12 && hour < 17) {
    return 'linear-gradient(90deg, rgba(21, 101, 192, 0.8) 0%, rgba(46, 204, 113, 0.7) 100%), url("/static/images/noon_bg.png")';
  }
  if (hour >= 17 && hour < 20) {
    return 'linear-gradient(90deg, rgba(142, 68, 173, 0.8) 0%, rgba(230, 126, 34, 0.6) 100%), url("/static/images/evening_bg.png")';
  }
  return 'linear-gradient(90deg, rgba(10, 15, 36, 0.85) 0%, rgba(27, 38, 79, 0.8) 100%), url("/static/images/night_bg.png")';
};

const GreetingHero = () => {
  const [background, setBackground] = useState('');
  const [greeting, setGreeting] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [userName, setUserName] = useState('admin');

  useEffect(() => {
    setGreeting(getGreeting());
    setBackground(getTimeOfDayBackground());

    try {
      const name = tokenService.getUserNameFromToken();
      if (name) setUserName(name.toLowerCase());
    } catch (err) {
      console.log('Error decoding token', err);
    }

    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    setDateStr(new Date().toLocaleDateString('en-US', options));
  }, []);

  return (
    <div
      className="relative w-full h-[320px] flex flex-col justify-center px-8 lg:px-16 py-12 box-border transition-[background-image] duration-1000 ease-in-out rounded-[20px]"
      style={{ backgroundImage: background, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="inline-flex items-center bg-white/15 backdrop-blur-sm text-[#E5E7EB] px-3 py-1.5 rounded-lg w-fit mb-4">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 opacity-80"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
        <span className="text-sm font-medium font-sans">{dateStr}</span>
      </div>

      <h1 className="font-sans font-bold text-white text-[3rem] leading-none tracking-[-1px] mb-4">
        {greeting}, {userName}
      </h1>

      <p className="font-sans text-[1.05rem] text-[#E5E7EB] max-w-[600px] leading-relaxed">
        Here's what's happening across your microgrid today. All nodes are reporting normally, with 2 items that need your review.
      </p>
    </div>
  );
};

export default GreetingHero;
