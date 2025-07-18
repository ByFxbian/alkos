'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, Navigation } from 'swiper/modules';
import { useEffect } from 'react';

import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const videos = [
  { id: 1, url: "https://www.tiktok.com/player/v1/7425325385690123553?controls=1&progress_bar=0&fullscreen_button=0&timestamp=0&loop=1&music_info=0&rel=0&native_context_menu=0&closed_caption=0&play_button=1&volume_control=1" },
  { id: 2, url: "https://www.tiktok.com/player/v1/7423764862959996193?controls=1&progress_bar=0&fullscreen_button=0&timestamp=0&loop=1&music_info=0&rel=0&native_context_menu=0&closed_caption=0&play_button=1&volume_control=1" },
  { id: 3, url: "https://www.tiktok.com/player/v1/7528072418615758102?controls=1&&progress_bar=0&fullscreen_button=0&timestamp=0&loop=1&music_info=0&rel=0&native_context_menu=0&closed_caption=0&play_button=1&volume_control=1" },
];
/*
function TikTokEmbed({ url }: { url: string }) {
    const videoId = url.split('video/')[1]?.split('?')[0];

    if(!videoId) return <p>Video nicht gefunden</p>;

    return (
        <blockquote
            className='tiktok-embed'
            cite={url}
            data-video-id={videoId}
            style={{ maxWidth: '325px', minWidth: '325px', height: '575px', margin: '0 auto' }}
        >
            <section></section>
        </blockquote>
    )
}
*/


export default function TikTokCarousel() {
    /*useEffect(() => {
        const script = document.createElement('script');
        script.src = "https://www.tiktok.com/embed.js";
        script.async = true;
        document.body.appendChild(script);

        return () => {
        document.body.removeChild(script);
        };
    }, []);

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
                    <SwiperSlide key={video.id} style={{ width: '325px', height: '575px' }}>
                        <TikTokEmbed url={video.url} />
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );*/

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