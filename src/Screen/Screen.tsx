import FaceLiveness from "@/Pages/FaceLiveness"
import { AlatContextProvider } from "@/context/AlatContextProvider";
const Screen = () => {
  return (
    <AlatContextProvider>
    <FaceLiveness />
    </AlatContextProvider>
  )
}

export default Screen