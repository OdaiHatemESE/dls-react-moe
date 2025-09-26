type Props = {
  id?: string;
  inputId?: string;
  className?: string;
  small?: boolean;
  placeholder?: string;
};

const SearchForm = ({ id, inputId, className = "", small = false, placeholder = "search for something" }: Props) => {
  return (
    <form action="#" method="post" id={id} className={className}>
      <div className={`aegov-form-control ${small ? "control-sm" : ""} w-64 xl:w-80`}>
        <div className="form-control-input">
          <input
            type="search"
            aria-label="search in site"
            name="searchelem"
            id={inputId}
            placeholder={placeholder}
          />
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
  );
};

export default SearchForm;
