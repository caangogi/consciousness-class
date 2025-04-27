"use client";
import CountUp from "react-countup";
import VisibilitySensor from "react-visibility-sensor";

const CounterThree = () => {
  return (
    <section className='counter-three half-bg style-two'>
      <div className='container'>
        <div className='p-16 rounded-16 bg-white box-shadow-md'>
          <div className='row gy-4'>
            <div
              className='col-xl-3 col-sm-6 col-xs-6'
              data-aos='fade-up'
              data-aos-duration={200}
            >
              <div className='counter-three-item animation-item h-100 text-center px-16 py-32 rounded-12 bg-main-25 border border-neutral-30'>
                <span className='w-80 h-80 flex-center d-inline-flex bg-white text-main-600 text-40 rounded-circle box-shadow-md mb-24'>
                  <i className='animate__wobble ph ph-users-three' />
                </span>
                <VisibilitySensor partialVisibility offset={{ bottom: 200 }}>
                  {({ isVisible }) => (
                    <h1 className='display-four mb-16 text-neutral-700 counter'>
                      {isVisible ? <CountUp end={55} /> : null}K
                    </h1>
                  )}
                </VisibilitySensor>
                <span className='text-neutral-500 text-lg'>Total Applied</span>
              </div>
            </div>
            <div
              className='col-xl-3 col-sm-6 col-xs-6'
              data-aos='fade-up'
              data-aos-duration={400}
            >
              <div className='counter-three-item animation-item h-100 text-center px-16 py-32 rounded-12 bg-main-two-25 border border-neutral-30'>
                <span className='w-80 h-80 flex-center d-inline-flex bg-white text-main-two-600 text-40 rounded-circle box-shadow-md mb-24'>
                  <i className='animate__wobble ph ph-users' />
                </span>
                <VisibilitySensor partialVisibility offset={{ bottom: 200 }}>
                  {({ isVisible }) => (
                    <h1 className='display-four mb-16 text-neutral-700 counter'>
                      {isVisible ? <CountUp end={6} /> : null}K
                    </h1>
                  )}
                </VisibilitySensor>
                <span className='text-neutral-500 text-lg'>Total Tutors</span>
              </div>
            </div>
            <div
              className='col-xl-3 col-sm-6 col-xs-6'
              data-aos='fade-up'
              data-aos-duration={600}
            >
              <div className='counter-three-item animation-item h-100 text-center px-16 py-32 rounded-12 bg-main-25 border border-neutral-30'>
                <span className='w-80 h-80 flex-center d-inline-flex bg-white text-main-600 text-40 rounded-circle box-shadow-md mb-24'>
                  <i className='animate__wobble ph ph-briefcase' />
                </span>
                <VisibilitySensor partialVisibility offset={{ bottom: 200 }}>
                  {({ isVisible }) => (
                    <h1 className='display-four mb-16 text-neutral-700 counter'>
                      {isVisible ? <CountUp end={22} /> : null}K
                    </h1>
                  )}
                </VisibilitySensor>
                <span className='text-neutral-500 text-lg'>
                  Live Tuition Jobs
                </span>
              </div>
            </div>
            <div
              className='col-xl-3 col-sm-6 col-xs-6'
              data-aos='fade-up'
              data-aos-duration={800}
            >
              <div className='counter-three-item animation-item h-100 text-center px-16 py-32 rounded-12 bg-main-two-25 border border-neutral-30'>
                <span className='w-80 h-80 flex-center d-inline-flex bg-white text-main-two-600 text-40 rounded-circle box-shadow-md mb-24'>
                  <i className='animate__wobble ph ph-star' />
                </span>

                <VisibilitySensor partialVisibility offset={{ bottom: 200 }}>
                  {({ isVisible }) => (
                    <h1 className='display-four mb-16 text-neutral-700 counter'>
                      {isVisible ? <CountUp end={8} /> : null}K
                    </h1>
                  )}
                </VisibilitySensor>
                <span className='text-neutral-500 text-lg'>
                  Average Tutor Rating
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CounterThree;
