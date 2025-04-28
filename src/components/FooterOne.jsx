import Link from "next/link";

const FooterOne = () => {
  return (
    <footer className='footer bg-main-25 position-relative z-1'>
      <img
        src='assets/images/shapes/shape2.png'
        alt=''
        className='shape five animation-scalation'
      />
      <img
        src='assets/images/shapes/shape6.png'
        alt=''
        className='shape one animation-scalation'
      />
      <div className='py-120'>
        <div className='container container-two'>
          <div className='row row-cols-xxl-5 row-cols-lg-3 row-cols-sm-2 row-cols-1 gy-5'>
            <div className='col' data-aos='fade-up' data-aos-duration={300}>
              <div className='footer-item'>
                <div className='footer-item__logo'>
                  <Link href='/'>
                    <img src='assets/images/logo/logo.png' alt='' />
                  </Link>
                </div>
                <p className='my-32'>
                  Consciousness Class ha transformado vidas, expandiendo
                  mentes y corazones más allá de los límites conocidos.
                </p>
                <ul className='social-list flex-align gap-24'>
                  <li className='social-list__item'>
                    <Link
                      href='https://www.facebook.com'
                      className='text-main-600 text-2xl hover-text-main-two-600'
                    >
                      <i className='ph-bold ph-facebook-logo' />
                    </Link>
                  </li>
                  <li className='social-list__item'>
                    <Link
                      href='https://www.twitter.com'
                      className='text-main-600 text-2xl hover-text-main-two-600'
                    >
                      <i className='ph-bold ph-twitter-logo' />
                    </Link>
                  </li>
                  <li className='social-list__item'>
                    <Link
                      href='https://www.instagram.com'
                      className='text-main-600 text-2xl hover-text-main-two-600'
                    >
                      <i className='ph-bold ph-instagram-logo' />
                    </Link>
                  </li>
                  <li className='social-list__item'>
                    <Link
                      href='https://www.pinterest.com'
                      className='text-main-600 text-2xl hover-text-main-two-600'
                    >
                      <i className='ph-bold ph-pinterest-logo' />
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className='col' data-aos='fade-up' data-aos-duration={400}>
              <div className='footer-item'>
                <h4 className='footer-item__title mb-32'>Navegación</h4>
                <ul className='footer-menu'>
                  <li className='mb-16'>
                    <Link
                      href='/about'
                      className='text-neutral-500 hover-text-main-600 hover-text-decoration-underline'
                    >
                      Sobre Nosotros
                    </Link>
                  </li>
                  <li className='mb-16'>
                    <Link
                      href='/courses'
                      className='text-neutral-500 hover-text-main-600 hover-text-decoration-underline'
                    >
                      Programas
                    </Link>
                  </li>
                  <li className='mb-16'>
                    <Link
                      href='/instructor'
                      className='text-neutral-500 hover-text-main-600 hover-text-decoration-underline'
                    >
                      Facilitadores
                    </Link>
                  </li>
                  <li className='mb-16'>
                    <Link
                      href='/faq'
                      className='text-neutral-500 hover-text-main-600 hover-text-decoration-underline'
                    >
                      Preguntas Frecuentes
                    </Link>
                  </li>
                  <li className='mb-0'>
                    <Link
                      href='/blog'
                      className='text-neutral-500 hover-text-main-600 hover-text-decoration-underline'
                    >
                      Blog
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className='col' data-aos='fade-up' data-aos-duration={600}>
              <div className='footer-item'>
                <h4 className='footer-item__title mb-32'>Categorías</h4>
                <ul className='footer-menu'>
                  <li className='mb-16'>
                    <Link
                      href='/courses'
                      className='text-neutral-500 hover-text-main-600 hover-text-decoration-underline'
                    >
                      Conciencia Emocional
                    </Link>
                  </li>
                  <li className='mb-16'>
                    <Link
                      href='/courses'
                      className='text-neutral-500 hover-text-main-600 hover-text-decoration-underline'
                    >
                      Expansión de la Mente
                    </Link>
                  </li>
                  <li className='mb-16'>
                    <Link
                      href='/courses'
                      className='text-neutral-500 hover-text-main-600 hover-text-decoration-underline'
                    >
                      Creación Consciente
                    </Link>
                  </li>
                  <li className='mb-16'>
                    <Link
                      href='/courses'
                      className='text-neutral-500 hover-text-main-600 hover-text-decoration-underline'
                    >
                      Empoderamiento Personal
                    </Link>
                  </li>
                  <li className='mb-16'>
                    <Link
                      href='/courses'
                      className='text-neutral-500 hover-text-main-600 hover-text-decoration-underline'
                    >
                      Meditación y Energía
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className='col' data-aos='fade-up' data-aos-duration={800}>
              <div className='footer-item'>
                <h4 className='footer-item__title mb-32'>Contáctanos</h4>
                <div className='flex-align gap-20 mb-24'>
                  <span className='icon d-flex text-32 text-main-600'>
                    <i className='ph ph-phone' />
                  </span>
                  <div>
                    <Link
                      href='tel:(207)555-0119'
                      className='text-neutral-500 d-block hover-text-main-600 mb-4'
                    >
                      (207) 555-0119
                    </Link>
                    <Link
                      href='tel:(704)555-0127'
                      className='text-neutral-500 d-block hover-text-main-600'
                    >
                      (704) 555-0127
                    </Link>
                  </div>
                </div>
                <div className='flex-align gap-20 mb-24'>
                  <span className='icon d-flex text-32 text-main-600'>
                    <i className='ph ph-envelope-open' />
                  </span>
                  <div>
                    <Link
                      href='mailto:info@consciousnessclass.com'
                      className='text-neutral-500 d-block hover-text-main-600 mb-4'
                    >
                      info@consciousnessclass.com
                    </Link>
                    <Link
                      href='mailto:contact@consciousnessclass.com'
                      className='text-neutral-500 d-block hover-text-main-600'
                    >
                      contact@consciousnessclass.com
                    </Link>
                  </div>
                </div>
                <div className='flex-align gap-20 mb-24'>
                  <span className='icon d-flex text-32 text-main-600'>
                    <i className='ph ph-map-trifold' />
                  </span>
                  <div>
                    <span className='text-neutral-500 d-block mb-4'>
                      Calle Luz Interior 5488
                    </span>
                    <span className='text-neutral-500 d-block'>
                      Ciudad Consciente, Planeta Tierra
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className='col' data-aos='fade-up' data-aos-duration={1000}>
              <div className='footer-item'>
                <h4 className='footer-item__title mb-32'>Suscríbete</h4>
                <p className='text-neutral-500'>
                  Recibe inspiración, herramientas y novedades directas a tu correo.
                </p>
                <form action='#' className='mt-24 position-relative'>
                  <input
                    type='email'
                    className='form-control bg-white shadow-none border border-neutral-30 rounded-pill h-52 ps-24 pe-48 focus-border-main-600'
                    placeholder='Correo electrónico...'
                  />
                  <button
                    type='submit'
                    className='w-36 h-36 flex-center rounded-circle bg-main-600 text-white hover-bg-main-800 position-absolute top-50 translate-middle-y inset-inline-end-0 me-8'
                  >
                    <i className='ph ph-paper-plane-tilt' />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='container'>
        {/* bottom Footer */}
        <div className='bottom-footer bg-main-25 border-top border-dashed border-main-100 border-0 py-32'>
          <div className='container container-two'>
            <div className='bottom-footer__inner flex-between gap-3 flex-wrap'>
              <p className='bottom-footer__text'>
                Copyright © 2025{" "}
                <span className='fw-semibold'>Consciousness Class</span>. Todos los derechos reservados.
              </p>
              <div className='footer-links'>
                <Link
                  href='#'
                  className='text-neutral-500 hover-text-main-600 hover-text-decoration-underline'
                >
                  Política de Privacidad
                </Link>
                <Link
                  href='#'
                  className='text-neutral-500 hover-text-main-600 hover-text-decoration-underline'
                >
                  Términos y Condiciones
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterOne;
