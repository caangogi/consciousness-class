'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const SignInInner: React.FC = () => {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await signIn(email, password);
      router.push('/admin/create-course');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className='account py-120 position-relative'>
      <div className='container'>
        <div className='row gy-4 align-items-center'>
          <div className='col-lg-6'>
            <div className='bg-main-25 border border-neutral-30 rounded-8 p-32'>
              <div className='mb-40'>
                <p className='text-neutral-500'>Inicia sesión en tu cuenta y únete a nosotros</p>
                <p className='text-neutral-500'>
                  Sign in to your account and join us
                </p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className='mb-24'>
                  <label htmlFor='email' className='fw-medium text-lg text-neutral-500 mb-16'>
                    Introduce tu correo electrónico
                  </label>
                  <input
                    type='email'
                    className='common-input rounded-pill'
                    id='email'
                    placeholder='Introduce tu correo...'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className='mb-16'>
                  <label htmlFor='password' className='fw-medium text-lg text-neutral-500 mb-16'>
                    Introduce tu contraseña
                  </label>
                  <div className='position-relative'>
                    <input
                      type={passwordVisible ? 'text' : 'password'}
                      className='common-input rounded-pill pe-44'
                      id='password'
                      placeholder='Introduce tu contraseña...'
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <span
                      className={`toggle-password position-absolute top-50 inset-inline-end-0 me-16 translate-middle-y ph-bold ${
                        passwordVisible ? 'ph-eye' : 'ph-eye-closed'
                      }`}
                      onClick={() => setPasswordVisible(!passwordVisible)}
                    />
                  </div>
                </div>
                {error && <p className='text-error-600 mb-16'>{error}</p>}
                <div className='mb-16 text-end'>
                  <a href='#' className='text-warning-600 hover-text-decoration-underline'>
                    ¿Olvidaste la contraseña?
                  </a>
                </div>
                <div className='mb-16'>
                  <p className='text-neutral-500'>
                    ¿No tienes cuenta? <a href='/sign-up' className='fw-semibold text-main-600 hover-text-decoration-underline'>Regístrate</a>
                  </p>
                </div>
                <div className='mt-40'>
                  <button
                    type='submit'
                    className='btn btn-main rounded-pill flex-center gap-8 mt-40'
                    disabled={loading}
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                    <i className='ph-bold ph-arrow-up-right d-flex text-lg' />
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className='col-lg-6 d-lg-block d-none'>
            <div className='account-img'>
              <img src='assets/images/thumbs/account-img.png' alt='' />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInInner;