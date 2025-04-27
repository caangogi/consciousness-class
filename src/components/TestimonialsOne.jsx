"use client";
import { useEffect } from "react";

const TestimonialsOne = () => {
  useEffect(() => {
    const loadSlick = async () => {
      if (typeof window !== "undefined") {
        const $ = (await import("jquery")).default;
        require("slick-carousel");

        const thumbsSlider = $(".testimonials__thumbs-slider");
        const mainSlider = $(".testimonials__slider");

        if (thumbsSlider.length && mainSlider.length) {
          // Initialize the sliders
          thumbsSlider.slick({
            slidesToShow: 1,
            slidesToScroll: 1,
            arrows: false,
            fade: true,
            rtl: $("html").attr("dir") === "rtl",
            asNavFor: ".testimonials__slider",
          });

          mainSlider.slick({
            slidesToShow: 1,
            slidesToScroll: 1,
            asNavFor: ".testimonials__thumbs-slider",
            dots: false,
            arrows: true,
            rtl: $("html").attr("dir") === "rtl",
            focusOnSelect: true,
            nextArrow: "#testimonials-next",
            prevArrow: "#testimonials-prev",
          });
        }
      }
    };

    loadSlick();

    return () => {
      if (typeof window !== "undefined") {
        const $ = require("jquery");
        // Destroy sliders on unmount
        $(".testimonials__thumbs-slider").slick("unslick");
        $(".testimonials__slider").slick("unslick");
      }
    };
  }, []);
  return (
    <section className='testimonials py-120 position-relative z-1 bg-main-25'>
      <img
        src='assets/images/shapes/shape2.png'
        alt=''
        className='shape six animation-scalation'
      />
      <img
        src='assets/images/shapes/shape3.png'
        alt=''
        className='shape four animation-rotation'
      />
      <div className='container'>
        <div className='row gy-5'>
          <div className='col-lg-6'>
            <div className='testimonials__thumbs-slider pe-lg-5 me-xxl-5'>
              <div
                className='testimonials__thumbs wow bounceIn'
                data-tilt=''
                data-tilt-max={15}
                data-tilt-speed={500}
                data-tilt-perspective={5000}
                data-tilt-full-page-listening=''
              >
                <img src='assets/images/thumbs/testimonial-img1.png' alt='' />
              </div>
              <div
                className='testimonials__thumbs wow bounceIn'
                data-tilt=''
                data-tilt-max={15}
                data-tilt-speed={500}
                data-tilt-perspective={5000}
                data-tilt-full-page-listening=''
              >
                <img src='assets/images/thumbs/testimonial-img2.png' alt='' />
              </div>
            </div>
          </div>
          <div className='col-lg-6'>
            <div className='testimonials__content'>
              <div className='section-heading style-left'>
                <div className='flex-align gap-8 mb-16 wow bounceInDown'>
                  <span className='w-8 h-8 bg-main-600 rounded-circle' />
                  <h5 className='text-main-600 mb-0'>What Our Students Say</h5>
                </div>
                <h2 className='mb-24 wow bounceIn'>
                  Testimonials from Happy Learners for EduAll
                </h2>
                <p className='text-neutral-500 text-line-2 wow bounceInUp'>
                  16+ million Students are already learning on EduAll Platform
                </p>
              </div>
              <div className='testimonials__slider'>
                <div className='testimonials-item'>
                  <ul
                    className='flex-align gap-8 mb-16'
                    data-aos='fade-left'
                    data-aos-duration={800}
                  >
                    <li className='text-warning-600 text-xl d-flex'>
                      <i className='ph-fill ph-star' />
                    </li>
                    <li className='text-warning-600 text-xl d-flex'>
                      <i className='ph-fill ph-star' />
                    </li>
                    <li className='text-warning-600 text-xl d-flex'>
                      <i className='ph-fill ph-star' />
                    </li>
                    <li className='text-warning-600 text-xl d-flex'>
                      <i className='ph-fill ph-star' />
                    </li>
                    <li className='text-warning-600 text-xl d-flex'>
                      <i className='ph-fill ph-star-half' />
                    </li>
                  </ul>
                  <p
                    className='text-neutral-700'
                    data-aos='fade-left'
                    data-aos-duration={1200}
                  >
                    "Enrolling in courses at EduAll was one of the best
                    decisions I've made for my career. The flexibility of the
                    online learning platform allowed me to study at my own pace
                    while balancing my work”
                  </p>
                  <h4 className='mt-48 mb-8' data-aos='fade-left'>
                    Kathryn Murphy
                  </h4>
                  <span className='text-neutral-700' data-aos='fade-left'>
                    Software Developer
                  </span>
                </div>
                <div className='testimonials-item'>
                  <ul
                    className='flex-align gap-8 mb-16'
                    data-aos='fade-left'
                    data-aos-duration={800}
                  >
                    <li className='text-warning-600 text-xl d-flex'>
                      <i className='ph-fill ph-star' />
                    </li>
                    <li className='text-warning-600 text-xl d-flex'>
                      <i className='ph-fill ph-star' />
                    </li>
                    <li className='text-warning-600 text-xl d-flex'>
                      <i className='ph-fill ph-star' />
                    </li>
                    <li className='text-warning-600 text-xl d-flex'>
                      <i className='ph-fill ph-star' />
                    </li>
                    <li className='text-warning-600 text-xl d-flex'>
                      <i className='ph-fill ph-star-half' />
                    </li>
                  </ul>
                  <p
                    className='text-neutral-700'
                    data-aos='fade-left'
                    data-aos-duration={1200}
                  >
                    "Signing up for courses at EduAll was quite possibly of the
                    best choice I've made for my vocation. The adaptability of
                    the internet learning stage permitted me to learn at my own
                    speed while adjusting my work"
                  </p>
                  <h4 className='mt-48 mb-8' data-aos='fade-left'>
                    John Doe
                  </h4>
                  <span className='text-neutral-700' data-aos='fade-left'>
                    UX/UI Designer
                  </span>
                </div>
              </div>
              <div className='flex-align gap-16 mt-40'>
                <button
                  type='button'
                  id='testimonials-prev'
                  className=' slick-arrow flex-center rounded-circle border border-gray-100 hover-border-main-600 text-xl hover-bg-main-600 hover-text-white transition-1 w-48 h-48'
                >
                  <i className='ph ph-caret-left' />
                </button>
                <button
                  type='button'
                  id='testimonials-next'
                  className=' slick-arrow flex-center rounded-circle border border-gray-100 hover-border-main-600 text-xl hover-bg-main-600 hover-text-white transition-1 w-48 h-48'
                >
                  <i className='ph ph-caret-right' />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsOne;
