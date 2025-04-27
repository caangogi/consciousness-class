import Link from "next/link";

export default function NotFound() {
  return (
    <section className='not_found'>
      <div className='container'>
        <div className='row'>
          <div className='col-12 text-center'>
            <h1 className='display-1'>404 Error</h1>
            <h2>Page Not Found</h2>
            <p>
              We are sorry, the page you are looking for could not be found.
            </p>

            <Link href='/' className='btn btn-main'>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
