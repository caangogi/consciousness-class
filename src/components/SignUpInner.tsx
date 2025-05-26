"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUser } from '../lib/userApi';
import { useAuth } from '@/context/AuthContext';

const SignUpInner: React.FC = () => {
  const router = useRouter();
  const { signIn } = useAuth(); // Assuming you have a useAuth hook to get the signIn function
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createUser({
        email,
        password,
        displayName: `${firstName} ${lastName}`,
        role: 'Student',
      })

      await signIn(email, password); // Sign in the user after creating the account

      setLoading(false);

      router.push('/course-details');
      
    } catch (err) {
      setError((err as Error).message); 
      setLoading(false);
    }
  };

  return (
    <div className='account py-120 position-relative'>
      <div className='container'>
        <div className='row gy-4 align-items-center'>
          <div className='col-lg-6'>
            <div className='bg-main-25 border border-neutral-30 rounded-8 p-32'>
              <div className='mb-40'>
                <h3 className='mb-16 text-neutral-500'>¡Comencemos!</h3>
                <p className='text-neutral-500'>
                  Por favor, introduce tus datos para crear tu cuenta
                </p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className='row gy-4'>
                  <div className='col-sm-6'>
                    <label htmlFor='fname' className='fw-medium text-lg text-neutral-500 mb-16'>
                      Nombre
                    </label>
                    <input
                      type='text'
                      className='common-input rounded-pill'
                      id='fname'
                      placeholder='Introduce tu nombre'
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className='col-sm-6'>
                    <label htmlFor='lname' className='fw-medium text-lg text-neutral-500 mb-16'>
                      Apellidos
                    </label>
                    <input
                      type='text'
                      className='common-input rounded-pill'
                      id='lname'
                      placeholder='Introduce tus apellidos'
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                  <div className='col-sm-12'>
                    <label htmlFor='email' className='fw-medium text-lg text-neutral-500 mb-16'>
                      Correo electrónico
                    </label>
                    <input
                      type='email'
                      className='common-input rounded-pill'
                      id='email'
                      placeholder='Introduce tu correo'
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className='col-sm-12'>
                    <label htmlFor='password' className='fw-medium text-lg text-neutral-500 mb-16'>
                      Contraseña
                    </label>
                    <div className='position-relative'>
                      <input
                        type={passwordVisible ? 'text' : 'password'}
                        className='common-input rounded-pill pe-44'
                        id='password'
                        placeholder='Introduce tu contraseña'
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
                  <div className='col-sm-12'>
                    <p className='text-neutral-500 mt-8'>
                      ¿Ya tienes cuenta?{' '}
                      <a href='/sign-in' className='fw-semibold text-main-600 hover-text-decoration-underline'>
                        Inicia sesión
                      </a>
                    </p>
                  </div>
                  <div className='col-sm-12'>
                    <button
                      type='submit'
                      className='btn btn-main rounded-pill flex-center gap-8 mt-20'
                      disabled={loading}
                    >
                      {loading ? 'Registrando...' : 'Regístrate'}
                      <i className='ph-bold ph-arrow-up-right d-flex text-lg' />
                    </button>
                  </div>
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

export default SignUpInner;