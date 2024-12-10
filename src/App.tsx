import "./index.css";
import Screen from "./Screen/Screen";
import { useIsAuthenticated } from "@azure/msal-react";
import Signout from "@/Authentication/Signout";
import Logo from "@/assets/svg/logo.svg";
function App() {
  const isAuthenticated = useIsAuthenticated();
  return (
    <div className="h-[100vh] ">
      <header className="flex justify-between px-[30px] fixed top-0 right-0 w-[100%] bg-white h-[90px] items-center ">
        <button onClick={() => window.location.reload()}>
          <img src={Logo} alt="Logo" />
        </button>
        {isAuthenticated ? (
          <Signout />
        ) : (
          <p className="font-[500] ">Demo App</p>
        )}
      </header>
      <Screen />
      <footer className="flex justify-center px-[30px] fixed bottom-0 right-0 w-[100%] bg-white h-[90px] items-center z-[10] ">
        <p className="text-[12px] md:text-[14px] text-[#6A6A6A] text-center ">
          &copy; 2024, Infinion Technologies. All rights reserved
        </p>
      </footer>
    </div>
  );
}

export default App;
