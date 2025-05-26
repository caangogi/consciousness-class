import Link from "next/link";

const BlogOne = () => {
  return (
    <section className='blog py-120 mash-bg-main mash-bg-main-two position-relative'>
      <img
        src='assets/images/shapes/shape2.png'
        alt=''
        className='shape two animation-scalation'
      />
      <img
        src='assets/images/shapes/shape6.png'
        alt=''
        className='shape four animation-scalation'
      />
      <div className='container'>
        <div className='section-heading text-center'>
          <h2 className='mb-24 wow bounceIn'>Últimos Artículos</h2>
          <p className='wow bounceInUp'>
            Explora nuevas posibilidades, expande tu conciencia y descubre herramientas que transforman tu realidad.
          </p>
        </div>
        <div className='row gy-4'>
          <div
            className='col-lg-4 col-sm-6'
            data-aos='fade-up'
            data-aos-duration={200}
          >
            <div className='blog-item scale-hover-item bg-main-25 rounded-16 p-12 h-100 border border-neutral-30'>
              <div className='rounded-12 overflow-hidden position-relative'>
                <Link href='/blog-details' className='w-100 h-100'>
                  <img
                    src='assets/images/thumbs/blog-img1.png'
                    alt='Imagen Blog'
                    className='scale-hover-item__img rounded-12 cover-img transition-2'
                  />
                </Link>
              </div>
              <div className='p-24 pt-32'>
                <div>
                  <span className='px-20 py-8 bg-main-two-600 rounded-8 text-white fw-medium mb-20'>
                    Vida Consciente
                  </span>
                  <h4 className='mb-28'>
                    <Link href='/blog-details' className='link text-line-2'>
                      Cómo Crear tu Realidad Desde la Conciencia
                    </Link>
                  </h4>
                  <div className='flex-align gap-14 flex-wrap my-20'>
                    <div className='flex-align gap-8'>
                      <span className='text-neutral-500 text-2xl d-flex'>
                        <i className='ph ph-user-circle' />
                      </span>
                      <span className='text-neutral-500 text-lg'>Jeswal</span>
                    </div>
                    <span className='w-8 h-8 bg-neutral-100 rounded-circle' />
                    <div className='flex-align gap-8'>
                      <span className='text-neutral-500 text-2xl d-flex'>
                        <i className='ph ph-calendar-dot' />
                      </span>
                      <span className='text-neutral-500 text-lg'>
                        12 May, 24
                      </span>
                    </div>
                    <span className='w-8 h-8 bg-neutral-100 rounded-circle' />
                    <div className='flex-align gap-8'>
                      <span className='text-neutral-500 text-2xl d-flex'>
                        <i className='ph ph-chat-dots' />
                      </span>
                      <span className='text-neutral-500 text-lg'>24</span>
                    </div>
                  </div>
                  <p className='text-neutral-500 text-line-2'>
                    Aprende cómo tu percepción, energía y elecciones pueden dar forma a una nueva vida.
                  </p>
                </div>
                <div className='pt-24 border-top border-neutral-50 mt-28 border-dashed border-0'>
                  <Link
                    href='/blog-details'
                    className='flex-align gap-8 text-main-600 hover-text-decoration-underline transition-1 fw-semibold'
                  >
                    Leer Más
                    <i className='ph ph-arrow-right' />
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div
            className='col-lg-4 col-sm-6'
            data-aos='fade-up'
            data-aos-duration={400}
          >
            <div className='blog-item scale-hover-item bg-main-25 rounded-16 p-12 h-100 border border-neutral-30'>
              <div className='rounded-12 overflow-hidden position-relative'>
                <Link href='/blog-details' className='w-100 h-100'>
                  <img
                    src='assets/images/thumbs/blog-img2.png'
                    alt='Imagen Blog'
                    className='scale-hover-item__img rounded-12 cover-img transition-2'
                  />
                </Link>
              </div>
              <div className='p-24 pt-32'>
                <div>
                  <span className='px-20 py-8 bg-success-600 rounded-8 text-white fw-medium mb-20'>
                    Libertad Personal
                  </span>
                  <h4 className='mb-28'>
                    <Link href='/blog-details' className='link text-line-2'>
                      Elige Diferente: El Poder de las Decisiones Conscientes
                    </Link>
                  </h4>
                  <div className='flex-align gap-14 flex-wrap my-20'>
                    <div className='flex-align gap-8'>
                      <span className='text-neutral-500 text-2xl d-flex'>
                        <i className='ph ph-user-circle' />
                      </span>
                      <span className='text-neutral-500 text-lg'>Jeswal</span>
                    </div>
                    <span className='w-8 h-8 bg-neutral-100 rounded-circle' />
                    <div className='flex-align gap-8'>
                      <span className='text-neutral-500 text-2xl d-flex'>
                        <i className='ph ph-calendar-dot' />
                      </span>
                      <span className='text-neutral-500 text-lg'>
                        12 May, 24
                      </span>
                    </div>
                    <span className='w-8 h-8 bg-neutral-100 rounded-circle' />
                    <div className='flex-align gap-8'>
                      <span className='text-neutral-500 text-2xl d-flex'>
                        <i className='ph ph-chat-dots' />
                      </span>
                      <span className='text-neutral-500 text-lg'>24</span>
                    </div>
                  </div>
                  <p className='text-neutral-500 text-line-2'>
                    Descubre cómo una sola elección puede transformar por completo tu camino de vida.
                  </p>
                </div>
                <div className='pt-24 border-top border-neutral-50 mt-28 border-dashed border-0'>
                  <Link
                    href='/blog-details'
                    className='flex-align gap-8 text-main-600 hover-text-decoration-underline transition-1 fw-semibold'
                  >
                    Leer Más
                    <i className='ph ph-arrow-right' />
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div
            className='col-lg-4 col-sm-6'
            data-aos='fade-up'
            data-aos-duration={600}
          >
            <div className='blog-item scale-hover-item bg-main-25 rounded-16 p-12 h-100 border border-neutral-30'>
              <div className='rounded-12 overflow-hidden position-relative'>
                <Link href='/blog-details' className='w-100 h-100'>
                  <img
                    src='assets/images/thumbs/blog-img3.png'
                    alt='Imagen Blog'
                    className='scale-hover-item__img rounded-12 cover-img transition-2'
                  />
                </Link>
              </div>
              <div className='p-24 pt-32'>
                <div>
                  <span className='px-20 py-8 bg-main-two-600 rounded-8 text-white fw-medium mb-20'>
                    Conexión
                  </span>
                  <h4 className='mb-28'>
                    <Link href='/blog-details' className='link text-line-2'>
                      Herramientas para Elevar tu Energía Cada Día
                    </Link>
                  </h4>
                  <div className='flex-align gap-14 flex-wrap my-20'>
                    <div className='flex-align gap-8'>
                      <span className='text-neutral-500 text-2xl d-flex'>
                        <i className='ph ph-user-circle' />
                      </span>
                      <span className='text-neutral-500 text-lg'>Jeswal</span>
                    </div>
                    <span className='w-8 h-8 bg-neutral-100 rounded-circle' />
                    <div className='flex-align gap-8'>
                      <span className='text-neutral-500 text-2xl d-flex'>
                        <i className='ph ph-calendar-dot' />
                      </span>
                      <span className='text-neutral-500 text-lg'>
                        12 May, 24
                      </span>
                    </div>
                    <span className='w-8 h-8 bg-neutral-100 rounded-circle' />
                    <div className='flex-align gap-8'>
                      <span className='text-neutral-500 text-2xl d-flex'>
                        <i className='ph ph-chat-dots' />
                      </span>
                      <span className='text-neutral-500 text-lg'>24</span>
                    </div>
                  </div>
                  <p className='text-neutral-500 text-line-2'>
                    Eleva tu vibración diaria con prácticas simples que transforman tu bienestar y conexión interior.
                  </p>
                </div>
                <div className='pt-24 border-top border-neutral-50 mt-28 border-dashed border-0'>
                  <Link
                    href='/blog-details'
                    className='flex-align gap-8 text-main-600 hover-text-decoration-underline transition-1 fw-semibold'
                  >
                    Leer Más
                    <i className='ph ph-arrow-right' />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BlogOne;
