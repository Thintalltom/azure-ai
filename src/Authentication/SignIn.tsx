import { useMsal } from "@azure/msal-react";
import { loginRequest } from "@/authConfig/authConfig";
import close from "@/assets/svg/close.svg";
import React from "react";
interface SignInProps {
  setShowNinDetails: React.Dispatch<React.SetStateAction<boolean>>;
}
const SignIn = ({ setShowNinDetails }: SignInProps) => {
  const { instance } = useMsal();
  const handleLogin = async (loginType: string) => {
    try {
      if (loginType === "popup") {
        await instance.loginPopup(loginRequest);
        setShowNinDetails(true);
      } else if (loginType === "redirect") {
        await instance.loginRedirect(loginRequest);
        setShowNinDetails(false);
      } else {
        throw new Error(`Unsupported login type: ${loginType}`);
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const closePopup = () => {
    setShowNinDetails(false);
    localStorage.removeItem("NINDETAILS");
  };
  return (
    <div className=" fixed inset-0 bg-opacity-[2%] bg-black backdrop-blur-sm flex gap-[35px] justify-center items-end md:items-center">
      <div className="bg-[#FFFFFF] rounded-[20px]   h-auto   w-full md:w-[40%] p-[20px] ">
        <div className="flex justify-between items-center mb-10">
          <p className="font-bold">Login</p>

          <img
            src={close}
            alt="close"
            className="cursor-pointer "
            onClick={closePopup}
          />
        </div>

        <div className="flex justify-center top-[30%] relative items-center flex-col gap-[20px]">
          <p className="text-sm text-center ">
            You need to Login with an INFINION account to use your NIN
          </p>
          <button
            onClick={() => handleLogin("popup")}
            className="bg-primary hover:shadow-lg   text-white h-[52px] w-[90%] mt-4 rounded-[12px] text-sm"
          >
            Log in
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
