import LogoGroup from "./LogoGroup";
import SearchForm from "./SearchForm";
import menuData from "@/app/data/menu.json";
import { MenuItem, slugify } from "./menuUtils";
import AuthButtons from "@/app/components/AuthButtons";

const MobileHeader = () => {
  return (
    <div className="header-mobile lg:hidden">
      <div className="header-top py-2">
        <div className="container">
          <div className="max-lg:flex max-lg:items-center justify-between">
            <LogoGroup />
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

      <div
        id="openMenu"
        tabIndex={-1}
        aria-hidden="true"
        className="responsive-menu !transform-none hidden [&_.main-navigation_.menu-item.active-page_a]:border-none [&_.accordion-active_svg]:rotate-180 max-lg:py-4 lg:hidden max-lg:bg-whitely-50 max-lg:fixed max-lg:inset-0 max-lg:w-full max-lg:[&_li_a]:w-full max-lg:[&_li_a]:py-2 max-lg:[&_.submenu-btn]:!absolute max-lg:[&_.submenu-btn]:end-0 max-lg:[&_.submenu-btn]:top-2 max-lg:[&_.submenu-btn]:w-6 max-lg:z-50 max-lg:flex-wrap max-lg:items-start max-lg:justify-start"
      >
        <div className="w-full">
          <div className="w-full max-lg:px-4 flex items-center justify-between gap-4 mb-4">
            <a href="#">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://designsystem.gov.ae/img/logo-ministry.svg" alt="logo" width={150} />
            </a>
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
            <SearchForm id="dropdownSearchMobile" inputId="searchelemMobile" className="aegov-dropdown hidden max-md:!static max-md:!transform-none max-md:w-full" small />

            <nav className="main-navigation mb-4" aria-label="Main navigation">
              <div className="menu-main-menu-container">
                <ul id="responsive-header-collapse" data-accordion="collapse" className="menu nav-menu">
                  {menuData.items.map((item: MenuItem) => {
                    const id = slugify(item.label);
                    const hasChildren = !!item.children?.length;
                    return (
                      <li key={id} className={`menu-item relative ${hasChildren ? "menu-item-has-children" : ""} ${item.icon ? "has-link-icon" : ""}`}>
                        <a href={item.href || "#"} id={`${id}Button`}>
                          {item.icon === "home" && (
                            <svg className="text-inherit" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                              <rect width="256" height="256" fill="none" />
                              <path d="M152,208V160a8,8,0,0,0-8-8H112a8,8,0,0,0-8,8v48a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V115.54a8,8,0,0,1,2.62-5.92l80-75.54a8,8,0,0,1,10.77,0l80,75.54a8,8,0,0,1,2.62,5.92V208a8,8,0,0,1-8,8H160A8,8,0,0,1,152,208Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
                            </svg>
                          )}
                          <span>{item.label}</span>
                        </a>
                        {hasChildren && (
                          <>
                            <button className="submenu-btn flex-shrink-0" id={`accordion-${id}`} data-accordion-target={`#accordion-collapse-${id}`} aria-controls={`accordion-collapse-${id}`}>
                              <span>
                                <span className="sr-only">show submenu for {item.label}</span>
                              </span>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                                <rect width="256" height="256" fill="none" />
                                <polyline points="208 96 128 176 48 96" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
                              </svg>
                            </button>
                            <div id={`accordion-collapse-${id}`} className="submenu hidden z-10 bg-transparent" aria-labelledby={`accordion-${id}`}>
                              <div className="[&>div]:p-3 [&_ul]:space-y-1.5">
                                {item.children!.map((group, gi) => (
                                  <div key={`${id}-g-${gi}`}>
                                    {group.title && <h2 className="submenu-title max-lg:text-sm">{group.title}</h2>}
                                    <ul>
                                      {group.links.map((l, li) => (
                                        <li className="menu-item" key={`${id}-l-${gi}-${li}`}>
                                          <a href={l.href}>{l.label}</a>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </nav>

            <div className="header-top-right">
              <div>
                <ul className="header-common-links">
                  <li>
                    <AuthButtons />
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
                    <a data-modal-target="modal-lang" data-modal-toggle="modal-lang">
                      <svg className="flex-shrink-0 w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" viewBox="0 0 256 256">
                        <rect width="256" height="256" fill="none"></rect>
                        <circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></circle>
                        <path d="M168,128c0,64-40,96-40,96s-40-32-40-96,40-96,40-96S168,64,168,128Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></path>
                        <line x1="37.46" y1="96" x2="218.54" y2="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></line>
                        <line x1="37.46" y1="160" x2="218.54" y2="160" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></line>
                      </svg>
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
  );
};

export default MobileHeader;
