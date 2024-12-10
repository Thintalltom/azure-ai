import { useMsal } from "@azure/msal-react";
import logout from "@/assets/svg/logout.svg";
import { useState } from "react";
const Signout = () => {
  const { instance } = useMsal();
  const [showLogout, setShowLogout] = useState<boolean>(false);

  const handleLogout = (logoutType: string) => {
    if (logoutType === "popup") {
      instance.logoutPopup({
        postLogoutRedirectUri: "/",
        mainWindowRedirectUri: "/",
      });
      sessionStorage.removeItem("NIN");
    } else if (logoutType === "redirect") {
      instance.logoutRedirect({
        postLogoutRedirectUri: "/",
      });
      sessionStorage.removeItem("NIN");
    }
  };
  return (
    <div className="  ">
      <button
        onMouseEnter={() => setShowLogout(true)}
        onMouseLeave={() => setShowLogout(false)}
        onClick={() => handleLogout("popup")}
        className="  text-white h-[35px] rounded text-sm"
      >
        <img src={logout} alt="Logo" />
      </button>
      {showLogout && (
        <div className="absolute flex items-center w-fit justify-center bottom-[37%] right-[3.5%] px-3 py-1 bg-primary text-white rounded-[12px] ">
          <p className="text-[14px] ">Log out</p>
        </div>
      )}
    </div>
  );
};

export default Signout;
