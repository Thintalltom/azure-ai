
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "@/authConfig/authConfig";
import close from "@/assets/svg/close.svg";
import React from "react";
interface SignInProps {
  setShowNinDetails: React.Dispatch<React.SetStateAction<boolean>>
 
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
    <div className=" fixed inset-0 bg-opacity-[50%] bg-black backdrop-blur-sm flex gap-[35px] justify-center items-end md:items-center">
      <div className="bg-[#FFFFFF] rounded-[20px]   h-[50vh]   w-full md:w-[40%] p-[20px] ">
        <img
          src={close}
          onClick={closePopup}
          alt="close"
          className="cursor-pointer  float-right"
        />

        <div className="flex justify-center top-[30%] relative items-center flex-col gap-[15px]">
          <p className="text-sm text-center w-[70%]">You need to Login with an INFINION account to use your NIN</p>
          <button
            onClick={() => handleLogin("redirect")}
            className="bg-primary hover:shadow-lg   text-white h-[35px] w-[150px] rounded text-sm"
          >
            Log in
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
