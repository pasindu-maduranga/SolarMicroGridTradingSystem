import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import { Formik } from 'formik';
import Page from 'src/components/Page';
import services from './Services';
import { LoadingComponent } from './../../utils/newLoader';
import { trackPromise } from 'react-promise-tracker';

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
    <Page title="Sign in" className="font-sg-sans text-sg-ink bg-white [&_*]:box-border">
      <LoadingComponent />
      <div
        className="flex w-full min-h-screen relative max-[860px]:flex-col"
        style={{
          backgroundImage: `url(${process.env.PUBLIC_URL}/static/images/M5.png)`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
          backgroundSize: 'cover'
        }}
      >
        <div className="relative flex-[0_0_46%] min-h-screen text-[#fbf8ef] overflow-hidden flex flex-col justify-between pt-14 px-[60px] pb-12 max-[860px]:flex-none max-[860px]:min-h-[260px] max-[860px]:px-[26px] max-[860px]:py-8">
          <div className="absolute rounded-full blur-[2px] opacity-[.12] bg-sg-sun w-[220px] h-[220px] -top-[60px] -left-[60px]"></div>
          <div className="absolute rounded-full blur-[2px] opacity-[.08] bg-sg-sun w-[90px] h-[90px] top-[44%] left-[8%]"></div>

          <div className="flex items-center gap-3.5 relative z-[2]">
            <div className="w-14 h-14 rounded-[14px] bg-[#fbf8ef] flex items-center justify-center shadow-[0_8px_20px_-8px_rgba(0,0,0,.45)] flex-none">
              <img src="/logo-solar.svg" alt="SolarGrid" width="42" height="42" />
            </div>
            <div className="font-sg-mono text-[15px] tracking-[.08em] uppercase font-semibold text-[#f0ebd8]">SolarGrid</div>
          </div>

          <div className="relative z-[2]">
            <div className="inline-flex items-center gap-2 font-sg-mono text-[11.5px] tracking-[.1em] uppercase text-sg-sun-soft bg-[rgba(232,165,58,.14)] border border-[rgba(232,165,58,.35)] py-1.5 px-3 rounded-full mb-[22px]">
              <span className="w-1.5 h-1.5 rounded-full bg-sg-sun animate-sg-pulse motion-reduce:animate-none"></span> Backoffice &amp; Grid Operator portal
            </div>
            <h1 className="font-sg-serif text-[clamp(28px,3.2vw,40px)] leading-[1.15] font-bold text-[#fbf8ef] m-0">
              Manage the microgrid<br />from <em className="not-italic text-sg-sun-soft">one dashboard</em>
            </h1>
            <p className="mt-4 text-[#cfe3d4] text-[14.5px] leading-[1.65] max-w-[380px]">Register solar nodes, keep battery slots current, and oversee every energy reservation across your network — all from a single, secure sign-in.</p>

            <div className="relative z-[2] mt-[34px] max-[860px]:hidden">
              <svg viewBox="0 0 360 170" width="100%" style={{ maxWidth: 380 }} role="img" aria-label="Solar energy flowing from a rooftop panel to a microgrid node to a phone dashboard">
                <defs>
                  <clipPath id="sgPanelClip"><rect x="42" y="66" width="56" height="14" rx="2" /></clipPath>
                </defs>

                <line className="animate-sg-dash motion-reduce:animate-none" style={{ strokeDasharray: '5 7' }} x1="70" y1="120" x2="160" y2="120" stroke="#f0c580" strokeWidth="2" />
                <line className="animate-sg-dash motion-reduce:animate-none" style={{ strokeDasharray: '5 7', animationDelay: '.4s' }} x1="200" y1="120" x2="290" y2="120" stroke="#f0c580" strokeWidth="2" />

                <polygon points="30,86 70,58 110,86" fill="#173c26" />
                <rect x="40" y="86" width="60" height="42" fill="#26543a" stroke="#3a7a52" strokeWidth="1.5" />
                <g clipPath="url(#sgPanelClip)">
                  <rect x="42" y="66" width="56" height="14" fill="#e8a53a" opacity=".9" />
                  <rect className="animate-sg-sweep motion-reduce:animate-none" x="42" y="66" width="10" height="14" fill="#fbe6b8" opacity="0" transform="skewX(-20)" />
                </g>
                <line x1="60" y1="66" x2="60" y2="80" stroke="#1d4a30" strokeWidth="1.2" />
                <line x1="80" y1="66" x2="80" y2="80" stroke="#1d4a30" strokeWidth="1.2" />

                <rect x="160" y="78" width="46" height="50" rx="10" fill="#26543a" stroke="#7fb8d8" strokeWidth="1.5" />
                <circle className="animate-sg-ring motion-reduce:animate-none" cx="183" cy="103" r="16" fill="none" stroke="#7fb8d8" strokeWidth="1.5" />
                <polygon points="192,90 178,110 188,110 182,124 202,100 190,100" fill="#e8a53a" />

                <rect x="290" y="70" width="40" height="58" rx="8" fill="#173c26" stroke="#3a7a52" strokeWidth="1.5" />
                <rect x="295" y="78" width="30" height="38" rx="4" fill="#0f2e1c" />
                <circle cx="310" cy="97" r="8" fill="#5f9672" />
                <path d="M306,97 l3,3 l6,-7" stroke="#fbf8ef" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />

                <g className="animate-sg-spin motion-reduce:animate-none" style={{ transformOrigin: '330px 30px' }} stroke="#f0c580" strokeWidth="2" strokeLinecap="round" opacity=".9">
                  <line x1="330" y1="6" x2="330" y2="13" />
                  <line x1="356" y1="30" x2="349" y2="30" />
                  <line x1="348" y1="12" x2="343" y2="17" />
                  <line x1="348" y1="48" x2="343" y2="43" />
                  <line x1="312" y1="12" x2="317" y2="17" />
                </g>
                <circle className="animate-sg-glow motion-reduce:animate-none" cx="330" cy="30" r="13" fill="#e8a53a" />

                <line x1="0" y1="140" x2="360" y2="140" stroke="#3a7a52" strokeWidth="1.5" />
              </svg>
            </div>
          </div>

          <div className="relative z-[2] flex gap-[22px] text-xs text-[#a9c6b2]">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-sg-sky"></span> Live node status</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ background: '#e8a53a' }}></span> Secure JWT sessions</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center py-10 px-6 relative max-[860px]:py-8 max-[860px]:px-5">
          <div className="w-full max-w-[400px]">
            <div className="w-[84px] h-[84px] rounded-[22px] mx-auto mb-5 bg-white border border-sg-line flex items-center justify-center shadow-[0_14px_30px_-16px_rgba(29,74,48,.35)]">
              <img src="/logo-solar.svg" alt="SolarGrid" width="58" height="58" />
            </div>
            <h2 className="font-sg-serif m-0 text-[26px] text-center font-bold">Welcome back</h2>
            <p className="text-center text-sg-ink-soft text-[13.5px] mt-2 mb-7">Sign in with your staff account to continue</p>

            {errorMessage ? <div className="bg-sg-error-bg text-sg-error border border-[rgba(192,57,43,.25)] rounded-[10px] py-[11px] px-3.5 text-[13px] mb-[18px] text-center">{errorMessage}</div> : null}

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
                  <div className="mb-[18px]">
                    <label htmlFor="username" className="block text-[11.5px] font-bold text-sg-ink-soft uppercase tracking-[.05em] mb-2">Username</label>
                    <div className={'relative flex items-center bg-sg-field-bg border-[1.5px] rounded-xl px-3.5 transition-colors duration-150 focus-within:border-sg-panel-2 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(47,107,69,.1)]' + (touched.username && errors.username ? ' border-sg-error' : ' border-transparent')}>
                      <span className="flex items-center text-sg-ink-soft flex-none">
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
                        className="flex-1 border-none bg-transparent outline-none py-3.5 px-3 text-[14.5px] text-sg-ink font-inherit min-w-0"
                      />
                    </div>
                    {touched.username && errors.username ? <div className="text-sg-error text-xs mt-1.5">{errors.username}</div> : null}
                  </div>

                  <div className="mb-[18px]">
                    <label htmlFor="password" className="block text-[11.5px] font-bold text-sg-ink-soft uppercase tracking-[.05em] mb-2">Password</label>
                    <div className={'relative flex items-center bg-sg-field-bg border-[1.5px] rounded-xl px-3.5 transition-colors duration-150 focus-within:border-sg-panel-2 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(47,107,69,.1)]' + (touched.password && errors.password ? ' border-sg-error' : ' border-transparent')}>
                      <span className="flex items-center text-sg-ink-soft flex-none">
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
                        className="flex-1 border-none bg-transparent outline-none py-3.5 px-3 text-[14.5px] text-sg-ink font-inherit min-w-0"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="flex items-center justify-center cursor-pointer text-sg-ink-soft flex-none p-[7px] m-0 border-none bg-transparent rounded-lg transition-colors duration-150 hover:text-sg-panel-2 hover:bg-[rgba(47,107,69,.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-sg-panel-2 focus-visible:outline-offset-1"
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
                    {touched.password && errors.password ? <div className="text-sg-error text-xs mt-1.5">{errors.password}</div> : null}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full border-none rounded-xl py-[15px] text-[14.5px] font-bold text-white tracking-[.03em] uppercase bg-gradient-to-br from-sg-panel-2 to-sg-panel-1 cursor-pointer shadow-[0_16px_30px_-14px_rgba(29,74,48,.55)] transition-all duration-150 mt-1.5 hover:-translate-y-px hover:shadow-[0_20px_34px_-14px_rgba(29,74,48,.6)] active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    Sign in
                  </button>
                </form>
              )}
            </Formik>

            <div className="text-center mt-[26px] text-xs text-sg-ink-soft">Trouble signing in? Contact your <b className="text-sg-ink font-bold">Backoffice</b> administrator.</div>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default LoginView;
