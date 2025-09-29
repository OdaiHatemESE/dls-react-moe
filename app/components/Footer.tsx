import React from "react";
import Image from "next/image";
import menuData from "@/app/data/menu.json";
import { slugify } from "./header/menuUtils";
export function Footer() {
  return (
   <footer className="aegov-footer">
    <div className="footer-top sm:py-6 md:py-12">
       <div className="container">
           <div className="footer-top-left sm:flex gap-3 xl:px-6">
                <nav aria-label="footer navigation" className="aegov-accordion aegov-mobile-accordion [&_.accordion-active_svg]:rotate-45 flex-1" id="mobile-accordion-collapse" data-accordion="collapse">
                    <ul className="grid sm:gap-x-2.5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-y-8 md:gap-y-12 w-full">
                        {menuData.footer?.groups?.map((group, idx) => {
                          const id = `mobile-accordion-${slugify(group.title || `group-${idx}`)}`;
                          return (
                            <li key={id} className="accordion-item border-b border-aeblack-100 sm:border-none">
                              <div className="accordion-title sm:mb-4" id={`${id}-heading`}>
                                <button
                                  className="max-sm:py-4 max-sm:flex justify-between sm:justify-start max-sm:items-center xl:cursor-default sm:pointer-events-none"
                                  aria-label="heading"
                                  type="button"
                                  data-accordion-target={`#${id}-body`}
                                  aria-expanded={idx === 0 ? "true" : "false"}
                                  aria-controls={`${id}-body`}
                                >
                                  <span>{group.title}</span>
                                  <svg className="sm:hidden" data-accordion-icon width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M21.375 12C21.375 12.2984 21.2565 12.5845 21.0455 12.7955C20.8345 13.0065 20.5484 13.125 20.25 13.125H13.125V20.25C13.125 20.5484 13.0065 20.8345 12.7955 21.0455C12.5845 21.2565 12.2984 21.375 12 21.375C11.7016 21.375 11.4155 21.2565 11.2045 21.0455C10.9935 20.8345 10.875 20.5484 10.875 20.25V13.125H3.75C3.45163 13.125 3.16548 13.0065 2.9545 12.7955C2.74353 12.5845 2.625 12.2984 2.625 12C2.625 11.7016 2.74353 11.4155 2.9545 11.2045C3.16548 10.9935 3.45163 10.875 3.75 10.875H10.875V3.75C10.875 3.45163 10.9935 3.16548 11.2045 2.9545C11.4155 2.74353 11.7016 2.625 12 2.625C12.2984 2.625 12.5845 2.74353 12.7955 2.9545C13.0065 3.16548 13.125 3.45163 13.125 3.75V10.875H20.25C20.5484 10.875 20.8345 10.9935 21.0455 11.2045C21.2565 11.4155 21.375 11.7016 21.375 12Z" fill="currentColor"/>
                                  </svg>
                                </button>
                              </div>
                              <div className="accordion-content hidden max-sm:py-4 sm:block" id={`${id}-body`} aria-labelledby={`${id}-heading`}>
                                <ul className="accordion-content-body">
                                  {group.links?.map((link, li) => (
                                    <li key={`${id}-l-${li}`}>
                                      <a href={link.href}>{link.label}</a>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </li>
                          );
                        })}
                    </ul>
                </nav>
                <div className=" text-center footer-contact lg:w-48 xl:w-[277px]">
                    <ul className="divide-y divide-aeblack-100">
                        <li>
                            <a href="">
                                <Image src="/images/tawasul.png" width={180} height={40} alt="Tawasol" className="mx-auto mb-4" />

                            </a>
                        </li>
                        <li className="custom-divide">
                            <a href="" className="inline-with-gap">
                                <svg className="fill-aegreen-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><path d="M152.27,37.93a8,8,0,0,1,9.8-5.66,86.22,86.22,0,0,1,61.66,61.66,8,8,0,0,1-5.66,9.8A8.23,8.23,0,0,1,216,104a8,8,0,0,1-7.73-5.93,70.35,70.35,0,0,0-50.33-50.34A8,8,0,0,1,152.27,37.93Zm-2.33,41.8c13.79,3.68,22.65,12.55,26.33,26.34A8,8,0,0,0,184,112a8.23,8.23,0,0,0,2.07-.27,8,8,0,0,0,5.66-9.8c-5.12-19.16-18.5-32.54-37.66-37.66a8,8,0,1,0-4.13,15.46Zm72.43,78.73-47.11-21.11-.13-.06a16,16,0,0,0-15.17,1.4,8.12,8.12,0,0,0-.75.56L134.87,160c-15.42-7.49-31.34-23.29-38.83-38.51l20.78-24.71c.2-.25.39-.5.57-.77a16,16,0,0,0,1.32-15.06l0-.12L97.54,33.64a16,16,0,0,0-16.62-9.52A56.26,56.26,0,0,0,32,80c0,79.4,64.6,144,144,144a56.26,56.26,0,0,0,55.88-48.92A16,16,0,0,0,222.37,158.46Z"/></svg>
                                <span>171</span>
                            </a>
                            <a href="" className="inline-with-gap">
                                <svg className="fill-aegreen-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><path d="M152.58,145.23l23,11.48A24,24,0,0,1,152,176a72.08,72.08,0,0,1-72-72A24,24,0,0,1,99.29,80.46l11.48,23L101,118a8,8,0,0,0-.73,7.51,56.47,56.47,0,0,0,30.15,30.15A8,8,0,0,0,138,155ZM232,128A104,104,0,0,1,79.12,219.82L45.07,231.17a16,16,0,0,1-20.24-20.24l11.35-34.05A104,104,0,1,1,232,128Zm-40,24a8,8,0,0,0-4.42-7.16l-32-16a8,8,0,0,0-8,.5l-14.69,9.8a40.55,40.55,0,0,1-16-16l9.8-14.69a8,8,0,0,0,.5-8l-16-32A8,8,0,0,0,104,64a40,40,0,0,0-40,40,88.1,88.1,0,0,0,88,88A40,40,0,0,0,192,152Z"/></svg>
                                <span>04-7771777</span>
                            </a>
                        </li>
                        <li className="inline-with-gap">
                            <span className="text-aeblack-500 inline-with-gap">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polyline points="160 56 160 96 200 96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="160" y1="96" x2="208" y2="48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M164.39,145.34a8,8,0,0,1,7.59-.69l47.16,21.13a8,8,0,0,1,4.8,8.3A48.33,48.33,0,0,1,176,216,136,136,0,0,1,40,80,48.33,48.33,0,0,1,81.92,32.06a8,8,0,0,1,8.3,4.8l21.13,47.2a8,8,0,0,1-.66,7.53L89.32,117a7.93,7.93,0,0,0-.54,7.81c8.27,16.93,25.77,34.22,42.75,42.41a7.92,7.92,0,0,0,7.83-.59Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
                                Toll free:
                            </span>
                            <a href="" className="">
                                800 12
                            </a>
                        </li>
                    </ul>
                </div>
           </div>
       </div>
    </div>
    <div className="footer-bottom py-6 md:py-12">
        <div className="container">
            <div className="flex flex-wrap gap-y-6 items-center justify-between">
                <div className="w-full lg:w-7/12">
                    <div className="text-aeblack-700 text-xs sm:text-sm mb-0">© 2023. Ministry of Human Resources & Emiratisation. All rights reserved. <span className="text-aeblack-500">Last updated on 24/04/2023 at 15:45</span></div>
                </div>
                <div className="w-full lg:w-5/12 social-sharing max-md:w-full justify-center lg:justify-end">
                    <span className="text-sm text-aeblack-700 max-sm:hidden">Follow us on: </span>
                    <ul className="flex items-center gap-6">
                        <li>
                            <a href="">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M168,88H152a24,24,0,0,0-24,24V224" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="96" y1="144" x2="160" y2="144" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
                                <span className="sr-only">facebook</span>
                            </a>
                        </li>
                        <li>
                            <a href="">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><circle cx="128" cy="128" r="40" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="16"/><rect x="32" y="32" width="192" height="192" rx="48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><circle cx="180" cy="76" r="12"/></svg>
                                <span className="sr-only">instagram</span>
                            </a>
                        </li>
                        <li>
                            <a href="">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><rect x="32" y="32" width="192" height="192" rx="8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="120" y1="112" x2="120" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="88" y1="112" x2="88" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M120,140a28,28,0,0,1,56,0v36" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><circle cx="88" cy="84" r="12"/></svg>
                                <span className="sr-only">LinkedIn</span>
                            </a>
                        </li>
                        <li>
                            <a href="">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><path d="M88,176S32.85,144,40.78,56c0,0,39.66,40,87.22,48V88c0-22,18-40.27,40-40a40.74,40.74,0,0,1,36.67,24H240l-32,32c-4.26,66.84-60.08,120-128,120-32,0-40-12-40-12S72,200,88,176Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
                                <span className="sr-only">twitter</span>
                            </a>
                        </li>
                        <li>
                            <a href="">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polygon points="160 128 112 96 112 160 160 128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M24,128c0,29.91,3.07,47.45,5.41,56.47A16,16,0,0,0,39,195.42C72.52,208.35,128,208,128,208s55.48.35,89-12.58a16,16,0,0,0,9.63-10.95c2.34-9,5.41-26.56,5.41-56.47s-3.07-47.45-5.41-56.47a16,16,0,0,0-9.63-11C183.48,47.65,128,48,128,48s-55.48-.35-89,12.58a16,16,0,0,0-9.63,11C27.07,80.54,24,98.09,24,128Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
                                <span className="sr-only">YouTube</span>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</footer>

  );
}

export default Footer;
