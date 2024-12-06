import person from "@/assets/svg/person.svg";
import { useEffect, useState } from "react";
import VerificationModal from "../../components/Modal/VerificationModal";
import { InitialViewProps } from "@/Types";
import { useIsAuthenticated } from "@azure/msal-react";
import Signout from "../../Authentication/Signout";
import Logo from "@/assets/svg/logo.svg";

const BannerPage = ({initFaceLivenessDetector, Nin, setNin, handleFile, verifyImage, handleRemoveImage}:InitialViewProps) => {
const isAuthenticated = useIsAuthenticated()

const [popup, setPopup] = useState(false);
useEffect(() => {
  if(isAuthenticated) {
    setPopup(true)
  }

}, [isAuthenticated])
 
const showPopup = () => {
    setPopup(true);
  };
  return (
    <div className="max-h-[100vh] ">
      <div className="flex justify-between px-[30px] h-[12vh] items-center ">
      <img src={Logo} alt="Logo"  />
      {isAuthenticated ?  <Signout /> : <p>Demo App</p> }
     
      </div>

      <div className=" flex justify-center items-center h-[88vh]  gap-[10px] flex-col">
        <img src={person} alt="person" className=" " />
        <p className="text-lg font-bold">Verify your identity</p>
        <p className="text-xs text-slate-400">
          Secure and seamless identity verification in just a few steps.
        </p>

        <button
          className="bg-[#4A90E2] rounded-full  text-white w-[15rem]  h-[3rem] top-[20%] relative"
          onClick={showPopup}
        >
          Let's Verify
        </button>
        {popup ? <VerificationModal initFaceLivenessDetector={initFaceLivenessDetector} setNin= {setNin}
          Nin={Nin} handleFile={handleFile} verifyImage={verifyImage} handleRemoveImage={handleRemoveImage} setPopup={setPopup} /> : null}
      </div>
    </div>
  );
};

export default BannerPage;
