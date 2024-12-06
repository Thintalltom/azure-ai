import './index.css'
import Screen from './Screen/Screen'
import { useIsAuthenticated } from "@azure/msal-react";
import Signout from "@/Authentication/Signout";
import Logo from "@/assets/svg/logo.svg";
function App() {
  const isAuthenticated = useIsAuthenticated()
  return (
    <div className='h-[100vh] '>
    <div className="flex justify-between px-[30px] fixed top-0 right-0 w-[100%] h-[12vh] items-center ">
      <img src={Logo} alt="Logo"  />
      {isAuthenticated ?  <Signout /> : <p>Demo App</p> }
     
      </div>
    <Screen />
    </div>
  )
}

export default App
