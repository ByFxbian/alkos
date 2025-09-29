'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, Navigation } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const videos = [
  { id: 1, url: "" },
  { id: 2, url: "" },
  { id: 3, url: "" },
];

// https://www.tiktok.com/player/v1/7528072418615758102?controls=1&&progress_bar=0&fullscreen_button=0&timestamp=0&loop=1&music_info=0&rel=0&native_context_menu=0&closed_caption=0&play_button=1&volume_control=1

export default function TikTokCarousel() {
     return (
    <div className="container mx-auto py-20">
      <Swiper
        effect={'coverflow'}
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={'auto'}
        coverflowEffect={{
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: true,
        }}
        pagination={{ clickable: true }}
        navigation={true}
        modules={[EffectCoverflow, Pagination, Navigation]}
        className="mySwiper"
      >
        {videos.map(video => (
          <SwiperSlide key={video.id} style={{ width: '325px', height: '575px', overflow: 'hidden', borderRadius: '12px', backgroundColor: '#000' }}>
            <iframe
              src={video.url}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              allow="autoplay; encrypted-media;"
              allowFullScreen
            ></iframe>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}