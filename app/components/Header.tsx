const Header = () => {
  return (
    <>
  <header className="aegov-header">
    <div className="header-desktop hidden lg:block">
       <div className="header-top py-3">
          <div className="container">
             <div className="lg:flex lg:items-center lg:justify-between">
                <div className="header-logo logos">
                   <div className="logo-item">
                     <a href="#" className="logo block"> <img src="https://designsystem.gov.ae/img/logo-ministry.svg" alt="logo" /> <span className="sr-only">Logo</span> </a>
                   </div>
                   <div className="logo-item">
                     <a href="#" data-modal-target="modal-gold-star" data-modal-toggle="modal-gold-star" className="block"> <img src="https://designsystem.gov.ae/img/global-star.png" alt="logo" className="secondary-logo" /> <span className="sr-only">Gold star Logo</span> </a>
                   </div>
                </div>
                <div className="header-top-right flex flex-wrap items-center">
                   <form action="#" method="post">
                      <div className="aegov-form-control w-64 xl:w-80 ">
                         <div className="form-control-input">
                            <input type="search" aria-label="search in site" name="searchelem" id="searchelem" placeholder="search for something" /> 
                            <button type="submit" className="control-suffix">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                                <rect width="256" height="256" fill="none"></rect>
                                <circle cx="112" cy="112" r="80" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></circle>
                                <line x1="168.57" y1="168.57" x2="224" y2="224" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line>
                              </svg>
                              <span className="sr-only">Search</span>
                           </button>
                         </div>
                      </div>
                   </form>
                </div>
             </div>
          </div>
       </div>
       <div className="header-navs">
          <div className="container">
             <div className="flex content-between flex-wrap lg:flex-nowrap lg:justify-between lg:items-center">
                <nav className="main-navigation" aria-label="Main navigation">
                   <div className="menu-main-menu-container">
                      <ul className="menu nav-menu lg:flex lg:items-center lg:gap-1 xl:gap-2">
                         <li className="menu-item lg:inline-flex lg:items-center has-link-icon">
                            <a href="#" className="hover:!text-primary-800 hover:!border-primary-800">
                               <svg className="text-inherit" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                                  <rect width="256" height="256" fill="none" />
                                  <path d="M152,208V160a8,8,0,0,0-8-8H112a8,8,0,0,0-8,8v48a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V115.54a8,8,0,0,1,2.62-5.92l80-75.54a8,8,0,0,1,10.77,0l80,75.54a8,8,0,0,1,2.62,5.92V208a8,8,0,0,1-8,8H160A8,8,0,0,1,152,208Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
                               </svg>
                               <span>Home</span> 
                            </a>
                         </li>
                         <li className="menu-item lg:inline-flex lg:items-center menu-item-has-children group">
                            <a href="#" data-dropdown-toggle="OurServicesHover" data-dropdown-trigger="hover" className="group-hover:!text-primary-800 group-hover:!border-primary-800">Services</a>
                            <button id="OurServicesMenus" data-dropdown-toggle="OurServicesHover" className="submenu-btn flex-shrink-0 group-hover:!text-primary-800">
                               <span><span className="sr-only">show submenu for "Service catalogue"</span></span>
                               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                                  <rect width="256" height="256" fill="none" />
                                  <polyline points="208 96 128 176 48 96" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
                               </svg>
                            </button>
                            <div id="OurServicesHover" className="submenu hidden z-10 lg:py-4 xl:py-5 2xl:py-6 !inset-x-0 !top-full !transform-none xl:px-4 2xl:px-5">
                               <div className="container">
                                  <div className="lg:grid lg:grid-cols-5 [&>div]:p-3" aria-labelledby="OurServicesMenus">
                                     <div>
                                        <h2 className="submenu-title max-lg:text-sm">Service category</h2>
                                        <ul className="space-y-1.5 xl:space-y-2 2xl:space-y-2.5">
                                           <li className="menu-item"> <a href="#">Service item number #1</a> </li>
                                           <li className="menu-item"> <a href="#">Service item number #2</a> </li>
                                           <li className="menu-item"> <a href="#">Service item number #3</a> </li>
                                           <li className="menu-item"> <a href="#">Service item number #4</a> </li>
                                           <li className="menu-item"> <a href="#">Service item number #5</a> </li>
                                           <li className="menu-item"> <a href="#">Service item number #6</a> </li>
                                           <li className="menu-item"> <a href="#">Service item number #7</a> </li>
                                           <li className="menu-item"> <a href="#">Service item number #8</a> </li>
                                           <li className="menu-item"> <a href="#">Service item number #9</a> </li>
                                           <li className="menu-item"> <a href="#">View all 40 services</a> </li>
                                        </ul>
                                     </div>
                                     <div>
                                        <h2 className="submenu-title max-lg:text-sm">Service category</h2>
                                        <ul className="space-y-1.5 xl:space-y-2 2xl:space-y-2.5">
                                           <li className="menu-item"> <a href="#">Service item number #1</a> </li>
                                           <li className="menu-item"> <a href="#">Service item number #2</a> </li>
                                           <li className="menu-item"> <a href="#">Service item number #3</a> </li>
                                           <li className="menu-item"> <a href="#">Service item number #4</a> </li>
                                           <li className="menu-item"> <a href="#">Service item number #5</a> </li>
                                           <li className="menu-item"> <a href="#">Service item number #6</a> </li>
                                           <li className="menu-item"> <a href="#">Service item number #7</a> </li>
                                           <li className="menu-item"> <a href="#">View all 40 services</a> </li>
                                        </ul>
                                     </div>
                                     <div>
                                        <h2 className="submenu-title max-lg:text-sm">Service category</h2>
                                        <ul className="space-y-1.5 xl:space-y-2 2xl:space-y-2.5">
                                           <li className="menu-item"> <a href="#">Service item number #1</a> </li>
                                           <li className="menu-item"> <a href="#">Service item number #2</a> </li>
                                           <li className="menu-item"> <a href="#">Service item number #3</a> </li>
                                           <li className="menu-item"> <a href="#">Service item number #4</a> </li>
                                           <li className="menu-item"> <a href="#">Service item number #5</a> </li>
                                           <li className="menu-item"> <a href="#">Service item number #6</a> </li>
                                           <li className="menu-item"> <a href="#">Service item number #7</a> </li>
                                           <li className="menu-item"> <a href="#">View all 20 services</a> </li>
                                        </ul>
                                     </div>
                                     <div>
                                        <h2 className="submenu-title max-lg:text-sm">Service category</h2>
                                        <ul className="space-y-1.5 xl:space-y-2 2xl:space-y-2.5">
                                           <li className="menu-item"> <a href="#">Service item number #1</a> </li>
                                           <li className="menu-item"> <a href="#">Service item number #2</a> </li>
                                           <li className="menu-item"> <a href="#">Service item number #3</a> </li>
                                           <li className="menu-item"> <a href="#">Service item number #4</a> </li>
                                           <li className="menu-item"> <a href="#">Service item number #5</a> </li>
                                           <li className="menu-item"> <a href="#">View all 10 services</a> </li>
                                        </ul>
                                     </div>
                                  </div>
                               </div>
                            </div>
                         </li>
                         <li className="menu-item lg:inline-flex lg:items-center"> <a href="#" className="hover:!text-primary-800 hover:!border-primary-800">A custom link</a> </li>
                         <li className="menu-item lg:inline-flex lg:items-center menu-item-has-children group">
                            <a href="#" data-dropdown-toggle="DigitalParticipationHover" data-dropdown-trigger="hover" className="group-hover:!text-primary-800 group-hover:!border-primary-800">Digital participation</a>
                            <button id="DigitalParticipationMenus" data-dropdown-toggle="DigitalParticipationHover" className="submenu-btn flex-shrink-0 group-hover:!text-primary-800">
                               <span><span className="sr-only">show submenu for "Digital participation"</span></span>
                               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                                  <rect width="256" height="256" fill="none" />
                                  <polyline points="208 96 128 176 48 96" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
                               </svg>
                            </button>
                            {/* submenu start from center */}
                            <div id="DigitalParticipationHover" className="submenu hidden z-10 lg:py-4 xl:py-5 2xl:py-6 rounded-bordered !-mt-2.5">
                               <div className="[&>div]:p-3 [&>div]:w-72 lg:flex lg:flex-wrap" aria-labelledby="DigitalParticipationMenus">
                                  <div>
                                     <h2 className="submenu-title max-lg:text-sm">Participate</h2>
                                     <ul className="space-y-1.5 xl:space-y-2 2xl:space-y-2.5">
                                        <li className="menu-item"> <a href="#">Events</a> </li>
                                        <li className="menu-item"> <a href="#">Social media channels</a> </li>
                                        <li className="menu-item"> <a href="#">Survey and polls</a> </li>
                                     </ul>
                                  </div>
                                  <div>
                                     <h2 className="submenu-title max-lg:text-sm">Media</h2>
                                     <ul className="space-y-1.5 xl:space-y-2 2xl:space-y-2.5">
                                        <li className="menu-item"> <a href="#">News and press releases</a> </li>
                                        <li className="menu-item"> <a href="#">Video archives</a> </li>
                                        <li className="menu-item"> <a href="#">Media gallery</a> </li>
                                        <li className="menu-item"> <a href="#">Insights and blogs</a> </li>
                                        <li className="menu-item"> <a href="#">Publications</a> </li>
                                     </ul>
                                  </div>
                                  <div>
                                     <h2 className="submenu-title max-lg:text-sm">Policies</h2>
                                     <ul className="space-y-1.5 xl:space-y-2 2xl:space-y-2.5">
                                        <li className="menu-item"> <a href="#">Digital participation policy</a> </li>
                                        <li className="menu-item"> <a href="#">Social media content policy</a> </li>
                                        <li className="menu-item"> <a href="#">National relationship management</a> </li>
                                     </ul>
                                  </div>
                               </div>
                            </div>
                         </li>
                         <li className="menu-item lg:inline-flex lg:items-center"> <a href="#" className="hover:!text-primary-800 hover:!border-primary-800">Open data</a> </li>
                         <li className="menu-item relative lg:inline-flex lg:items-center menu-item-has-children group">
                            <a href="#" data-dropdown-toggle="AboutHover" data-dropdown-trigger="hover" className="group-hover:!text-primary-800 group-hover:!border-primary-800">About</a>
                            <button id="AboutMenus" data-dropdown-toggle="AboutHover" className="submenu-btn flex-shrink-0 group-hover:!text-primary-800">
                               <span><span className="sr-only">show submenu for "About the ministry"</span></span>
                               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                                  <rect width="256" height="256" fill="none" />
                                  <polyline points="208 96 128 176 48 96" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
                               </svg>
                            </button>
                            {/* submenu start from center with single or two col */}
                            <div id="AboutHover" className="submenu hidden z-10 lg:py-4 xl:py-5 2xl:py-6 rounded-bordered !-mt-2.5">
                               <div className="[&>div]:p-3 [&>div]:w-72 lg:flex lg:flex-wrap" aria-labelledby="AboutMenus">
                                  <div>
                                     <ul className="space-y-1.5 xl:space-y-2 2xl:space-y-2.5">
                                        <li className="menu-item"> <a href="#">About the Ministry</a> </li>
                                        <li className="menu-item"> <a href="#">The Minister</a> </li>
                                        <li className="menu-item"> <a href="#">Minister of State for
                                           Financial Affairs</a> 
                                        </li>
                                        <li className="menu-item"> <a href="#">Organization chart</a> </li>
                                        <li className="menu-item"> <a href="#">Strategy</a> </li>
                                        <li className="menu-item"> <a href="#">Awards</a> </li>
                                        <li className="menu-item"> <a href="#">Contact</a> </li>
                                     </ul>
                                  </div>
                               </div>
                            </div>
                         </li>
                         <li className="menu-item relative lg:inline-flex lg:items-center menu-item-has-children group">
                            <a href="#" data-dropdown-toggle="MoreHover" data-dropdown-trigger="hover" className="group-hover:!text-primary-800 group-hover:!border-primary-800">More</a>
                            <button id="MoreMenus" data-dropdown-toggle="MoreHover" className="submenu-btn flex-shrink-0 group-hover:!text-primary-800">
                               <span><span className="sr-only">show submenu for "More"</span></span>
                               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                                  <rect width="256" height="256" fill="none" />
                                  <polyline points="208 96 128 176 48 96" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
                               </svg>
                            </button>
                            {/* submenu start from center with single or two col */}
                            <div id="MoreHover" className="submenu hidden z-10 lg:py-4 xl:py-5 2xl:py-6 rounded-bordered !-mt-2.5">
                               <div className="[&>div]:p-3 [&>div]:w-72 lg:flex lg:flex-wrap" aria-labelledby="MoreMenus">
                                  <div>
                                     <ul className="space-y-1.5 xl:space-y-2 2xl:space-y-2.5">
                                        <li className="menu-item"> <a href="#">Publications</a> </li>
                                        <li className="menu-item"> <a href="#">Press contact and media kit</a> </li>
                                        <li className="menu-item"> <a href="#">Federal debt management office</a> </li>
                                        <li className="menu-item"> <a href="#">Digital procurement</a> </li>
                                     </ul>
                                  </div>
                               </div>
                            </div>
                         </li>
                      </ul>
                   </div>
                </nav>
                <div className="header-navs-right">
                   <ul className="flex items-center">
                      <li>
                         <a href="#" data-tooltip-placement="bottom" data-tooltip-target="tooltip-login" className="lg:h-12 xl:h-14 lg:px-2 xl:px-3 flex items-center justify-center flex-shrink-0">
                            <svg className="flex-shrink-0 w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                               <rect width="256" height="256" fill="none" />
                               <circle cx="128" cy="96" r="64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
                               <path d="M32,216c19.37-33.47,54.55-56,96-56s76.63,22.53,96,56" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
                            </svg>
                            <span className="sr-only">Login</span> 
                         </a>
                         <div id="tooltip-login" role="tooltip" className="z-50 aegov-tooltip">
                            Login
                            <div className="tooltip-arrow" data-popper-arrow=""></div>
                         </div>
                      </li>
                      <li>
                         <a href="#" data-tooltip-placement="bottom" data-tooltip-target="tooltip-accessibility" className="lg:h-12 xl:h-14 lg:px-2 xl:px-3 flex items-center justify-center flex-shrink-0">
                            <svg className="flex-shrink-0 w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                               <rect width="256" height="256" fill="none" />
                               <circle cx="128" cy="40" r="24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
                               <path d="M39,102.9C27.31,97.5,31.15,80,44,80H212c12.87,0,16.71,17.5,5,22.9L160,128l22.87,86.93a12,12,0,0,1-21.75,10.14L128,168,94.88,225.07a12,12,0,0,1-21.75-10.14L96,128Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
                            </svg>
                            <span className="sr-only">Accessibility</span> 
                         </a>
                         <div id="tooltip-accessibility" role="tooltip" className="z-50 aegov-tooltip">
                            Accessibility
                            <div className="tooltip-arrow" data-popper-arrow=""></div>
                         </div>
                      </li>
                      <li>
                         <a href="#" data-modal-target="modal-lang" data-modal-toggle="modal-lang" data-tooltip-placement="bottom" data-tooltip-target="tooltip-Switch-language" className="lg:h-12 xl:h-14 lg:px-2 xl:px-3 flex items-center justify-center flex-shrink-0 no-underline !text-lg !font-normal">
                           <svg className="flex-shrink-0 w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"></rect><circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></circle><path d="M168,128c0,64-40,96-40,96s-40-32-40-96,40-96,40-96S168,64,168,128Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></path><line x1="37.46" y1="96" x2="218.54" y2="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></line><line x1="37.46" y1="160" x2="218.54" y2="160" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></line></svg> 
                           <span className="sr-only">Switch Language</span> 
                          </a>
                         <div id="tooltip-Switch-language" role="tooltip" className="z-50 aegov-tooltip">
                            Switch language
                            <div className="tooltip-arrow" data-popper-arrow=""></div>
                         </div>
                      </li>
                   </ul>
                </div>
             </div>
          </div>
       </div>
    </div>
    {/* header for mobile */}
    <div className="header-mobile lg:hidden">
       <div className="header-top py-2">
          <div className="container">
             <div className="max-lg:flex max-lg:items-center justify-between">
                <div className="header-logo logos">
                   <div className="logo-item">
                     <a href="#" className="logo block"> <img src="https://designsystem.gov.ae/img/logo-ministry.svg" alt="logo" /> <span className="sr-only">Logo</span> </a>
                   </div>
                   <div className="logo-item">
                     <a href="#" data-modal-target="modal-gold-star" data-modal-toggle="modal-gold-star" className="block"> <img src="https://designsystem.gov.ae/img/global-star.png" alt="logo" className="secondary-logo" /> <span className="sr-only">Gold star Logo</span> </a>
                   </div>
                </div>
                <div className="header-top-right">
                   <div>
                      <div className="flex items-center gap-3">
                         <button data-modal-target="openMenu" data-modal-toggle="openMenu" className="hamburger-icon text-aeblack-700">
                            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                               <rect width="256" height="256" fill="none"></rect>
                               <line x1="40" y1="128" x2="216" y2="128" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line>
                               <line x1="40" y1="64" x2="216" y2="64" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line>
                               <line x1="40" y1="192" x2="216" y2="192" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line>
                            </svg>
                            <span className="sr-only">Toggle main menu</span> 
                         </button>
                      </div>
                   </div>
                </div>
             </div>
          </div>
       </div>
       <div id="openMenu" tabIndex={-1} aria-hidden="true" className="responsive-menu !transform-none hidden [&_.main-navigation_.menu-item.active-page_a]:border-none [&_.accordion-active_svg]:rotate-180 max-lg:py-4 lg:hidden max-lg:bg-whitely-50 max-lg:fixed max-lg:inset-0 max-lg:w-full max-lg:[&_li_a]:w-full max-lg:[&_li_a]:py-2 max-lg:[&_.submenu-btn]:!absolute max-lg:[&_.submenu-btn]:end-0 max-lg:[&_.submenu-btn]:top-2 max-lg:[&_.submenu-btn]:w-6 max-lg:z-50 max-lg:flex-wrap max-lg:items-start max-lg:justify-start">
          <div className="w-full">
             <div className="w-full max-lg:px-4 flex items-center justify-between gap-4 mb-4">
               <a href="#"> <img src="https://designsystem.gov.ae/img/logo-ministry.svg" alt="logo" width={150} /> </a>
                <div className="flex items-center gap-4">
                   <button id="dropdownButtonSearch" data-dropdown-placement="bottom-end" data-dropdown-toggle="dropdownSearchMobile" className="aegov-btn btn-icon btn-soft btn-xs" type="button">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                         <rect width="256" height="256" fill="none"></rect>
                         <circle cx="112" cy="112" r="80" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></circle>
                         <line x1="168.57" y1="168.57" x2="224" y2="224" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line>
                      </svg>
                      <span className="sr-only">search in site</span> 
                   </button>
                   <button data-modal-hide="openMenu">
                      <svg aria-hidden="true" className="w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                         <rect width="256" height="256" fill="none" />
                         <line x1="200" y1="56" x2="56" y2="200" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
                         <line x1="200" y1="200" x2="56" y2="56" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
                      </svg>
                      <span className="sr-only">Close main menu</span> 
                   </button>
                </div>
             </div>
             <div className="max-lg:max-h-[calc(100vh_-_6.375rem)] max-lg:px-4 max-lg:overflow-auto">
                {/* Search for mobile dropdown */}
                <form action="#" method="post">
                   <div className="aegov-form-control control-sm w-64 xl:w-80 aegov-dropdown hidden max-md:!static max-md:!transform-none max-md:w-full" id="dropdownSearchMobile">
                      <div className="form-control-input">
                        <input type="search" aria-label="search in site" name="searchelem" id="searchelemMobile" placeholder="search for something" />
                         <button type="submit" className="control-suffix">
                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                              <rect width="256" height="256" fill="none"></rect>
                              <circle cx="112" cy="112" r="80" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></circle>
                              <line x1="168.57" y1="168.57" x2="224" y2="224" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line>
                           </svg>
                           <span className="sr-only">Search</span>
                        </button> 
                      </div>
                   </div>
                </form>
                <nav className="main-navigation mb-4" aria-label="Main navigation">
                   <div className="menu-main-menu-container">
                      <ul id="responsive-header-collapse" data-accordion="collapse" className="menu nav-menu">
                         <li className="menu-item has-link-icon">
                            <a href="#">
                               <svg className="text-inherit" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                                  <rect width="256" height="256" fill="none" />
                                  <path d="M152,208V160a8,8,0,0,0-8-8H112a8,8,0,0,0-8,8v48a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V115.54a8,8,0,0,1,2.62-5.92l80-75.54a8,8,0,0,1,10.77,0l80,75.54a8,8,0,0,1,2.62,5.92V208a8,8,0,0,1-8,8H160A8,8,0,0,1,152,208Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
                               </svg>
                               <span>Home</span> 
                            </a>
                         </li>
                         <li className="menu-item relative menu-item-has-children">
                            <a href="#">services</a>
                            <button className="submenu-btn flex-shrink-0" id="accordionOurServices" data-accordion-target="#accordion-collapse-service" aria-controls="accordion-collapse-service">
                               <span><span className="sr-only">show submenu for "services"</span></span>
                               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                                  <rect width="256" height="256" fill="none" />
                                  <polyline points="208 96 128 176 48 96" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
                               </svg>
                            </button>
                            {/* submenu start from left */}
                            <div id="accordion-collapse-service" className="submenu hidden z-10 bg-transparent" aria-labelledby="accordionOurServices">
                               <div className="[&>div]:p-3 [&_ul]:space-y-1.5">
                                  <div>
                                     <h2 className="submenu-title max-lg:text-sm">Service category</h2>
                                     <ul>
                                        <li className="menu-item"> <a href="#">Service item number #1</a> </li>
                                        <li className="menu-item"> <a href="#">Service item number #2</a> </li>
                                        <li className="menu-item"> <a href="#">Service item number #3</a> </li>
                                        <li className="menu-item"> <a href="#">Service item number #4</a> </li>
                                        <li className="menu-item"> <a href="#">Service item number #5</a> </li>
                                        <li className="menu-item"> <a href="#">Service item number #6</a> </li>
                                        <li className="menu-item"> <a href="#">Service item number #7</a> </li>
                                        <li className="menu-item"> <a href="#">Service item number #8</a> </li>
                                        <li className="menu-item"> <a href="#">Service item number #9</a> </li>
                                        <li className="menu-item"> <a href="#">View all 40 services</a> </li>
                                     </ul>
                                  </div>
                                  <div>
                                     <h2 className="submenu-title max-lg:text-sm">Service category</h2>
                                     <ul>
                                        <li className="menu-item"> <a href="#">Service item number #1</a> </li>
                                        <li className="menu-item"> <a href="#">Service item number #2</a> </li>
                                        <li className="menu-item"> <a href="#">Service item number #3</a> </li>
                                        <li className="menu-item"> <a href="#">Service item number #4</a> </li>
                                        <li className="menu-item"> <a href="#">Service item number #5</a> </li>
                                        <li className="menu-item"> <a href="#">Service item number #6</a> </li>
                                        <li className="menu-item"> <a href="#">Service item number #7</a> </li>
                                        <li className="menu-item"> <a href="#">View all 40 services</a> </li>
                                     </ul>
                                  </div>
                                  <div>
                                     <h2 className="submenu-title max-lg:text-sm">Service category</h2>
                                     <ul>
                                        <li className="menu-item"> <a href="#">Service item number #1</a> </li>
                                        <li className="menu-item"> <a href="#">Service item number #2</a> </li>
                                        <li className="menu-item"> <a href="#">Service item number #3</a> </li>
                                        <li className="menu-item"> <a href="#">Service item number #4</a> </li>
                                        <li className="menu-item"> <a href="#">Service item number #5</a> </li>
                                        <li className="menu-item"> <a href="#">Service item number #6</a> </li>
                                        <li className="menu-item"> <a href="#">Service item number #7</a> </li>
                                        <li className="menu-item"> <a href="#">View all 20 services</a> </li>
                                     </ul>
                                  </div>
                                  <div>
                                     <h2 className="submenu-title max-lg:text-sm">Service category</h2>
                                     <ul>
                                        <li className="menu-item"> <a href="#">Service item number #1</a> </li>
                                        <li className="menu-item"> <a href="#">Service item number #2</a> </li>
                                        <li className="menu-item"> <a href="#">Service item number #3</a> </li>
                                        <li className="menu-item"> <a href="#">Service item number #4</a> </li>
                                        <li className="menu-item"> <a href="#">Service item number #5</a> </li>
                                        <li className="menu-item"> <a href="#">View all 10 services</a> </li>
                                     </ul>
                                  </div>
                               </div>
                            </div>
                         </li>
                         <li className="menu-item relative"> <a href="#">A custom link</a> </li> 
                         <li className="menu-item relative menu-item-has-children">
                            <a href="#">Digital participation</a>
                            <button className="submenu-btn flex-shrink-0" id="accordionOurDigital" data-accordion-target="#accordion-collapse-digital" aria-controls="accordion-collapse-digital">
                               <span><span className="sr-only">show submenu for "Digital participation"</span></span>
                               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                                  <rect width="256" height="256" fill="none" />
                                  <polyline points="208 96 128 176 48 96" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
                               </svg>
                            </button>
                            <div id="accordion-collapse-digital" className="submenu hidden z-10 bg-transparent">
                               <div className="[&>div]:p-3 [&_ul]:space-y-1.5" aria-labelledby="DigitalParticipationButton">
                                  <div>
                                     <h2 className="submenu-title max-lg:text-sm">Participate</h2>
                                     <ul>
                                        <li className="menu-item"> <a href="#">Events</a> </li>
                                        <li className="menu-item"> <a href="#">Social media channels</a> </li>
                                        <li className="menu-item"> <a href="#">Survey and polls</a> </li>
                                     </ul>
                                  </div>
                                  <div>
                                     <h2 className="submenu-title max-lg:text-sm">Media</h2>
                                     <ul>
                                        <li className="menu-item"> <a href="#">News and press releases</a> </li>
                                        <li className="menu-item"> <a href="#">Video archives</a> </li>
                                        <li className="menu-item"> <a href="#">Media gallery</a> </li>
                                        <li className="menu-item"> <a href="#">Insights and blogs</a> </li>
                                        <li className="menu-item"> <a href="#">Publications</a> </li>
                                     </ul>
                                  </div>
                                  <div>
                                     <h2 className="submenu-title max-lg:text-sm">Policies</h2>
                                     <ul>
                                        <li className="menu-item"> <a href="#">Digital participation policy</a> </li>
                                        <li className="menu-item"> <a href="#">Social media content policy</a> </li>
                                        <li className="menu-item"> <a href="#">National relationship management</a> </li>
                                     </ul>
                                  </div>
                               </div>
                            </div>
                         </li>
                         <li className="menu-item relative"> <a href="#">Open data</a> </li>
                         <li className="menu-item relative menu-item-has-children active-page">
                            <a href="#" id="AboutUsButton">About us</a>
                            <button className="submenu-btn flex-shrink-0" id="accordionAbout" data-accordion-target="#accordion-collapse-about" aria-controls="accordion-collapse-about">
                               <span><span className="sr-only">show submenu for "About us"</span></span>
                               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                                  <rect width="256" height="256" fill="none" />
                                  <polyline points="208 96 128 176 48 96" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
                               </svg>
                            </button>
                            {/* submenu start from center */}
                            <div id="accordion-collapse-about" className="submenu hidden z-10 bg-transparent">
                               <div className="[&>div]:p-3 [&_ul]:space-y-1.5" aria-labelledby="AboutUsButton">
                                  <div>
                                     <ul>
                                        <li className="menu-item"> <a href="#">About the Ministry</a> </li>
                                        <li className="menu-item"> <a href="#">The Minister</a> </li>
                                        <li className="menu-item"> <a href="#">Minister of State for
                                           Financial Affairs</a> 
                                        </li>
                                        <li className="menu-item"> <a href="#">Organization chart</a> </li>
                                        <li className="menu-item"> <a href="#">Strategy</a> </li>
                                        <li className="menu-item"> <a href="#">Awards</a> </li>
                                        <li className="menu-item"> <a href="#">Contact</a> </li>
                                     </ul>
                                  </div>
                               </div>
                            </div>
                         </li>
                         <li className="menu-item relative menu-item-has-children">
                            <a href="#" id="MoreButton">More</a>
                            <button className="submenu-btn flex-shrink-0" id="accordionMore" data-accordion-target="#accordion-collapse-more" aria-controls="accordion-collapse-more">
                               <span><span className="sr-only">show submenu for "More"</span></span>
                               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                                  <rect width="256" height="256" fill="none" />
                                  <polyline points="208 96 128 176 48 96" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
                               </svg>
                            </button>
                            {/* submenu start from center with single or two col */}
                            <div id="accordion-collapse-more" className="submenu hidden z-10 bg-transparent">
                               <div className="[&>div]:p-3 [&_ul]:space-y-1.5" aria-labelledby="MoreButton">
                                  <div>
                                     <ul>
                                        <li className="menu-item"> <a href="#">Publications</a> </li>
                                        <li className="menu-item"> <a href="#">Press contact and media kit</a> </li>
                                        <li className="menu-item"> <a href="#">Federal debt management office</a> </li>
                                        <li className="menu-item"> <a href="#">Digital procurement</a> </li>
                                     </ul>
                                  </div>
                               </div>
                            </div>
                         </li>
                      </ul>
                   </div>
                </nav>
                <div className="header-top-right">
                   <div>
                      <ul className="header-common-links">
                         <li>
                            <a href="#">
                               <svg className="flex-shrink-0 w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                                  <rect width="256" height="256" fill="none" />
                                  <circle cx="128" cy="96" r="64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
                                  <path d="M32,216c19.37-33.47,54.55-56,96-56s76.63,22.53,96,56" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
                               </svg>
                               <span>Login</span> 
                            </a>
                         </li>
                         <li>
                            <a href="#">
                               <svg className="flex-shrink-0 w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                                  <rect width="256" height="256" fill="none" />
                                  <circle cx="128" cy="40" r="24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
                                  <path d="M39,102.9C27.31,97.5,31.15,80,44,80H212c12.87,0,16.71,17.5,5,22.9L160,128l22.87,86.93a12,12,0,0,1-21.75,10.14L128,168,94.88,225.07a12,12,0,0,1-21.75-10.14L96,128Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
                               </svg>
                               <span>Accessibility</span> 
                            </a>
                         </li>
                         <li>
                            <a   data-modal-target="modal-lang" data-modal-toggle="modal-lang">
                              <svg className="flex-shrink-0 w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"></rect><circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></circle><path d="M168,128c0,64-40,96-40,96s-40-32-40-96,40-96,40-96S168,64,168,128Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></path><line x1="37.46" y1="96" x2="218.54" y2="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></line><line x1="37.46" y1="160" x2="218.54" y2="160" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></line></svg>
                              <span>Switch Language</span> 
                            </a>
                         </li>
                      </ul>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
    {/* header for mobile end */}
 </header>
 
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
             <div className="lang-header"> <a href="#" className="lang-primary active">English</a> <span className="lang-primary-divider"></span> <a href="#" className="lang-primary font-notokufi">عربي</a> </div>
             <div className="lang-other px-3 md:px-4 xl:px-5">
                <div className="px-3 md:px-4 xl:px-5">
                   <p className="lang-other-title">Other languages</p>
                   <ul className="divide-y divide-aeblack-100">
                      <li> <a href="#" className="lang-other-link">French</a> </li>
                      <li> <a href="#" className="lang-other-link">Spanish</a> </li>
                      <li> <a href="#" className="lang-other-link">German</a> </li>
                      <li> <a href="#" className="lang-other-link">Portuguese</a> </li>
                      <li> <a href="#" className="lang-other-link">Russian</a> </li>
                   </ul>
                </div>
             </div>
             <div className="mt-6 md:mt-8 lg:mt-10 xl:mt-12">
                <p className="lang-bottom-text">The list of “Other languages” listed above use Google Translate to create an automated translation of content for the purpose of display. Accuracy of automated content translation is not guaranteed. </p>
             </div>
          </div>
       </div>
    </div>
 </div>
 
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
             <div className="text-center"> <img className="inline-block w-28 md:w-32 lg:w-36 xl:w-40 2xl:w-44 mb-4 xl:mb-6" src="https://designsystem.gov.ae/img/global-star.png" alt="Gold Star Rating" width={180} height={180} /> </div>
             <div className="text-center">
                <p className="text-base text-aeblack-800 font-normal mb-4 xl:mb-6">The Federal Authority for Identity, Citizenship, Customs & Port Security was awarded a <a href="#" className="text-aegold-600 font-bold no-underline"> 5 star rating</a> by the Global Star Rating System for Services on 14/04/2022 </p>
                <a href="#" className="aegov-btn">Learn more</a> 
             </div>
             <div className="text-center mt-4 xl:mt-6"> <a href="#" className="text-xs font-light truncate max-w-full no-underline">http://portal.gsr.ae/verify</a> </div>
          </div>
       </div>
    </div>
 </div>
 </>
  );
}

export default Header;
