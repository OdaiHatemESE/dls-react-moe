import LogoGroup from "./LogoGroup";
import SearchForm from "./SearchForm";

const DesktopHeader = () => {
  return (
    <div className="header-desktop hidden lg:block">
      <div className="header-top py-3">
        <div className="container">
          <div className="lg:flex lg:items-center lg:justify-between">
            <LogoGroup />
            <div className="header-top-right flex flex-wrap items-center">
              <SearchForm />
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
                        <path
                          d="M152,208V160a8,8,0,0,0-8-8H112a8,8,0,0,0-8,8v48a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V115.54a8,8,0,0,1,2.62-5.92l80-75.54a8,8,0,0,1,10.77,0l80,75.54a8,8,0,0,1,2.62,5.92V208a8,8,0,0,1-8,8H160A8,8,0,0,1,152,208Z"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="16"
                        />
                      </svg>
                      <span>Home</span>
                    </a>
                  </li>

                  <li className="menu-item lg:inline-flex lg:items-center menu-item-has-children group">
                    <a
                      href="#"
                      data-dropdown-toggle="OurServicesHover"
                      data-dropdown-trigger="hover"
                      className="group-hover:!text-primary-800 group-hover:!border-primary-800"
                    >
                      Services
                    </a>
                    <button id="OurServicesMenus" data-dropdown-toggle="OurServicesHover" className="submenu-btn flex-shrink-0 group-hover:!text-primary-800">
                      <span>
                        <span className="sr-only">show submenu for "Service catalogue"</span>
                      </span>
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
                              <li className="menu-item">
                                <a href="#">Service item number #1</a>
                              </li>
                              <li className="menu-item">
                                <a href="#">Service item number #2</a>
                              </li>
                              <li className="menu-item">
                                <a href="#">Service item number #3</a>
                              </li>
                              <li className="menu-item">
                                <a href="#">Service item number #4</a>
                              </li>
                              <li className="menu-item">
                                <a href="#">Service item number #5</a>
                              </li>
                              <li className="menu-item">
                                <a href="#">Service item number #6</a>
                              </li>
                              <li className="menu-item">
                                <a href="#">Service item number #7</a>
                              </li>
                              <li className="menu-item">
                                <a href="#">Service item number #8</a>
                              </li>
                              <li className="menu-item">
                                <a href="#">Service item number #9</a>
                              </li>
                              <li className="menu-item">
                                <a href="#">View all 40 services</a>
                              </li>
                            </ul>
                          </div>
                          <div>
                            <h2 className="submenu-title max-lg:text-sm">Service category</h2>
                            <ul className="space-y-1.5 xl:space-y-2 2xl:space-y-2.5">
                              <li className="menu-item">
                                <a href="#">Service item number #1</a>
                              </li>
                              <li className="menu-item">
                                <a href="#">Service item number #2</a>
                              </li>
                              <li className="menu-item">
                                <a href="#">Service item number #3</a>
                              </li>
                              <li className="menu-item">
                                <a href="#">Service item number #4</a>
                              </li>
                              <li className="menu-item">
                                <a href="#">Service item number #5</a>
                              </li>
                              <li className="menu-item">
                                <a href="#">Service item number #6</a>
                              </li>
                              <li className="menu-item">
                                <a href="#">Service item number #7</a>
                              </li>
                              <li className="menu-item">
                                <a href="#">View all 40 services</a>
                              </li>
                            </ul>
                          </div>
                          <div>
                            <h2 className="submenu-title max-lg:text-sm">Service category</h2>
                            <ul className="space-y-1.5 xl:space-y-2 2xl:space-y-2.5">
                              <li className="menu-item">
                                <a href="#">Service item number #1</a>
                              </li>
                              <li className="menu-item">
                                <a href="#">Service item number #2</a>
                              </li>
                              <li className="menu-item">
                                <a href="#">Service item number #3</a>
                              </li>
                              <li className="menu-item">
                                <a href="#">Service item number #4</a>
                              </li>
                              <li className="menu-item">
                                <a href="#">Service item number #5</a>
                              </li>
                              <li className="menu-item">
                                <a href="#">Service item number #6</a>
                              </li>
                              <li className="menu-item">
                                <a href="#">Service item number #7</a>
                              </li>
                              <li className="menu-item">
                                <a href="#">View all 20 services</a>
                              </li>
                            </ul>
                          </div>
                          <div>
                            <h2 className="submenu-title max-lg:text-sm">Service category</h2>
                            <ul className="space-y-1.5 xl:space-y-2 2xl:space-y-2.5">
                              <li className="menu-item">
                                <a href="#">Service item number #1</a>
                              </li>
                              <li className="menu-item">
                                <a href="#">Service item number #2</a>
                              </li>
                              <li className="menu-item">
                                <a href="#">Service item number #3</a>
                              </li>
                              <li className="menu-item">
                                <a href="#">Service item number #4</a>
                              </li>
                              <li className="menu-item">
                                <a href="#">Service item number #5</a>
                              </li>
                              <li className="menu-item">
                                <a href="#">View all 10 services</a>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>

                  <li className="menu-item lg:inline-flex lg:items-center">
                    <a href="#" className="hover:!text-primary-800 hover:!border-primary-800">
                      A custom link
                    </a>
                  </li>

                  <li className="menu-item lg:inline-flex lg:items-center menu-item-has-children group">
                    <a
                      href="#"
                      data-dropdown-toggle="DigitalParticipationHover"
                      data-dropdown-trigger="hover"
                      className="group-hover:!text-primary-800 group-hover:!border-primary-800"
                    >
                      Digital participation
                    </a>
                    <button id="DigitalParticipationMenus" data-dropdown-toggle="DigitalParticipationHover" className="submenu-btn flex-shrink-0 group-hover:!text-primary-800">
                      <span>
                        <span className="sr-only">show submenu for "Digital participation"</span>
                      </span>
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
                            <li className="menu-item">
                              <a href="#">Events</a>
                            </li>
                            <li className="menu-item">
                              <a href="#">Social media channels</a>
                            </li>
                            <li className="menu-item">
                              <a href="#">Survey and polls</a>
                            </li>
                          </ul>
                        </div>
                        <div>
                          <h2 className="submenu-title max-lg:text-sm">Media</h2>
                          <ul className="space-y-1.5 xl:space-y-2 2xl:space-y-2.5">
                            <li className="menu-item">
                              <a href="#">News and press releases</a>
                            </li>
                            <li className="menu-item">
                              <a href="#">Video archives</a>
                            </li>
                            <li className="menu-item">
                              <a href="#">Media gallery</a>
                            </li>
                            <li className="menu-item">
                              <a href="#">Insights and blogs</a>
                            </li>
                            <li className="menu-item">
                              <a href="#">Publications</a>
                            </li>
                          </ul>
                        </div>
                        <div>
                          <h2 className="submenu-title max-lg:text-sm">Policies</h2>
                          <ul className="space-y-1.5 xl:space-y-2 2xl:space-y-2.5">
                            <li className="menu-item">
                              <a href="#">Digital participation policy</a>
                            </li>
                            <li className="menu-item">
                              <a href="#">Social media content policy</a>
                            </li>
                            <li className="menu-item">
                              <a href="#">National relationship management</a>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </li>

                  <li className="menu-item lg:inline-flex lg:items-center">
                    <a href="#" className="hover:!text-primary-800 hover:!border-primary-800">
                      Open data
                    </a>
                  </li>

                  <li className="menu-item relative lg:inline-flex lg:items-center menu-item-has-children group">
                    <a href="#" data-dropdown-toggle="AboutHover" data-dropdown-trigger="hover" className="group-hover:!text-primary-800 group-hover:!border-primary-800">
                      About
                    </a>
                    <button id="AboutMenus" data-dropdown-toggle="AboutHover" className="submenu-btn flex-shrink-0 group-hover:!text-primary-800">
                      <span>
                        <span className="sr-only">show submenu for "About the ministry"</span>
                      </span>
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
                            <li className="menu-item">
                              <a href="#">About the Ministry</a>
                            </li>
                            <li className="menu-item">
                              <a href="#">The Minister</a>
                            </li>
                            <li className="menu-item">
                              <a href="#">Minister of State for
                                Financial Affairs</a>
                            </li>
                            <li className="menu-item">
                              <a href="#">Organization chart</a>
                            </li>
                            <li className="menu-item">
                              <a href="#">Strategy</a>
                            </li>
                            <li className="menu-item">
                              <a href="#">Awards</a>
                            </li>
                            <li className="menu-item">
                              <a href="#">Contact</a>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </li>

                  <li className="menu-item relative lg:inline-flex lg:items-center menu-item-has-children group">
                    <a href="#" data-dropdown-toggle="MoreHover" data-dropdown-trigger="hover" className="group-hover:!text-primary-800 group-hover:!border-primary-800">
                      More
                    </a>
                    <button id="MoreMenus" data-dropdown-toggle="MoreHover" className="submenu-btn flex-shrink-0 group-hover:!text-primary-800">
                      <span>
                        <span className="sr-only">show submenu for "More"</span>
                      </span>
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
                            <li className="menu-item">
                              <a href="#">Publications</a>
                            </li>
                            <li className="menu-item">
                              <a href="#">Press contact and media kit</a>
                            </li>
                            <li className="menu-item">
                              <a href="#">Federal debt management office</a>
                            </li>
                            <li className="menu-item">
                              <a href="#">Digital procurement</a>
                            </li>
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
                  <a
                    href="#"
                    data-modal-target="modal-lang"
                    data-modal-toggle="modal-lang"
                    data-tooltip-placement="bottom"
                    data-tooltip-target="tooltip-Switch-language"
                    className="lg:h-12 xl:h-14 lg:px-2 xl:px-3 flex items-center justify-center flex-shrink-0 no-underline !text-lg !font-normal"
                  >
                    <svg className="flex-shrink-0 w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" viewBox="0 0 256 256">
                      <rect width="256" height="256" fill="none"></rect>
                      <circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></circle>
                      <path d="M168,128c0,64-40,96-40,96s-40-32-40-96,40-96,40-96S168,64,168,128Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></path>
                      <line x1="37.46" y1="96" x2="218.54" y2="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></line>
                      <line x1="37.46" y1="160" x2="218.54" y2="160" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></line>
                    </svg>
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
  );
};

export default DesktopHeader;
