"use client";
import Link from "next/link";
import CountUp from "react-countup";
import VisibilitySensor from "react-visibility-sensor";

const AboutOne = () => {
  return (
    <section className='about py-120 position-relative z-1 mash-bg-main mash-bg-main-two'>
      <img src='assets/images/shapes/shape2.png' alt='' className='shape one animation-scalation' />
      <img src='assets/images/shapes/shape6.png' alt='' className='shape four animation-scalation' />
      <div className='position-relative'>
        <div className='container'>
          <div className='row gy-xl-0 gy-5 flex-wrap-reverse align-items-center'>
            <div className='col-xl-6'>
              <div className='about-thumbs position-relative pe-lg-5'>
                <div className='row gy-4'>
                  <div className='col-sm-6'>
                    <img src='assets/images/thumbs/about-img1.png' alt='' className='rounded-12 w-100' />
                  </div>
                  <div className='col-sm-6'>
                    <div className='flex-align gap-24 mb-24'>
                      <div className='bg-main-600 rounded-12 text-center py-24 px-2 w-50-percent' data-aos='fade-right'>
                        <VisibilitySensor partialVisibility offset={{ bottom: 200 }}>
                          {({ isVisible }) => (
                            <h1 className='mb-0 text-white counter'>
                              {isVisible ? <CountUp end={20} /> : null}%
                            </h1>
                          )}
                        </VisibilitySensor>
                        <span className='text-white'>Más Rentable</span>
                      </div>
                      <div className='bg-neutral-700 rounded-12 text-center py-24 px-2 w-50-percent' data-aos='fade-left'>
                        <VisibilitySensor partialVisibility offset={{ bottom: 200 }}>
                          {({ isVisible }) => (
                            <h1 className='mb-0 text-white counter'>
                              {isVisible ? <CountUp end={1200} /> : null}
                            </h1>
                          )}
                        </VisibilitySensor>
                        <span className='text-white'>Membresías Activas</span>
                      </div>
                    </div>
                    <img src='assets/images/thumbs/about-img2.png' alt='' className='rounded-12 w-100' />
                  </div>
                </div>
              </div>
            </div>
            <div className='col-xl-6'>
              <div className='about-content'>
                <div className='mb-40'>
                  <div className='flex-align gap-8 mb-16 wow bounceInDown'>
                    <span className='w-8 h-8 bg-main-600 rounded-circle' />
                    <h5 className='text-main-600 mb-0'>Sobre Consciousness Class</h5>
                  </div>
                  <h2 className='mb-24 wow bounceIn'>
                    ¿Y si tu proceso también fuera una oportunidad?
                  </h2>
                  <p className='text-neutral-500 text-line-2 wow bounceInUp'>
                    Consciousness Class no es solo un espacio de expansión personal. Aquí no solo transformas tu realidad desde dentro, también puedes lanzar tu propia membresía y convertir tu camino en una fuente de impacto y abundancia.
                  </p>
                </div>
                <div className='flex-align align-items-start gap-28 mb-32' data-aos='fade-left' data-aos-duration={200}>
                  <span className='w-80 h-80 bg-main-25 border border-neutral-30 flex-center rounded-circle flex-shrink-0'>
                    <img src='assets/images/icons/about-img1.png' alt='' />
                  </span>
                  <div className='flex-grow-1'>
                    <h4 className='text-neutral-500 mb-12'>Evoluciona con Propósito</h4>
                    <p className='text-neutral-500'>
                      Accede a herramientas de consciencia, energía y mentalidad expansiva para tu transformación personal.
                    </p>
                  </div>
                </div>
                <div className='flex-align align-items-start gap-28 mb-0' data-aos='fade-left' data-aos-duration={400}>
                  <span className='w-80 h-80 bg-main-25 border border-neutral-30 flex-center rounded-circle flex-shrink-0'>
                    <img src='assets/images/icons/about-img2.png' alt='' />
                  </span>
                  <div className='flex-grow-1'>
                    <h4 className='text-neutral-500 mb-12'>Lanza Tu Membresía</h4>
                    <p className='text-neutral-500'>
                      Monetiza tu conocimiento sin complicaciones técnicas. Te acompañamos paso a paso con tecnología, comunidad y estrategia.
                    </p>
                  </div>
                </div>
                <div className='flex-align flex-wrap gap-32 pt-40 border-top border-neutral-50 mt-40 border-dashed border-0' data-aos='fade-left' data-aos-duration={600}>
                  <Link href='/course' className='btn btn-main rounded-pill flex-align gap-8'>
                    Explorar Oportunidad
                    <i className='ph-bold ph-arrow-up-right d-flex text-lg' />
                  </Link>
                  <div className='flex-align gap-20'>
                    <img src='assets/images/thumbs/ceo-img.png' alt='' className='w-52 h-52 rounded-circle object-fit-cover flex-shrink-0' />
                    <div className='flex-grow-1'>
                      <span className='text-sm d-block'>Yenniser Cubas · Fundadora</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutOne;
