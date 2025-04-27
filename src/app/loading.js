// app/loading.js
export default function Loading() {
  return (
    <div className='preloader'>
      <img
        src='/assets/images/icons/preloader.gif'
        loading='lazy'
        alt='Loading...'
      />
    </div>
  );
}
