import Image from 'next/image'

const GoldStarModal = () => {
  return (
    <div id="modal-gold-star" tabIndex={-1} aria-hidden="true" className="aegov-modal hidden z-[60]" role="dialog">
      <div className="relative sm:w-full sm:max-w-sm max-h-full">
        <div className="aegov-modal-wrapper py-4 md:py-5 xl:py-8 px-4 xl:px-6">
          <button type="button" className="aegov-modal-close top-2 end-2" data-modal-hide="modal-gold-star">
            <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
            </svg>
            <span className="sr-only">Close modal</span>
          </button>
          <div>
            <div className="text-center">
              <Image
                className="inline-block w-28 md:w-32 lg:w-36 xl:w-40 2xl:w-44 mb-4 xl:mb-6"
                src="https://designsystem.gov.ae/img/global-star.png"
                alt="Gold Star Rating"
                width={180}
                height={180}
              />
            </div>
            <div className="text-center">
              <p className="text-base text-aeblack-800 font-normal mb-4 xl:mb-6">
                The Federal Authority for Identity, Citizenship, Customs & Port Security was awarded a
                <a href="#" className="text-aegold-600 font-bold no-underline"> 5 star rating</a> by the Global Star Rating System for Services on 14/04/2022
              </p>
              <a href="#" className="aegov-btn">Learn more</a>
            </div>
            <div className="text-center mt-4 xl:mt-6">
              <a href="#" className="text-xs font-light truncate max-w-full no-underline">http://portal.gsr.ae/verify</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoldStarModal;
