/** Official Microsoft "Sign in with Microsoft" button — follows MS branding guidelines */
export default function MicrosoftButton({ onClick, disabled }) {
  return (
    <button className="ms-btn" onClick={onClick} disabled={disabled} id="btn-sign-in-microsoft">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21" width="21" height="21">
        <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
        <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
        <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
        <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
      </svg>
      <span>Sign in with Microsoft</span>
    </button>
  );
}
