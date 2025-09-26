import DesktopHeader from "./header/DesktopHeader";
import MobileHeader from "./header/MobileHeader";
import LanguageModal from "./header/LanguageModal";
import GoldStarModal from "./header/GoldStarModal";

const Header = () => {
  return (
    <>
      <header className="aegov-header">
        <DesktopHeader />
        <MobileHeader />
      </header>

      {/* Global modals */}
      <LanguageModal />
      <GoldStarModal />
    </>
  );
};

export default Header;
