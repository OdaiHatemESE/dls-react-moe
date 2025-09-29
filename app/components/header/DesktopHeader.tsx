import LogoGroup from "./LogoGroup";
import SearchForm from "./SearchForm";
import menuData from "@/app/data/menu.json";
import { MenuItem, isMegaMenu, slugify } from "./menuUtils";
import AuthButtons from "@/app/components/AuthButtons";

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
                  {menuData.items.map((item: MenuItem) => {
                    const id = slugify(item.label);
                    const hasChildren = !!item.children?.length;
                    const mega = hasChildren && isMegaMenu(item.label);
                    return (
                      <li key={id} className={`menu-item lg:inline-flex lg:items-center ${hasChildren ? "menu-item-has-children group" : ""} ${item.icon ? "has-link-icon" : ""}`}>
                        <a
                          href={item.href || "#"}
                          {...(hasChildren
                            ? { "data-dropdown-toggle": `${id}Hover`, "data-dropdown-trigger": "hover", className: "group-hover:!text-primary-800 group-hover:!border-primary-800" }
                            : { className: "hover:!text-primary-800 hover:!border-primary-800" })}
                        >
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
                            <button id={`${id}Menus`} data-dropdown-toggle={`${id}Hover`} className="submenu-btn flex-shrink-0 group-hover:!text-primary-800">
                              <span>
                                <span className="sr-only">show submenu for {item.label}</span>
                              </span>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                                <rect width="256" height="256" fill="none" />
                                <polyline points="208 96 128 176 48 96" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
                              </svg>
                            </button>
                            <div
                              id={`${id}Hover`}
                              className={`submenu hidden z-10 lg:py-4 xl:py-5 2xl:py-6 ${mega ? "!inset-x-0 !top-full !transform-none xl:px-4 2xl:px-5" : "rounded-bordered !-mt-2.5"}`}
                            >
                              <div className={mega ? "container" : "[&>div]:p-3 [&>div]:w-72 lg:flex lg:flex-wrap"} aria-labelledby={`${id}Menus`}>
                                {mega ? (
                                  <div className="lg:grid lg:grid-cols-5 [&>div]:p-3">
                                    {item.children!.map((group, gi) => (
                                      <div key={`${id}-g-${gi}`}>
                                        {group.title && <h2 className="submenu-title max-lg:text-sm">{group.title}</h2>}
                                        <ul className="space-y-1.5 xl:space-y-2 2xl:space-y-2.5">
                                          {group.links.map((l, li) => (
                                            <li className="menu-item" key={`${id}-l-${gi}-${li}`}>
                                              <a href={l.href}>{l.label}</a>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div>
                                    <div>
                                      {item.children!.map((group, gi) => (
                                        <div key={`${id}-g-${gi}`}>
                                          {group.title && <h2 className="submenu-title max-lg:text-sm">{group.title}</h2>}
                                          <ul className="space-y-1.5 xl:space-y-2 2xl:space-y-2.5">
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
                                )}
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

            <div className="header-navs-right">
              <ul className="flex items-center">
                <li>
                  <AuthButtons />
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
