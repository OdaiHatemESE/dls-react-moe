import Image from 'next/image'

const LogoGroup = () => {
  return (
    <div className="header-logo logos">
      <div className="logo-item">
        <a href="#" className="logo block">
          <Image src="https://designsystem.gov.ae/img/logo-ministry.svg" alt="logo" width={120} height={40} />
          <span className="sr-only">Logo</span>
        </a>
      </div>
      <div className="logo-item">
        <a href="#" data-modal-target="modal-gold-star" data-modal-toggle="modal-gold-star" className="block">
          <Image src="https://designsystem.gov.ae/img/global-star.png" alt="logo" className="secondary-logo" width={40} height={40} />
          <span className="sr-only">Gold star Logo</span>
        </a>
      </div>
    </div>
  );
};

export default LogoGroup;
