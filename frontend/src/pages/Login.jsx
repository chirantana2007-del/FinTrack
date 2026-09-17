import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="flex-1 flex items-center justify-center p-margin w-full">
      <main className="w-full max-w-lg bg-surface-container-lowest p-space-xl rounded-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="flex flex-col w-full">
<div className="flex flex-col items-center justify-center w-full">
<div className="w-full bg-surface-container-lowest shadow-sm rounded-lg p-space-lg flex flex-col gap-space-lg">
<div className="flex flex-col items-center text-center gap-space-sm">
<div className="h-10 w-auto flex items-center justify-center mb-space-xs">
<img alt="FinTrack Institutional Ledger System" className="h-9 w-auto object-contain" src="https://lh3.googleusercontent.com/aida/AEtjO1V71bkGGxdL_flU3BZgt-LW8zse4BuUfTTPEEngie2aJ8UMcBgNLO8tu8sHp4V6hpAKlj9EfPmofLtD12I7WKK9gThiOS5YLyO8XCd9msAMU8grbS-U40eAW_WTSQ6uU4w55DwJ2qjtgh7OSVOsHK9WFnZ843wn0_350cuiguCrdXaqQ2e_EKBeQXgV9vPHMrHa3XQTQ_oUWb2uEI5CzR3Jt15C4-zbeQBgsQbscOAWJOzzpFE_tsm1mGXy"/>
</div>
<div className="flex flex-col gap-space-xs">
<div className="inline-flex items-center justify-center gap-1.5 self-center px-2 py-0.5 rounded-DEFAULT bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
<span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            DBMS Engine v4.8 • Core Ledger
          </div>
<h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
            Sign in to your FinTrack account
          </h1>
<p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
            Enter your credentials to access your financial ledger and analytics
          </p>
</div>
</div>
<form className="flex flex-col gap-space-md" onSubmit={handleLogin} >
<div className="flex flex-col gap-1.5">
<label className="font-label-md text-label-md text-on-surface flex items-center justify-between" htmlFor="emailInput">
<span>Email Address</span>
</label>
<div className="relative flex items-center">
<span className="material-symbols-outlined absolute left-3 text-outline text-[18px] pointer-events-none select-none">
              alternate_email
            </span>
<input autocomplete="email" className="w-full pl-9 pr-3.5 py-2 text-on-surface bg-surface-container-lowest rounded-DEFAULT font-body-md text-body-md shadow-sm placeholder:text-outline/60 focus:outline-none focus:bg-surface-container-lowest transition-colors" id="emailInput"   placeholder="arjun.patel@example.com" required="" style={{ outline: "1px solid #c4c6ce;" }} type="email"/>
</div>
</div>
<div className="flex flex-col gap-1.5">
<div className="flex items-center justify-between">
<label className="font-label-md text-label-md text-on-surface" htmlFor="passwordInput">
              Password
            </label>
<button className="font-label-sm text-label-sm text-on-primary-container hover:text-primary transition-colors focus:outline-none"  type="button">
              Forgot password?
            </button>
</div>
<div className="relative flex items-center">
<span className="material-symbols-outlined absolute left-3 text-outline text-[18px] pointer-events-none select-none">
              lock
            </span>
<input autocomplete="current-password" className="w-full pl-9 pr-10 py-2 text-on-surface bg-surface-container-lowest rounded-DEFAULT font-numeric-md text-numeric-md shadow-sm placeholder:text-outline/60 focus:outline-none focus:bg-surface-container-lowest transition-colors tracking-widest" id="passwordInput"   placeholder="••••••••••••" required="" style={{ outline: "1px solid #c4c6ce;" }} type="password"/>
<button aria-label="Toggle password visibility" className="absolute right-2.5 p-1 text-outline hover:text-on-surface rounded-DEFAULT focus:outline-none transition-colors" id="togglePasswordBtn"  type="button">
<span className="material-symbols-outlined text-[18px] block" id="eyeIcon">visibility</span>
</button>
</div>
</div>
<div className="flex items-center justify-between pt-1">
<label className="inline-flex items-center gap-2 cursor-pointer select-none">
<input className="w-4 h-4 rounded-DEFAULT bg-surface-container-lowest text-primary accent-primary cursor-pointer transition-colors" id="rememberDevice" type="checkbox"/>
<span className="font-body-sm text-body-sm text-on-surface">Remember this workstation</span>
</label>
<span className="font-label-sm text-label-sm text-outline px-1.5 py-0.5 rounded-DEFAULT bg-surface-container-low font-numeric-sm">
            TTL: 30d
          </span>
</div>
<div className="flex flex-col gap-2 pt-space-xs">
<button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-container text-on-primary rounded-DEFAULT font-label-md text-label-md tracking-wide hover:bg-primary transition-colors active:scale-[0.99] shadow-sm" id="submitBtn" type="submit">
<span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
<span>Sign In to Ledger</span>
<span className="hidden material-symbols-outlined text-[16px] animate-spin" id="submitSpinner">
              progress_activity
            </span>
</button>
</div>
</form>
<div className="flex flex-col gap-space-sm pt-2">
<div className="flex flex-col items-center text-center gap-1 pt-1">
<div className="flex items-center justify-center gap-1.5 text-on-surface-variant font-body-sm text-body-sm">
<span className="material-symbols-outlined text-[14px] text-secondary">verified_user</span>
<span>Session secured with 256-bit JWT authentication &amp; salted bcrypt hashing</span>
</div>
<div className="flex items-center justify-center flex-wrap gap-2 font-label-sm text-label-sm text-outline">
<span>TLS 1.3 Strict</span>
<span>•</span>
<span>PCI-DSS Architectural Compliance</span>
<span>•</span>
<span>Node.js Auth Engine</span>
</div>
</div>
</div>
</div>
<div className="hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface px-4 py-2.5 rounded-DEFAULT shadow-lg font-body-sm text-body-sm flex items-center gap-2 transition-opacity z-50" id="statusToast">
<span className="material-symbols-outlined text-secondary-fixed text-[18px]">check_circle</span>
<span id="toastMessage">Demo credentials applied</span>
</div>
</div>

</div></main>
    </div>
  );
}
