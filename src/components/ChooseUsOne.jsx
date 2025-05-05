"use client";
import Link from "next/link";

const ChooseUsOne = () => {
  return (
    <section className='choose-us pt-120 position-relative z-1 mash-bg-main mash-bg-main-two'>
      <img src='assets/images/shapes/shape2.png' alt='' className='shape one animation-scalation' />
      <img src='assets/images/shapes/shape2.png' alt='' className='shape six animation-scalation' />
      <div className='container'>
        <div className='row gy-4'>
          <div className='col-xl-6'>
            <div className='choose-us__content'>
              <div className='mb-40'>
                <div className='flex-align gap-8 mb-16 wow bounceInDown'>
                  <span className='w-8 h-8 bg-main-600 rounded-circle' />
                  <h5 className='text-main-600 mb-0'>💎 ¿Por qué Elegirnos?</h5>
                </div>
                <h2 className='mb-24 wow bounceIn'>
                  Nuestro Compromiso: Despertar, Expandir y Transformar
                </h2>
              </div>

              <div className='pt-24 border-top border-neutral-50 mt-28 border-dashed border-0'>
                <h5 className='mb-16 text-main-600'>🤝 Gana por Contribuir</h5>
                <p className='text-neutral-500 mb-24'>
                  ¿Te encanta lo que hacemos? ¡Recomiéndalo y recibe beneficios!
                  Nuestro sistema de referidos te premia con un porcentaje de cada membresía que compartas con otros.
                  Una forma consciente, ética y expansiva de generar ingresos.
                </p>
                <Link href='/about' className='btn btn-main rounded-pill flex-align d-inline-flex gap-8'>
                  Saber Más
                </Link>
              </div>
            </div>
          </div>

          <div className='col-xl-6'>
            <div className='choose-us__thumbs position-relative text-end'>
              <div className='d-sm-inline-block d-block position-relative'>
                <img
                  src='assets/images/thumbs/choose-us-img1.png'
                  alt=''
                  className='choose-us__img rounded-12'
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChooseUsOne;
