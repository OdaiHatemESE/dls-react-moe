const LanguageModal = () => {
  return (
    <div id="modal-lang" tabIndex={-1} aria-hidden="true" className="aegov-modal hidden z-[60]" role="dialog">
      <div className="relative sm:w-full sm:max-w-sm max-h-full">
        <div className="aegov-modal-wrapper py-4 md:py-5 xl:py-8 px-4 xl:px-6">
          <button type="button" className="aegov-modal-close top-2 end-2" data-modal-hide="modal-lang">
            <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
            </svg>
            <span className="sr-only">Close modal</span>
          </button>
          <div>
            <div className="lang-header">
              <a href="#" className="lang-primary active">English</a>
              <span className="lang-primary-divider"></span>
              <a href="#" className="lang-primary font-notokufi">عربي</a>
            </div>
            <div className="lang-other px-3 md:px-4 xl:px-5">
              <div className="px-3 md:px-4 xl:px-5">
                <p className="lang-other-title">Other languages</p>
                <ul className="divide-y divide-aeblack-100">
                  <li>
                    <a href="#" className="lang-other-link">French</a>
                  </li>
                  <li>
                    <a href="#" className="lang-other-link">Spanish</a>
                  </li>
                  <li>
                    <a href="#" className="lang-other-link">German</a>
                  </li>
                  <li>
                    <a href="#" className="lang-other-link">Portuguese</a>
                  </li>
                  <li>
                    <a href="#" className="lang-other-link">Russian</a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-6 md:mt-8 lg:mt-10 xl:mt-12">
              <p className="lang-bottom-text">
                The list of “Other languages” listed above use Google Translate to create an automated translation of content for the purpose of display. Accuracy of automated content translation is not guaranteed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageModal;
