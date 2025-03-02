'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { FaPause } from 'react-icons/fa';
import { supabase } from '@/utils/supabaseClient';
import { Swiper as SwiperClass } from 'swiper';

// Static styles
const baseStyles = 'p-4 flex rounded-lg bg-[var(--announcement-background)] announcement-content relative';
const titleStyles = 'font-bold text-[var(--announcement-title)]';
const pauseIconStyles = 'absolute top-4 right-4 text-[var(--announcement-paused-text)]';

interface AnnouncementData {
  id: string;
  title: string;
  content: string;
  page: string;
  created_at: string;
}

interface AnnouncementProps {
  page: string;
  autoplayDelay?: number;
  hideIfNone?: boolean;
}

const Announcement: React.FC<AnnouncementProps> = ({ page, autoplayDelay = 5000, hideIfNone = false }) => {
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [maxHeight, setMaxHeight] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const swiperRef = useRef<SwiperClass | null>(null);

  // Fetch announcements from the database
  useEffect(() => {
    setIsLoading(true);

    const getAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('page', page);

        if (error) throw error;
        setAnnouncements(data || []);
      } catch (err) {
        console.error(`Error fetching announcements: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setError('Unable to load announcements. Please check back later.');
      } finally {
        setIsLoading(false);
      }
    };

    getAnnouncements();
  }, [page]);

  // Adjust slide heights and ensure autoplay starts
  useEffect(() => {
    if (announcements.length > 0 || isLoading || error) {
      setTimeout(() => {
        const slides = document.querySelectorAll('.announcement-content');
        let maxH = 0;
        slides.forEach((slide) => {
          maxH = Math.max(maxH, (slide as HTMLElement).offsetHeight);
        });
        setMaxHeight(maxH);
      }, 100);
    }

    // Start autoplay if multiple announcements exist
    if (swiperRef.current?.autoplay && announcements.length > 1 && !swiperRef.current.autoplay.running) {
      swiperRef.current.autoplay.start();
    }
  }, [announcements, isLoading, error]);

  // Handles tap-to-pause and advances to the next slide
  const handleTap = () => {
    if (announcements.length > 1 && swiperRef.current) {
      if (swiperRef.current.autoplay.running) {
        swiperRef.current.autoplay.stop();
        setIsPaused(true);
      } else {
        swiperRef.current.slideNext();
        swiperRef.current.autoplay.start();
        setIsPaused(false);
      }
    }
  };

  // Conditional styles based on state
  const combinedStyles = `${baseStyles} ${
    isLoading ? 'animate-pulse items-center justify-center' : ''
  } ${error && announcements.length === 0 ? 'text-red-500 items-center justify-center' : ''} ${
    !isLoading && !error && announcements.length === 0 ? 'items-center justify-center' : ''
  } ${announcements.length > 0 ? 'flex flex-col mb-2' : ''}`;

  // Helper function for rendering static message slides
  const renderMessageSlide = (message: string) => (
    <SwiperSlide>
      <div className={combinedStyles} style={{ minHeight: maxHeight > 0 ? maxHeight : 'auto' }}>
        {message}
      </div>
    </SwiperSlide>
  );

  // Hide the component if `hideIfNone` is enabled and there are no announcements
  if (hideIfNone && !isLoading && !error && announcements.length === 0) {
    return null;
  }

  return (
    <div>
      <Swiper
        autoplay={{ delay: autoplayDelay, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        loop={announcements.length > 1}
        modules={[Autoplay, Pagination]}
        className='announcement-swiper'
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          if (announcements.length > 1) swiper.autoplay.start();
        }}
      >
        {isLoading && renderMessageSlide('Loading announcements...')}
        {error && announcements.length === 0 && renderMessageSlide('Unable to load announcements. Please try again.')}
        {!isLoading && !error && announcements.length === 0 && renderMessageSlide('No announcements at this time.')}

        {announcements.map((announcement) => (
          <SwiperSlide key={announcement.id}>
            <div className={combinedStyles} style={{ minHeight: maxHeight > 0 ? maxHeight : 'auto' }} onClick={announcements.length > 1 ? handleTap : undefined}>
              <h3 className={titleStyles}>{announcement.title}</h3>
              <div className='flex-1 mt-2' dangerouslySetInnerHTML={{ __html: announcement.content }} />
              {isPaused && announcements.length > 1 && (
                <div className={pauseIconStyles} role='button' aria-label='Resume autoplay' tabIndex={0}>
                  <FaPause size={14} />
                </div>
              )}
            </div>
          </SwiperSlide>
        ))}

        <div className='swiper-pagination'></div>
      </Swiper>
    </div>
  );
};

export default Announcement;
