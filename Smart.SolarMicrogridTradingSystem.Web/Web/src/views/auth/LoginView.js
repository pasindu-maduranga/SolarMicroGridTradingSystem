import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import { Formik } from 'formik';
import Page from 'src/components/Page';
import services from './Services';
import { LoadingComponent } from './../../utils/newLoader';
import { trackPromise } from 'react-promise-tracker';
import './LoginView.css';

const LoginView = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function login(values) {
    setErrorMessage('');
    let result = await services.login(values);
    if (result.statusCode === 'Error') {
      setErrorMessage(result.message);
      return;
    }
    sessionStorage.setItem('token', result.data);
    navigate('/loader');
  }

  return (
    <Page title="Sign in" className="sg-login-root">
      <LoadingComponent />
      <div className="sg-stage">
        <div className="sg-left">
          <div className="sg-blob sg-b1"></div>
          <div className="sg-blob sg-b3"></div>

          <div className="sg-brand-row">
            <div className="sg-brand-mark">
              <img src="/logo-solar.svg" alt="SolarGrid" width="42" height="42" />
            </div>
            <div className="sg-brand-name">SolarGrid</div>
          </div>

          <div className="sg-hero">
            <div className="sg-eyebrow"><span className="sg-dot"></span> Backoffice &amp; Grid Operator portal</div>
            <h1>Manage the microgrid<br />from <em>one dashboard</em></h1>
            <p>Register solar nodes, keep battery slots current, and oversee every energy reservation across your network — all from a single, secure sign-in.</p>

            <div className="sg-illustration">
              <svg viewBox="0 0 360 170" width="100%" style={{ maxWidth: 380 }} role="img" aria-label="Solar energy flowing from a rooftop panel to a microgrid node to a phone dashboard">
                <defs>
                  <clipPath id="sgPanelClip"><rect x="42" y="66" width="56" height="14" rx="2" /></clipPath>
                </defs>

                <line className="sg-flow-dash" x1="70" y1="120" x2="160" y2="120" stroke="#f0c580" strokeWidth="2" />
                <line className="sg-flow-dash" x1="200" y1="120" x2="290" y2="120" stroke="#f0c580" strokeWidth="2" style={{ animationDelay: '.4s' }} />

                <polygon points="30,86 70,58 110,86" fill="#173c26" />
                <rect x="40" y="86" width="60" height="42" fill="#26543a" stroke="#3a7a52" strokeWidth="1.5" />
                <g clipPath="url(#sgPanelClip)">
                  <rect x="42" y="66" width="56" height="14" fill="#e8a53a" opacity=".9" />
                  <rect className="sg-glint" x="42" y="66" width="10" height="14" fill="#fbe6b8" opacity="0" transform="skewX(-20)" />
                </g>
                <line x1="60" y1="66" x2="60" y2="80" stroke="#1d4a30" strokeWidth="1.2" />
                <line x1="80" y1="66" x2="80" y2="80" stroke="#1d4a30" strokeWidth="1.2" />

                <rect x="160" y="78" width="46" height="50" rx="10" fill="#26543a" stroke="#7fb8d8" strokeWidth="1.5" />
                <circle className="sg-pulse-ring" cx="183" cy="103" r="16" fill="none" stroke="#7fb8d8" strokeWidth="1.5" />
                <polygon points="192,90 178,110 188,110 182,124 202,100 190,100" fill="#e8a53a" />

                <rect x="290" y="70" width="40" height="58" rx="8" fill="#173c26" stroke="#3a7a52" strokeWidth="1.5" />
                <rect x="295" y="78" width="30" height="38" rx="4" fill="#0f2e1c" />
                <circle cx="310" cy="97" r="8" fill="#5f9672" />
                <path d="M306,97 l3,3 l6,-7" stroke="#fbf8ef" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />

                <g className="sg-rays" stroke="#f0c580" strokeWidth="2" strokeLinecap="round" opacity=".9">
                  <line x1="330" y1="6" x2="330" y2="13" />
                  <line x1="356" y1="30" x2="349" y2="30" />
                  <line x1="348" y1="12" x2="343" y2="17" />
                  <line x1="348" y1="48" x2="343" y2="43" />
                  <line x1="312" y1="12" x2="317" y2="17" />
                </g>
                <circle className="sg-sun-core" cx="330" cy="30" r="13" fill="#e8a53a" />

                <line x1="0" y1="140" x2="360" y2="140" stroke="#3a7a52" strokeWidth="1.5" />
              </svg>
            </div>
          </div>

          <div className="sg-foot-note">
            <span><span className="sg-dot"></span> Live node status</span>
            <span><span className="sg-dot" style={{ background: '#e8a53a' }}></span> Secure JWT sessions</span>
          </div>
        </div>

        <div className="sg-right">
          <div className="sg-card">
            <div className="sg-card-badge">
              <img src="/logo-solar.svg" alt="SolarGrid" width="58" height="58" />
            </div>
            <h2>Welcome back</h2>
            <p className="sg-sub">Sign in with your staff account to continue</p>

            {errorMessage ? <div className="sg-error-banner">{errorMessage}</div> : null}

            <Formik
              initialValues={{ username: '', password: '' }}
              validationSchema={Yup.object().shape({
                username: Yup.string().max(255).required('Username is required'),
                password: Yup.string().max(255).required('Password is required')
              })}
              onSubmit={(e) => trackPromise(login(e))}
            >
              {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
                <form onSubmit={handleSubmit}>
                  <div className="sg-field">
                    <label htmlFor="username">Username</label>
                    <div className={'sg-box' + (touched.username && errors.username ? ' sg-has-error' : '')}>
                      <span className="sg-ic">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </span>
                      <input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="e.g. admin"
                        autoComplete="username"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.username}
                      />
                    </div>
                    {touched.username && errors.username ? <div className="sg-field-error">{errors.username}</div> : null}
                  </div>

                  <div className="sg-field">
                    <label htmlFor="password">Password</label>
                    <div className={'sg-box' + (touched.password && errors.password ? ' sg-has-error' : '')}>
                      <span className="sg-ic">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="10" rx="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </span>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.password}
                      />
                      <button
                        type="button"
                        className="sg-toggle"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {touched.password && errors.password ? <div className="sg-field-error">{errors.password}</div> : null}
                  </div>

                  <button className="sg-btn-signin" type="submit" disabled={isSubmitting}>
                    Sign in
                  </button>
                </form>
              )}
            </Formik>

            <div className="sg-card-foot">Trouble signing in? Contact your <b>Backoffice</b> administrator.</div>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default LoginView;
