const FindBestTutorsInner = () => {
  return (
    <section className='py-120'>
      <div className='container'>
        <div className='border border-neutral-30 rounded-12 bg-main-25 p-24 bg-main-25'>
          <form action='#'>
            <h3 className='mb-24'>Find Best Tutors</h3>
            {/* Find Tutors Start */}
            <div className='border border-neutral-30 rounded-12 bg-white p-24'>
              <h5 className='mb-0'>Fill Up Info</h5>
              <span className='d-block border border-main-50 my-24 border-dashed' />
              <div className='row gy-4'>
                <div className='col-sm-6'>
                  <label
                    htmlFor='location'
                    className='text-neutral-700 text-lg fw-medium mb-12'
                  >
                    Location{" "}
                  </label>
                  <input
                    type='text'
                    className='common-input bg-main-25 rounded-pill border-transparent focus-border-main-600'
                    id='location'
                    placeholder='Enter location...'
                  />
                </div>
                <div className='col-sm-6'>
                  <label
                    htmlFor='selectLanguage'
                    className='text-neutral-700 text-lg fw-medium mb-12'
                  >
                    Select Language <span className='text-danger-600'>*</span>{" "}
                  </label>
                  <select
                    className='common-input bg-main-25 rounded-pill border-transparent focus-border-main-600 form-select py-14'
                    id='selectLanguage'
                  >
                    <option value='' selected='' hidden=''>
                      Select language
                    </option>
                    <option value=''>Bangla</option>
                    <option value=''>Urdhu</option>
                    <option value=''>English</option>
                    <option value=''>Spenish</option>
                  </select>
                </div>
                <div className='col-sm-12'>
                  <label className='text-neutral-700 text-lg fw-medium mb-12'>
                    Gender <span className='text-danger-600'>*</span>{" "}
                  </label>
                  <div className='flex-align gap-24'>
                    <div className='form-check common-check common-radio mb-0'>
                      <input
                        className='form-check-input'
                        type='radio'
                        name='gender'
                        id='Male'
                      />
                      <label
                        className='form-check-label fw-normal flex-grow-1'
                        htmlFor='Male'
                      >
                        Male
                      </label>
                    </div>
                    <div className='form-check common-check common-radio mb-0'>
                      <input
                        className='form-check-input'
                        type='radio'
                        name='gender'
                        id='Female'
                      />
                      <label
                        className='form-check-label fw-normal flex-grow-1'
                        htmlFor='Female'
                      >
                        Female
                      </label>
                    </div>
                  </div>
                </div>
                <div className='col-sm-6'>
                  <label
                    htmlFor='selectDep'
                    className='text-neutral-700 text-lg fw-medium mb-12'
                  >
                    Select Department <span className='text-danger-600'>*</span>{" "}
                  </label>
                  <select
                    className='common-input bg-main-25 rounded-pill border-transparent focus-border-main-600 form-select py-14'
                    id='selectDep'
                  >
                    <option value='' selected='' hidden=''>
                      Select Department
                    </option>
                    <option value=''>Arts</option>
                    <option value=''>Science</option>
                    <option value=''>Commerce</option>
                  </select>
                </div>
                <div className='col-sm-6'>
                  <label
                    htmlFor='selectSub'
                    className='text-neutral-700 text-lg fw-medium mb-12'
                  >
                    Select Department <span className='text-danger-600'>*</span>{" "}
                  </label>
                  <select
                    className='common-input bg-main-25 rounded-pill border-transparent focus-border-main-600 form-select py-14'
                    id='selectSub'
                  >
                    <option value='' selected='' hidden=''>
                      Select Subject
                    </option>
                    <option value=''>English</option>
                    <option value=''>Bangla</option>
                    <option value=''>Social Science</option>
                    <option value=''>Ecomomics</option>
                    <option value=''>Math</option>
                  </select>
                </div>
                <div className='col-sm-6'>
                  <label
                    htmlFor='selectCountry'
                    className='text-neutral-700 text-lg fw-medium mb-12'
                  >
                    Select Country <span className='text-danger-600'>*</span>{" "}
                  </label>
                  <select
                    className='common-input bg-main-25 rounded-pill border-transparent focus-border-main-600 form-select py-14'
                    id='selectCountry'
                  >
                    <option value='' selected='' hidden=''>
                      Select Country
                    </option>
                    <option value=''>Bangladesh</option>
                    <option value=''>Pakistan</option>
                    <option value=''>Bhutan</option>
                    <option value=''>Nepal</option>
                    <option value=''>Australia</option>
                    <option value=''>England</option>
                  </select>
                </div>
                <div className='col-sm-12'>
                  <button
                    type='submit'
                    className='btn btn-main rounded-pill flex-center gap-8 mt-16'
                  >
                    Find Now
                    <i className='ph-bold ph-arrow-up-right d-flex text-lg' />
                  </button>
                </div>
              </div>
            </div>
            {/* Find Tutors End */}
          </form>
        </div>
      </div>
    </section>
  );
};

export default FindBestTutorsInner;
