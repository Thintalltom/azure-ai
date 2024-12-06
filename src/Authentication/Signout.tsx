
import { useMsal } from "@azure/msal-react";
const Signout = () => {
  const { instance } = useMsal();

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
    <div className="flex gap-[20px]  ">
      <button
        onClick={() => handleLogout("redirect")}
        className="bg-primary hover:shadow-lg   text-white h-[35px] w-[150px] rounded text-sm"
      >
        Log out
      </button>
    </div>
  );
};

export default Signout;
